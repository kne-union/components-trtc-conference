import { createWithRemoteLoader } from '@kne/remote-loader';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Flex, List, Card, Button, Divider, Pagination, App, Empty, Progress } from 'antd';
import dayjs from 'dayjs';
import classnames from 'classnames';
import transform from 'lodash/transform';
import groupBy from 'lodash/groupBy';
import get from 'lodash/get';
import ScrollLoader from '@kne/scroll-loader';
import '@kne/scroll-loader/dist/index.css';
import { useIsMobile } from '@kne/responsive-utils';
import style from './style.module.scss';
import MenuBar from './MenuBar';
import PullToRefresh from './PullToRefresh';
import { ConferenceDetailInner } from './ConferenceDetail';
import EditConference, { EditConferenceButton } from './EditConference';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const isStandalonePwa = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.navigator.standalone === true || (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
};

const toAbsoluteUrl = url => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${window.location.origin}${path}`;
};

/** iOS Safari/PWA 会拦截 async 后的 window.open；PWA standalone 下新窗口也不可用，改为当前页跳转 */
const openDetailUrl = async getUrl => {
  const isPwa = isStandalonePwa();
  const popup = isPwa ? null : window.open('about:blank', '_blank');
  try {
    const url = typeof getUrl === 'function' ? await getUrl() : getUrl;
    const href = toAbsoluteUrl(url);
    if (popup) {
      popup.location.href = href;
      return;
    }
    window.location.assign(href);
  } catch (e) {
    popup?.close();
    throw e;
  }
};

const mergeConferenceList = (prev, next) => {
  return Object.assign({}, next, {
    pageData: [...(prev?.pageData || []), ...(next?.pageData || [])]
  });
};

const hasMemberAttended = member => {
  if (typeof member?.attended === 'boolean') {
    return member.attended;
  }
  if (typeof member?.hasJoined === 'boolean') {
    return member.hasJoined;
  }
  if (typeof member?.isJoined === 'boolean') {
    return member.isJoined;
  }
  return !!(member?.joinTime || member?.enterTime);
};

const buildFilterItems = (filterValue, formatMessage) => {
  const items = [];
  if (filterValue.keyword) {
    items.push({
      name: 'keyword',
      label: formatMessage({ id: 'FilterKeywordLabel' }),
      value: { label: filterValue.keyword, value: filterValue.keyword }
    });
  }
  if (filterValue.date) {
    const date = dayjs(filterValue.date);
    items.push({
      name: 'date',
      label: formatMessage({ id: 'FilterDateLabel' }),
      value: {
        label: filterValue.date,
        value: date.isValid() ? date.toDate() : filterValue.date
      }
    });
  }
  if (filterValue.record) {
    const record = String(filterValue.record);
    items.push({
      name: 'record',
      label: formatMessage({ id: 'FilterRecordLabel' }),
      value: {
        label: formatMessage({ id: record === 'video' ? 'RecordVideo' : record === 'audio' ? 'RecordAudio' : 'Close' }),
        value: record
      }
    });
  }
  if (filterValue.speech !== undefined && filterValue.speech !== null && filterValue.speech !== '') {
    const speech = String(filterValue.speech);
    items.push({
      name: 'speech',
      label: formatMessage({ id: 'FilterSpeechLabel' }),
      value: {
        label: formatMessage({ id: speech === 'true' ? 'Open' : 'Close' }),
        value: speech
      }
    });
  }
  return items;
};

const ConferenceInfo = createWithRemoteLoader({
  modules: [
    'components-core:ButtonGroup',
    'components-core:Icon',
    'components-core:StateTag',
    'components-core:Common@SimpleBar',
    'components-core:Filter',
    'components-core:Filter@FilterOuter',
    'components-core:Filter@FilterLines',
    'components-core:Filter@FilterValueDisplay',
    'components-core:Filter@SearchInput',
    'components-admin:Account@Language'
  ]
})(
  withLocale(
    ({
      remoteModules,
      className,
      user,
      current = 1,
      pageSize = 20,
      onPageChange,
      getDetailUrl,
      data,
      reload,
      loadMore,
      isComplete = true,
      requestParams,
      filterValue = {},
      onFilterChange,
      apis,
      actions
    }) => {
      const [conference, setConference] = useState(null);
      const [aiTranscriptionContent, setAiTranscriptionContent] = useState(null);
      const [ButtonGroup, Icon, StateTag, SimpleBar, Filter, FilterOuter, FilterLines, FilterValueDisplay, SearchInput, Language] = remoteModules;
      const { DatePickerFilterItem, SuperSelectFilterItem } = Filter.fields;
      const { message } = App.useApp();
      const { formatMessage } = useIntl();
      const isMobile = useIsMobile();
      const useLoadMoreMode = isMobile && typeof loadMore === 'function';
      const filterItems = useMemo(() => buildFilterItems(filterValue, formatMessage), [filterValue, formatMessage]);
      const hasValueDisplay = filterItems.length > 0;
      const filterList = useMemo(
        () => [
          {
            type: DatePickerFilterItem,
            props: {
              name: 'date',
              label: formatMessage({ id: 'FilterDateLabel' }),
              format: 'YYYY-MM-DD'
            }
          },
          {
            type: SuperSelectFilterItem,
            props: {
              name: 'record',
              label: formatMessage({ id: 'FilterRecordLabel' }),
              single: true,
              options: [
                { value: 'audio', label: formatMessage({ id: 'RecordAudio' }) },
                { value: 'video', label: formatMessage({ id: 'RecordVideo' }) },
                { value: 'false', label: formatMessage({ id: 'Close' }) }
              ]
            }
          },
          {
            type: SuperSelectFilterItem,
            props: {
              name: 'speech',
              label: formatMessage({ id: 'FilterSpeechLabel' }),
              single: true,
              options: [
                { value: 'true', label: formatMessage({ id: 'Open' }) },
                { value: 'false', label: formatMessage({ id: 'Close' }) }
              ]
            }
          }
        ],
        [DatePickerFilterItem, SuperSelectFilterItem, formatMessage]
      );
      const handleFilterItemsChange = useCallback(
        items => {
          const params = Filter.getFilterValue(items);
          onFilterChange?.({
            keyword: params.keyword || '',
            date: params.date ? dayjs(params.date).format('YYYY-MM-DD') : '',
            record: params.record || '',
            speech: params.speech ?? ''
          });
        },
        [Filter, onFilterChange]
      );
      const currentPageNum = Number(get(requestParams, ['params', 'currentPage'], current)) || 1;
      const loadMoreNoMore = !data?.totalCount || currentPageNum * pageSize >= data.totalCount;

      const openConference = useCallback(item => {
        setConference(item);
      }, []);

      const reloadConference = useCallback(() => {
        reload && reload();
      }, [reload]);

      const handleLoadMore = useCallback(async () => {
        if (!loadMore) {
          return;
        }
        const listParams = get(requestParams, 'params', {});
        await loadMore(
          {
            params: Object.assign({}, listParams, {
              perPage: pageSize,
              currentPage: currentPageNum + 1
            })
          },
          mergeConferenceList
        );
      }, [loadMore, pageSize, currentPageNum, requestParams]);

      const groupedList = useMemo(() => {
        if (!data?.pageData?.length) {
          return [];
        }
        return transform(
          groupBy(data.pageData, item => dayjs(item.startTime).format('YYYY-MM-DD')),
          (result, value) => {
            result.push(value.slice().sort((a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf()));
          },
          []
        ).sort((a, b) => dayjs(b[0]?.startTime).valueOf() - dayjs(a[0]?.startTime).valueOf());
      }, [data?.pageData]);

      useEffect(() => {
        if (!conference?.id || !data?.pageData) {
          return;
        }
        const latest = data.pageData.find(item => String(item.id) === String(conference.id));
        if (latest) {
          setConference(prev => {
            if (!prev || String(prev.id) !== String(latest.id)) {
              return prev;
            }
            return Object.assign({}, prev, latest);
          });
        }
      }, [data, conference?.id]);

      useEffect(() => {
        const shouldLoadTranscription =
          conference?.id && conference?.status === 1 && conference?.options?.setting?.speech && apis?.getAiTranscriptionContent;
        if (!shouldLoadTranscription) {
          setAiTranscriptionContent(null);
          return;
        }
        let cancelled = false;
        apis
          .getAiTranscriptionContent({ id: conference.id })
          .then(content => {
            if (!cancelled) {
              setAiTranscriptionContent(content || null);
            }
          })
          .catch(() => {
            if (!cancelled) {
              setAiTranscriptionContent(null);
            }
          });
        return () => {
          cancelled = true;
        };
      }, [apis, conference?.id, conference?.status, conference?.options?.setting?.speech]);

      const listNode =
        groupedList.length > 0 ? (
          groupedList.map(item => {
            const time = dayjs(item[0]?.startTime).format('YYYY-MM-DD');
            return (
              <Card key={time} className={style['date-card']} size="small" title={time}>
                <List
                  size="small"
                  dataSource={item}
                  renderItem={item => {
                    const members = item.members || [];
                    const attendedCount = members.filter(hasMemberAttended).length;
                    const options = [
                      {
                        type: 'primary',
                        size: 'small',
                        shape: 'round',
                        children: formatMessage({ id: 'View' }),
                        onClick: () => {
                          openConference(item);
                        }
                      }
                    ];
                    if (item.status === 0) {
                      options.push({
                        buttonComponent: EditConferenceButton,
                        data: item,
                        apis,
                        onSuccess: reload,
                        size: 'small',
                        shape: 'round',
                        children: formatMessage({ id: 'Edit' })
                      });
                    }
                    if (item.status === 0) {
                      options.push({
                        danger: true,
                        size: 'small',
                        shape: 'round',
                        children: formatMessage({ id: 'CancelMeeting' }),
                        confirm: true,
                        message: formatMessage({ id: 'CancelMeetingConfirm' }),
                        onClick: async () => {
                          await actions.cancel({ id: item.id });
                        }
                      });
                    }
                    if ([1, 2].indexOf(item.status) > -1) {
                      options.push({
                        size: 'small',
                        shape: 'round',
                        children: formatMessage({ id: 'Delete' }),
                        confirm: true,
                        onClick: async () => {
                          await actions.remove({ id: item.id });
                        }
                      });
                    }
                    const optionsNode = (
                      <div className={style['options-btn']}>
                        <ButtonGroup
                          list={isMobile ? options.map(option => Object.assign({}, option, { type: 'link', shape: undefined })) : options}
                          showLength={isMobile ? 2 : undefined}
                          split={isMobile ? <Divider type="vertical" /> : undefined}
                          more={<Button icon={<Icon type="icon-gengduo2" />} className="btn-no-padding" type="link" />}
                        />
                      </div>
                    );
                    return (
                      <List.Item className={classnames(style['list-item'], { [style['is-canceled']]: item.status === 2 })} key={item.id}>
                        <Flex vertical flex={1} gap={6} className={style['list-item-content']}>
                          <Flex justify="space-between" align="center" gap={8} className={style['list-item-header']}>
                            <Flex gap={8} align="center" className={style['list-title-area']}>
                              <div className={style['conference-title']}>{item.name}</div>
                              {item.status === 1 && <StateTag text={formatMessage({ id: 'Ended' })} />}
                              {item.status === 2 && <StateTag type="danger" text={formatMessage({ id: 'Canceled' })} />}
                            </Flex>
                            {!isMobile && optionsNode}
                          </Flex>
                          <Flex justify="space-between" align="center" gap={12} wrap className={style['list-item-meta']}>
                            <Flex gap={6} align="center" className={style['time']}>
                              <Icon type="icon-shijian" />
                              <span>
                                {dayjs(item.startTime).format('HH:mm')} - {dayjs(item.startTime).add(item.duration, 'second').format('HH:mm')}
                              </span>
                            </Flex>
                            <Flex gap={8} align="center" className={style['attendance-progress']}>
                              <Progress
                                percent={members.length > 0 ? (attendedCount / members.length) * 100 : 0}
                                showInfo={false}
                                size="small"
                                strokeColor="var(--primary-color)"
                              />
                              <span className={style['attendance-count']}>
                                {attendedCount}/{members.length}
                              </span>
                            </Flex>
                          </Flex>
                          {isMobile && optionsNode}
                        </Flex>
                      </List.Item>
                    );
                  }}
                />
              </Card>
            );
          })
        ) : (
          <Empty />
        );

      return (
        <Flex className={classnames(className, style['info'])}>
          <MenuBar
            apis={apis}
            user={user}
            reload={data => {
              reload && reload();
              data && openConference(data);
            }}
            onDetailEnter={item => openDetailUrl(getDetailUrl(item))}
          />
          <div className={style['right-panel-outer']}>
            {conference ? (
              <EditConference
                data={conference}
                apis={apis}
                onSuccess={() => {
                  reload && reload();
                  setConference(null);
                }}
              >
                {({ onClick: onEdit }) => {
                  return (
                    <ConferenceDetailInner
                      isAdmin
                      {...Object.assign({}, conference)}
                      aiTranscriptionContent={aiTranscriptionContent}
                      apis={apis}
                      onReload={reloadConference}
                      onDetailEnter={async item => {
                        await openDetailUrl(async () => {
                          const { shorten } = await actions.getMemberShorten(item);
                          return getDetailUrl({ shorten });
                        });
                      }}
                      onEdit={conference.status === 0 ? onEdit : undefined}
                      onCancel={async () => {
                        await actions.cancel({ id: conference.id });
                        reload && reload();
                        setConference(null);
                      }}
                      onDetailLinkCopy={async item => {
                        const { shorten } = await actions.getMemberShorten(item);
                        navigator.clipboard.writeText(window.location.origin + getDetailUrl({ shorten })).then(() => {
                          message.success(formatMessage({ id: 'LinkCopied' }));
                        });
                      }}
                      onBack={() => {
                        setConference(null);
                      }}
                    />
                  );
                }}
              </EditConference>
            ) : (
              <PullToRefresh disabled={!isMobile || !reload} onRefresh={reload}>
                <Flex vertical className={style['right-panel']}>
                  <div className={style['list-header']}>
                    <FilterOuter value={filterItems} onChange={handleFilterItemsChange} className={style['list-filter-outer']}>
                      {() => (
                        <div
                          className={classnames(style['list-header-section'], {
                            [style['has-mobile-search']]: isMobile,
                            [style['has-value-display']]: hasValueDisplay
                          })}
                        >
                          {isMobile ? (
                            <div className={style['list-search-row']}>
                              <div className={style['list-search-input']}>
                                <SearchInput
                                  name="keyword"
                                  label={formatMessage({ id: 'FilterKeywordLabel' })}
                                  placeholder={formatMessage({ id: 'FilterKeywordPlaceholder' })}
                                  allowClear
                                  style={{ width: '100%', maxWidth: '100%' }}
                                />
                              </div>
                              <Language colorful={false} />
                            </div>
                          ) : null}
                          <Flex className={style['title']} justify="space-between" align="center" gap={8}>
                            <div className={style['title-date']}>{dayjs().format(formatMessage({ id: 'DateFormat' }))}</div>
                            <div className={classnames(style['list-toolbar'], { [style['is-mobile']]: isMobile })}>
                              <div className={style['list-filter']}>
                                <div className={style['list-filter-inner']}>
                                  <FilterLines list={filterList} label="" displayLine={1} />
                                </div>
                              </div>
                              {isMobile ? null : (
                                <div className={style['list-toolbar-actions']}>
                                  <SearchInput
                                    name="keyword"
                                    label={formatMessage({ id: 'FilterKeywordLabel' })}
                                    placeholder={formatMessage({ id: 'FilterKeywordPlaceholder' })}
                                    allowClear
                                    className={style['list-filter-keyword']}
                                  />
                                  <Language colorful={false} />
                                </div>
                              )}
                            </div>
                          </Flex>
                          {hasValueDisplay ? (
                            <div className={style['list-value-display']}>
                              <FilterValueDisplay value={filterItems} onChange={handleFilterItemsChange} />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </FilterOuter>
                  </div>
                  <Divider className={style['divider']} />
                  <Flex vertical flex={isMobile ? undefined : 1} gap={10} className={style['list-content']}>
                    <div className={style['list-scroller-outer']}>
                      {useLoadMoreMode ? (
                        <ScrollLoader
                          className={classnames(style['scroller'], style['list-scroller'], style['mobile-load-more'])}
                          useSimpleBar={false}
                          isLoading={!isComplete}
                          noMore={loadMoreNoMore}
                          onLoader={handleLoadMore}
                          completeTips={data.totalCount > 0 ? undefined : null}
                        >
                          {listNode}
                        </ScrollLoader>
                      ) : (
                        <SimpleBar className={classnames(style['scroller'], style['list-scroller'])}>{listNode}</SimpleBar>
                      )}
                    </div>
                  </Flex>
                  {!useLoadMoreMode && (
                    <Flex justify={'center'} className={style['list-pagination-wrap']}>
                      <Pagination
                        hideOnSinglePage
                        className={style['list-pagination']}
                        total={data.totalCount}
                        pageSize={pageSize}
                        current={current}
                        onChange={(currentPage, nextPageSize) => {
                          onPageChange({ currentPage, pageSize: nextPageSize });
                        }}
                        showLessItems
                        showSizeChanger={false}
                      />
                    </Flex>
                  )}
                </Flex>
              </PullToRefresh>
            )}
          </div>
        </Flex>
      );
    }
  )
);

export default ConferenceInfo;
