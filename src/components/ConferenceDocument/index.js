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

const RemoteModule = createWithRemoteLoader({
  modules: ['components-core:Common@SimpleBar']
})(({ remoteModules, moduleProps, getSpeechInput }) => {
  const [SimpleBar] = remoteModules;
  const { module, props } = moduleProps;
  return (
    <SimpleBar className={style['main-scroller']}>
      <RemoteLoader {...props} module={module} getSpeechInput={getSpeechInput} />
    </SimpleBar>
  );
});

const ConferenceDocument = ({ type, ...props }) => {
  if (type === 'files') {
    return <Files {...props} />;
  }
  if (type === 'remote-module') {
    return <RemoteModule {...props} />;
  }
  return <div>Conference Document</div>;
};

export default ConferenceDocument;
