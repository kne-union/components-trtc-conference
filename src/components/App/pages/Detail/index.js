import { createWithRemoteLoader } from '@kne/remote-loader';
import { ConferenceDetail } from '@components/ConferenceInfo';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { setToken } from '@kne/token-storage';
import { useContext } from '../../context';

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
                onEnter={() => {
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
