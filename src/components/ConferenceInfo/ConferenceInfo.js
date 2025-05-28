import { createWithRemoteLoader } from '@kne/remote-loader';
import { useState } from 'react';
import { Flex, List, Card, Button, Divider, Pagination, App, Empty } from 'antd';
import dayjs from 'dayjs';
import classnames from 'classnames';
import transform from 'lodash/transform';
import groupBy from 'lodash/groupBy';
import style from './style.module.scss';
import MenuBar from './MenuBar';
import { ConferenceDetailInner } from './ConferenceDetail';
import EditConference, { EditConferenceButton } from './EditConference';

const ConferenceInfo = createWithRemoteLoader({
  modules: ['components-core:ButtonGroup', 'components-core:Icon', 'components-core:StateTag', 'components-core:Common@SimpleBar']
})(({ remoteModules, className, user, current = 1, pageSize = 20, onPageChange, getDetailUrl, data, reload, apis, actions }) => {
  const [conference, setConference] = useState(null);
  const [ButtonGroup, Icon, StateTag, SimpleBar] = remoteModules;
  const { message } = App.useApp();
  return (
    <Flex className={classnames(className, style['info'])}>
      <MenuBar
        apis={apis}
        user={user}
        reload={reload}
        onDetailEnter={item => {
          window.open(getDetailUrl(item), '_blank');
        }}
      />
      <div className={style['right-panel-outer']}>
        {conference ? (
          <SimpleBar className={style['scroller']}>
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
                    apis={apis}
                    onDetailEnter={async item => {
                      const { shorten } = await actions.getMemberShorten(item);
                      window.open(getDetailUrl({ shorten }), '_blank');
                    }}
                    onEdit={onEdit}
                    onDetailLinkCopy={async item => {
                      const { shorten } = await actions.getMemberShorten(item);
                      navigator.clipboard.writeText(window.location.origin + getDetailUrl({ shorten })).then(() => {
                        message.success('链接已复制');
                      });
                    }}
                    onBack={() => {
                      setConference(null);
                    }}
                  />
                );
              }}
            </EditConference>
          </SimpleBar>
        ) : (
          <Flex vertical className={style['right-panel']}>
            <div className={style['title']}>{dayjs().format('MM月DD日')}</div>
            <Divider className={style['divider']} />
            <Flex flex={1} vertical gap={10}>
              <div>
                <SimpleBar className={style['scroller']}>
                  {data.pageData.length > 0 ? (
                    transform(
                      groupBy(data.pageData, item => {
                        return dayjs(item.startTime).format('YYYY-MM-DD');
                      }),
                      (result, value) => {
                        result.push(value);
                      },
                      []
                    ).map(item => {
                      const time = dayjs(item[0]?.startTime).format('YYYY-MM-DD');
                      return (
                        <Card key={time} className={style['date-card']} size="small" title={time}>
                          <List
                            size="small"
                            dataSource={item}
                            renderItem={item => {
                              const options = [
                                {
                                  type: 'primary',
                                  size: 'small',
                                  shape: 'round',
                                  children: '查看',
                                  onClick: () => {
                                    setConference(item);
                                  }
                                },
                                {
                                  buttonComponent: EditConferenceButton,
                                  data: item,
                                  apis,
                                  onSuccess: reload,
                                  size: 'small',
                                  shape: 'round',
                                  children: '编辑'
                                }
                              ];
                              if (item.status === 1) {
                                options.push({
                                  size: 'small',
                                  shape: 'round',
                                  children: '删除',
                                  confirm: true,
                                  onClick: async () => {
                                    await actions.remove({ id: item.id });
                                  }
                                });
                              }
                              return (
                                <List.Item className={style['list-item']} key={item.id}>
                                  <Flex vertical flex={1}>
                                    <Flex justify="space-between">
                                      <Flex gap={8}>
                                        <div className={style['conference-title']}>
                                          {item.name}({item.members.length}/{item.maxCount})
                                        </div>
                                        <div>{item.status === 1 && <StateTag text="已结束" />}</div>
                                      </Flex>
                                      <div className={style['options-btn']}>
                                        <ButtonGroup
                                          list={options}
                                          more={<Button icon={<Icon type="icon-gengduo2" />} className="btn-no-padding" type="link" />}
                                        />
                                      </div>
                                    </Flex>
                                    <div className={style['time']}>
                                      {dayjs(item.startTime).format('HH:mm')} - {dayjs(item.startTime).add(item.duration, 'minute').format('HH:mm')}
                                    </div>
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
                  )}
                </SimpleBar>
              </div>
            </Flex>
            <Flex justify={'center'}>
              <Pagination
                hideOnSinglePage
                className={style['list-pagination']}
                total={data.totalCount}
                pageSize={pageSize}
                current={current}
                onChange={(currentPage, pageSize) => {
                  onPageChange({ currentPage, pageSize });
                }}
                showLessItems
                showSizeChanger={false}
              />
            </Flex>
          </Flex>
        )}
      </div>
    </Flex>
  );
});

export default ConferenceInfo;
