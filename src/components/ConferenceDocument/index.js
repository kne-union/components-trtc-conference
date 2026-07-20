import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import iFrameResize from '@kne/iframe-resizer';
import FileType from '@kne/react-file-type';
import { Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import style from './style.module.scss';

const FILE_TYPE_ALIAS = {
  jpeg: 'jpg'
};

const getFileType = filename => {
  if (!filename || typeof filename !== 'string') {
    return 'unknow';
  }
  const index = filename.lastIndexOf('.');
  if (index < 0 || index === filename.length - 1) {
    return 'unknow';
  }
  const ext = filename.slice(index + 1).toLowerCase();
  return FILE_TYPE_ALIAS[ext] || ext;
};

const FileOptionLabel = ({ filename, size = 18 }) => (
  <span className={style['files-option']}>
    <FileType type={getFileType(filename)} size={size} />
    <span className={style['files-option-name']}>{filename}</span>
  </span>
);

const Files = createWithRemoteLoader({
  modules: ['components-core:FilePreview', 'components-core:Common@SimpleBar']
})(({ remoteModules, files = [] }) => {
  const [FilePreview, SimpleBar] = remoteModules;
  const [current, setCurrent] = useState(0);
  const safeIndex = files.length ? Math.min(current, files.length - 1) : 0;
  const currentFile = files[safeIndex];
  const options = files.map((item, index) => ({
    value: index,
    filename: item.filename,
    label: <FileOptionLabel filename={item.filename} />,
    title: item.filename
  }));

  if (!files.length) {
    return null;
  }

  return (
    <div className={style['files']}>
      <div className={style['files-toolbar']}>
        <Select
          className={style['files-select']}
          popupClassName={style['files-select-dropdown']}
          variant="filled"
          value={safeIndex}
          options={options}
          showSearch
          listHeight={280}
          popupMatchSelectWidth={false}
          filterOption={(input, option) => {
            const filename = option?.filename || '';
            return filename.toLowerCase().includes(String(input).toLowerCase());
          }}
          onChange={index => setCurrent(index)}
        />
      </div>
      <SimpleBar className={style['files-preview']}>
        {currentFile ? <FilePreview {...currentFile} className={style['main']} /> : null}
      </SimpleBar>
    </div>
  );
});

const IframeDocument = ({ url }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !url) {
      return;
    }
    let resizers;
    try {
      // 被嵌入页面需引入 @kne/iframe-resizer 的 contentWindow.js，跨域时高度才能随内容自适应
      resizers = iFrameResize({ checkOrigin: false }, ref.current);
    } catch (error) {
      resizers = null;
    }
    return () => {
      (Array.isArray(resizers) ? resizers : []).forEach(iframe => {
        try {
          iframe?.iFrameResizer?.removeListeners?.();
        } catch (error) {
          // ignore cleanup errors
        }
      });
    };
  }, [url]);
  return (
    <div className={style['main-iframe-scroller']}>
      <iframe ref={ref} src={url} title="conference-document" className={style['main-iframe']} allow="clipboard-write" />
    </div>
  );
};

const ConferenceDocument = ({ type, ...props }) => {
  if (type === 'files') {
    return <Files {...props} />;
  }
  if (type === 'iframe') {
    return <IframeDocument url={props.url} />;
  }
  if (type === 'remote-module') {
    const { module, moduleProps, getSpeechInput, onSpeechStart, onSpeechEnd, getEndConferenceCallback } = props;
    return (
      <RemoteLoader
        {...moduleProps}
        module={module}
        onSpeechStart={onSpeechStart}
        onSpeechEnd={onSpeechEnd}
        getSpeechInput={getSpeechInput}
        getEndConferenceCallback={getEndConferenceCallback}
        className={style['main']}
      />
    );
  }
  return null;
};

export default ConferenceDocument;
