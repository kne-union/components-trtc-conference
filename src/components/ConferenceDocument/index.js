import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import iFrameResize from '@kne/iframe-resizer';
import { Flex, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import style from './style.module.scss';

const Files = createWithRemoteLoader({
  modules: ['components-core:FilePreview', 'components-core:Common@SimpleBar']
})(({ remoteModules, files }) => {
  const [FilePreview, SimpleBar] = remoteModules;
  const [current, setCurrent] = useState(0);
  return (
    <SimpleBar className={style['main-scroller']}>
      <Flex vertical>
        <Flex>
          <Select
            value={current}
            options={files.map((item, index) => {
              return { label: item.filename, value: index };
            })}
            onChange={index => {
              setCurrent(index);
            }}
          />
        </Flex>
        <Flex flex={1}>
          <FilePreview {...files[current]} className={style['main']} />
        </Flex>
      </Flex>
    </SimpleBar>
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
