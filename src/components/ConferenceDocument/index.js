import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Select } from 'antd';
import { useState } from 'react';
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

const ConferenceDocument = ({ type, ...props }) => {
  if (type === 'files') {
    return <Files {...props} />;
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
  return <div>Conference Document</div>;
};

export default ConferenceDocument;
