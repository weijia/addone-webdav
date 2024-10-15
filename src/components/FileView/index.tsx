import React, {useEffect, useState} from 'react';
import Utils from '@/_utils/utils';
import WebDavService from '@/services/webdav';
import {useRequest} from 'ahooks';
import {Modal, Image, Skeleton} from 'antd';
import memoizeOne from 'memoize-one';
import TextViewer from './TextViewer';
import styles from './index.less';
import ZipViewer from './ZipViewer';
import MdViewer from './MdViewer';
import {I18nKit} from '@hocgin/browser-addone-kit';
import AudioViewer from "@/components/FileView/AudioViewer";
import VideoViewer from "@/components/FileView/VideoViewer";
// @ts-ignore
import FileViewer from 'react-file-viewer';

/**
 * https://github.com/plangrid/react-file-viewer
 * @param fileUrl
 * @param fileType
 * @constructor
 */
export const FileView: React.FC<{
  className?: string;
  fileType?: string;
  fileUrl?: string;
}> = ({fileUrl, fileType = 'unknown'}) => {
  console.log(`fileType=${fileType}, fileUrl=${fileUrl}`);
  let viewerEl;
  if (['png', 'svg', 'bmp', 'jpeg', 'gif', 'jpg', 'webp', 'ico'].includes(fileType)) {
    viewerEl = <Image preview={false} src={fileUrl}/>;
  } else if (['txt', 'js', 'json', 'java', 'css', 'sh',
    'html', 'org',
    'ejs', 'ts', 'tsx'].includes(fileType)) {
    viewerEl = <TextViewer fileUrl={fileUrl}/>;
  } else if (['md'].includes(fileType)) {
    viewerEl = <MdViewer fileUrl={fileUrl}/>;
  } else if (['.mp3', '.wma', '.rm', '.wav', '.mid', '.ape', '.flac'].includes(fileType)) {
    viewerEl = <AudioViewer fileUrl={fileUrl}/>;
  } else if (['.mpg', '.mp4', '.mpeg', '.avi', '.rm', '.rmvb', '.mov', '.wmv', '.asf', '.dat', '.asx', '.wvx', '.mpe', '.mpa'].includes(fileType)) {
    viewerEl = <VideoViewer fileUrl={fileUrl}/>;
  } else if (['zip'].includes(fileType)) {
    viewerEl = <ZipViewer fileUrl={fileUrl}/>;
  } else {
    viewerEl = (
      <FileViewer fileType={fileType as any} filePath={fileUrl}/>
    );
  }
  return <div className={styles.viewer}>{viewerEl}</div>;
};

const getFileContent = memoizeOne(WebDavService.getFileContents);
const getFileBase64 = (data: ArrayBuffer, suffix: string = 'unknown') => {
  // let type = 'image';
  // if (['md', 'txt', 'unknown'].includes(suffix)) {
  //   suffix = 'plain';
  //   type = 'text';
  // }
  // return `data:${type}/${suffix};base64,${Buffer.from(data).toString('base64')}`;
  return window.URL.createObjectURL(new Blob([data]));
};

export const useFileView = (clientId?: string, _filename?: string) => {
  let [fileUrl, setFileUrl] = useState<string | undefined>();
  let [fileType, setFileType] = useState<string | undefined>();
  let updateFileData = (data: ArrayBuffer, filename: string) => {
    let fileType = Utils.getSuffix(filename);
    let fileUrl = getFileBase64(data, fileType);
    setFileType(fileType);
    setFileUrl(fileUrl);
  };
  let $getFileContents = useRequest(getFileContent, {
    manual: true,
    onSuccess: (data: ArrayBuffer, params: any) => {
      console.log('params', params);
      updateFileData(data, params?.[1]);
    },
  });
  return [
    fileUrl,
    fileType,
    $getFileContents.loading,
    {
      setFilename: (filename?: string) => {
        if (clientId && filename) {
          return $getFileContents.run(clientId, filename);
        } else {
          setFileUrl(undefined);
        }
      },
      setAsyncFilename: async (filename?: string) => {
        if (clientId && filename) {
          await $getFileContents.runAsync(clientId, filename);
        } else {
          setFileUrl(undefined);
        }
        return fileUrl;
      },
    },
  ] as const;
};

export const FileViewModal: React.FC<{
  className?: string;
  loading: boolean;
  visible?: boolean;
  clientId?: string;
  fileUrl?: string;
  fileType?: string;
  onCancel?: () => void;
}> = ({visible, loading, fileUrl, fileType, onCancel}) => {
  return (
    <Modal
      maskClosable={true}
      closable={false}
      title={I18nKit.getMessageOrDefault('preview' as any)}
      footer={null}
      className={styles.modal}
      onCancel={onCancel}
      open={visible}>
      {(visible && loading)
        ? <Skeleton active/>
        : <FileView fileType={fileType} fileUrl={fileUrl}/>}
    </Modal>
  );
};
