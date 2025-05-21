import { createWithRemoteLoader } from '@kne/remote-loader';
import Fetch from '@kne/react-fetch';
import { Navigate } from 'react-router-dom';
import ConferenceRoom from '../../ConferenceMain';
import { useContext } from '../../context';
import style from './style.module.scss';

const Conference = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis } = usePreset();
  const { baseUrl, name } = useContext();
  return (
    <Fetch
      {...Object.assign({}, apis[name].enterConference)}
      render={({ data }) => {
        return (
          <ConferenceRoom
            className={style['conference-room']}
            conference={data.conference}
            current={data.member}
            sdkParams={data.sign}
            baseUrl={baseUrl}
            apis={{
              saveMember: apis[name].saveMember,
              inviteMember: apis[name].inviteMember,
              removeMember: apis[name].removeMember,
              joinConference: apis[name].joinConference,
              endConference: apis[name].endConference
            }}
          />
        );
      }}
      error={<Navigate to={`${baseUrl}detail`} />}
    />
  );
});

export default Conference;
