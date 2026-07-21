import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceInfo from '@components/ConferenceInfo';
import { useSearchParams } from 'react-router-dom';
import Fetch from '@kne/react-fetch';
import style from '../../style.module.scss';
import { useContext } from '../../context';
import { App } from 'antd';
import withLocale from '../../withLocale';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import { useCallback, useMemo } from 'react';

const Home = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(withLocale(({ remoteModules }) => {
  const [usePreset] = remoteModules;
  const { apis, ajax } = usePreset();
  const { baseUrl, userInfo, name } = useContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const pageSize = 10;
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  const keyword = searchParams.get('keyword') || '';
  const date = searchParams.get('date') || '';
  const record = searchParams.get('record') || '';
  const speech = searchParams.get('speech') || '';
  const currentPage = isMobile ? 1 : Number(searchParams.get('page') || 1) || 1;
  const filterValue = useMemo(
    () => ({
      keyword,
      date,
      record,
      speech
    }),
    [keyword, date, record, speech]
  );

  const buildListParams = useCallback(
    (page = currentPage) => {
      return Object.assign(
        {
          perPage: pageSize,
          currentPage: page
        },
        keyword ? { keyword } : {},
        date ? { date } : {},
        record ? { record } : {},
        speech ? { speech } : {}
      );
    },
    [currentPage, date, keyword, pageSize, record, speech]
  );

  const handleFilterChange = useCallback(
    ({ keyword: nextKeyword = '', date: nextDate = '', record: nextRecord = '', speech: nextSpeech = '' }) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (nextKeyword) {
          next.set('keyword', nextKeyword);
        } else {
          next.delete('keyword');
        }
        if (nextDate) {
          next.set('date', nextDate);
        } else {
          next.delete('date');
        }
        if (nextRecord) {
          next.set('record', nextRecord);
        } else {
          next.delete('record');
        }
        if (nextSpeech) {
          next.set('speech', nextSpeech);
        } else {
          next.delete('speech');
        }
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  return (
    <div className={style['page']}>
      <div className={style['box']}>
        <Fetch
          {...Object.assign({}, apis[name].getConferenceList, {
            params: buildListParams()
          })}
          render={({ data, reload, loadMore, isComplete, requestParams }) => {
            const resetReload = () => {
              return reload({
                params: buildListParams(isMobile ? 1 : currentPage)
              });
            };
            return (
              <ConferenceInfo
                user={userInfo}
                current={currentPage}
                reload={resetReload}
                pageSize={pageSize}
                loadMore={isMobile ? loadMore : undefined}
                isComplete={isComplete}
                requestParams={requestParams}
                filterValue={filterValue}
                onFilterChange={handleFilterChange}
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
                  getTrtcInstanceEvents: apis[name].getTrtcInstanceEvents,
                  getAiTranscriptionContent: async ({ id }) => {
                    const { data: resData } = await ajax(
                      Object.assign({}, apis[name].getAiTranscriptionContent, {
                        params: { id }
                      })
                    );
                    if (resData.code !== 0) {
                      throw new Error(resData.msg);
                    }
                    return resData.data;
                  }
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
                    resetReload();
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
                    resetReload();
                  }
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
}));

export default Home;
