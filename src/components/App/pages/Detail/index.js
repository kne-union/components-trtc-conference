import { createWithRemoteLoader } from '@kne/remote-loader';
import { ConferenceDetail } from '@components/ConferenceInfo';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { setToken } from '@kne/token-storage';
import { useContext } from '../../context';
import prepareMediaPermission from '../../prepareMediaPermission';

const Detail = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis } = usePreset();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { baseUrl, headerName, name } = useContext();
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setToken(headerName, code);
      setSearchParams(searchParams => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('code');
        return newSearchParams;
      });
    }
  }, [searchParams, setSearchParams, headerName]);
  return (
    <div className={style['page']}>
      <div className={style['box']}>
        <Fetch
          {...Object.assign({}, apis[name].getConferenceDetail)}
          render={({ data, reload }) => {
            return (
              <ConferenceDetail
                {...data.conference}
                current={data.member}
                onBack={
                  data.member
                    ? () => {
                        navigate(baseUrl);
                      }
                    : undefined
                }
                onEnter={async () => {
                  // iOS PWA：必须在点击手势内先拿媒体权限，否则入会后 startLocal* 会被拦截
                  await prepareMediaPermission();
                  navigate(`${baseUrl}/conference`);
                }}
                onReload={() => {
                  console.log('---->reload');
                  reload();
                }}
                apis={{
                  saveMember: apis[name].saveMember,
                  inviteMember: apis[name].inviteMember,
                  removeMember: apis[name].removeMember,
                  joinConference: apis[name].joinConference,
                  getTrtcInstanceEvents: apis[name].getTrtcInstanceEvents
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
});

export default Detail;
