import { createWithRemoteLoader } from '@kne/remote-loader';
import { ConferenceDetail } from '@components/ConferenceInfo';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext } from '../../context';
import prepareMediaPermission from '../../prepareMediaPermission';

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
    <div className={style['page']}>
      <div className={style['box']}>
        <Fetch
          {...Object.assign({}, apis[name].getConferenceDetail, {
            params: {
              code
            }
          })}
          render={({ data, reload }) => {
            return (
              <ConferenceDetail
                {...data.conference}
                inviter={data.inviter}
                onEnter={async () => {
                  await prepareMediaPermission();
                  navigate(`${baseUrl}/conference`);
                }}
                onReload={data => {
                  if (data?.shorten) {
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
    </div>
  );
});

export default Invite;
