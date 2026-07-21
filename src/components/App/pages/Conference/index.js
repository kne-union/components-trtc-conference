import { createWithRemoteLoader } from '@kne/remote-loader';
import Fetch from '@kne/react-fetch';
import { Navigate, useNavigate } from 'react-router-dom';
import ConferenceRoom from '../../ConferenceMain';
import { useContext } from '../../context';
import style from './style.module.scss';

const Conference = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis } = usePreset();
  const { baseUrl, name, userInfo } = useContext();
  const navigate = useNavigate();
  return (
    <Fetch
      {...Object.assign({}, apis[name].enterConference)}
      render={({ data }) => {
        return (
          <ConferenceRoom
            className={style['conference-room']}
            conference={data.conference}
            current={data.member}
            onBack={
              userInfo
                ? () => {
                    navigate(baseUrl || '/');
                  }
                : undefined
            }
            sdkParams={data.sign}
            baseUrl={baseUrl}
            apis={{
              saveMember: apis[name].saveMember,
              inviteMember: apis[name].inviteMember,
              removeMember: apis[name].removeMember,
              joinConference: apis[name].joinConference,
              endConference: apis[name].endConference,
              startAITranscription: apis[name].startAITranscription,
              stopAITranscription: apis[name].stopAITranscription,
              recordAITranscription: apis[name].recordAITranscription,
              recordClientEvents: apis[name].recordClientEvents,
              getAiTranscriptionContent: apis[name].getAiTranscriptionContent,
              extendDuration: apis[name].extendDuration
            }}
          />
        );
      }}
      error={<Navigate to={`${baseUrl}/detail`} />}
    />
  );
});

export default Conference;
