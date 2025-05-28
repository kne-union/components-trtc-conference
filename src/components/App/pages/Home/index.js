import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceInfo from '@components/ConferenceInfo';
import { useSearchParams } from 'react-router-dom';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useContext } from '../../context';
import { App } from 'antd';

const Home = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis, ajax } = usePreset();
  const { baseUrl, userInfo, name } = useContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 10;
  const { message } = App.useApp();
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
                return `${baseUrl}/detail?code=${item.shorten}`;
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
                save: apis[name].saveConference,
                inviteMember: Object.assign(apis[name].inviteMemberFormUser),
                getMemberShorten: apis[name].getMemberShorten
              }}
              actions={{
                getMemberShorten: async ({ id }) => {
                  const { data: resData } = await ajax(
                    Object.assign({}, apis[name].getMemberShorten, {
                      params: { id }
                    })
                  );
                  if (resData.code !== 0) {
                    throw new Error(resData.msg);
                  }
                  return resData.data;
                },
                remove: async ({ id }) => {
                  const { data: resData } = await ajax(
                    Object.assign({}, apis[name].deleteConference, {
                      data: { id }
                    })
                  );

                  if (resData.code !== 0) {
                    return;
                  }
                  message.success('删除成功');
                  reload();
                }
              }}
            />
          );
        }}
      />
    </div>
  );
});

export default Home;
