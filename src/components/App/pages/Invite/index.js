import { createWithRemoteLoader } from '@kne/remote-loader';
import { ConferenceDetail } from '@components/ConferenceInfo';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { getToken } from '@kne/token-storage';
import localStorage from '@kne/local-storage';
import { useContext } from '../../context';

const Invite = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis } = usePreset();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { baseUrl, headerName, name } = useContext();
  const code = searchParams.get('code');
  return (
    <div className={style['box']}>
      <Fetch
        {...Object.assign({}, apis[name].getConferenceDetail, {
          options: {
            headers: {
              [headerName]: code
            }
          }
        })}
        render={({ data, reload }) => {
          const conferenceIdKey = 'CURRENT_CONFERENCE_ID';
          const token = getToken(headerName);
          if (localStorage.getItem(conferenceIdKey) === data.conference.id && token) {
            return <Navigate to={`${baseUrl}/detail?code=${token}`} replace />;
          }
          const conferenceId = data.conference.id;
          return (
            <ConferenceDetail
              {...data.conference}
              inviter={data.inviter}
              onEnter={() => {
                navigate(`${baseUrl}/conference`);
              }}
              onReload={data => {
                if (data?.shorten) {
                  localStorage.setItem(conferenceIdKey, conferenceId);
                  window.location.href = `${window.location.origin}${baseUrl}/detail?code=${data.shorten}`;
                  return;
                }
                reload();
              }}
              apis={{
                saveMember: apis[name].saveMember,
                inviteMember: apis[name].inviteMember,
                removeMember: apis[name].removeMember,
                joinConference: Object.assign({}, apis[name].joinConference, {
                  headers: { [headerName]: code }
                })
              }}
            />
          );
        }}
      />
    </div>
  );
});

export default Invite;
