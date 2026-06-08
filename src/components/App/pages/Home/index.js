import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceInfo from '@components/ConferenceInfo';
import { useSearchParams } from 'react-router-dom';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useContext } from '../../context';
import { App } from 'antd';
import withLocale from '../../withLocale';
import { useIntl } from '@kne/react-intl';

const Home = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(withLocale(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis, ajax } = usePreset();
  const { baseUrl, userInfo, name } = useContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 10;
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
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
                inviteMember: Object.assign(apis[name].inviteMemberFromUser),
                getMemberShorten: apis[name].getMemberShorten,
                getTrtcInstanceEvents: apis[name].getTrtcInstanceEvents
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
                cancel: async ({ id } = {}) => {
                  const { data: resData } = await ajax(
                    Object.assign({}, apis[name].cancelConference, id ? { data: { id } } : {})
                  );
                  if (resData.code !== 0) {
                    return;
                  }
                  message.success(formatMessage({ id: 'CancelMeetingSuccess' }));
                  reload();
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
                  message.success(formatMessage({ id: 'DeleteSuccess' }));
                  reload();
                }
              }}
            />
          );
        }}
      />
    </div>
  );
}));

export default Home;
