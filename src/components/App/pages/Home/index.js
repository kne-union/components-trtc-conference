import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceInfo from '@components/ConferenceInfo';
import { useSearchParams } from 'react-router-dom';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useContext } from '../../context';

const Home = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis } = usePreset();
  const { baseUrl, userInfo, name } = useContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 10;
  return (
    <div className={style['box']}>
      <Fetch
        {...Object.assign({}, apis[name].getConferenceList, {
          params: {
            perPage: pageSize,
            currentPage: searchParams.get('page') || 1
          }
        })}
        render={({ data, reload }) => {
          return (
            <ConferenceInfo
              user={userInfo}
              current={searchParams.get('page') || 1}
              reload={reload}
              pageSize={pageSize}
              getDetailUrl={item => {
                return `${baseUrl}detail?code=${item.shorten}`;
              }}
              onPageChange={({ currentPage }) => {
                setSearchParams(searchParams => {
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.set('page', currentPage);
                  return newSearchParams;
                });
              }}
              data={data}
              apis={{
                create: apis[name].createConference,
                inviteMember: apis[name].inviteMember
              }}
            />
          );
        }}
      />
    </div>
  );
});

export default Home;
