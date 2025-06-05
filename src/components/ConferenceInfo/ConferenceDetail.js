import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Card, Divider, Button, Alert, App, Empty } from 'antd';
import dayjs from 'dayjs';
import classnames from 'classnames';
import style from './style.module.scss';
import SaveMember from './SaveMember';
import InviteMember from './InviteMember';
import JoinConference from './JoinConference';
import formatConferenceTime from './formatConferenceTime';
import ConferenceCountDown from './ConferenceCountDown';
import get from 'lodash/get';
import transform from 'lodash/transform';

export const ConferenceDetailInner = createWithRemoteLoader({
  modules: [
    'components-core:Icon',
    'components-core:Image',
    'components-core:InfoPage',
    'components-core:InfoPage@TableView',
    'components-core:StateTag',
    'components-core:ConfirmButton',
    'components-core:Global@usePreset',
    'components-core:LoadingButton',
    'components-core:FilePreview',
    'components-core:Common@SimpleBar'
  ]
})(({
  remoteModules,
  id,
  current,
  inviter,
  startTime,
  duration,
  name,
  status,
  isInvitationAllowed,
  maxCount,
  members = [],
  options,
  apis,
  onReload,
  onEnter,
  onDetailEnter,
  onDetailLinkCopy,
  onEdit,
  onBack,
  isAdmin
}) => {
  const [Icon, Image, InfoPage, TableView, StateTag, ConfirmButton, usePreset, LoadingButton, FilePreview, SimpleBar] = remoteModules;
  const { ajax } = usePreset();
  const { message } = App.useApp();

  return (
    <Flex vertical flex={1} className={style['right-panel']}>
      <Flex className={style['title']} gap={8} justify="space-between">
        <Flex gap={8}>
          {onBack && (
            <Button
              type="link"
              className="btn-no-padding"
              icon={<Icon type="icon-arrow-thin-left" />}
              style={{ gap: '0' }}
              onClick={() => {
                onBack();
              }}
            >
              返回
            </Button>
          )}
          <div>{name}</div>
          <div>({formatConferenceTime({ startTime, duration })})</div>
        </Flex>
        {onEdit && status === 0 && (
          <Button type="link" onClick={onEdit}>
            编辑
          </Button>
        )}
      </Flex>
      <Divider className={style['divider']} />
      <SimpleBar className={style['scroller']}>
        <Flex vertical align="center" className={style['current-user']} gap={30}>
          {status === 0 && current && (
            <>
              <Card variant={'borderless'}>
                <Flex vertical gap={12} align="center">
                  <Image.Avatar size={100} id={current.avatar} />
                  <div>{current.nickname}</div>
                </Flex>
                <SaveMember
                  apis={apis}
                  data={current}
                  onSuccess={() => {
                    onReload && onReload();
                  }}
                >
                  {({ onClick }) => {
                    return (
                      <Button onClick={onClick} className={style['current-user-edit']} size="small" type="text" icon={<Icon type="icon-bianji" />} />
                    );
                  }}
                </SaveMember>
              </Card>
              {startTime && (
                <Flex gap={8}>
                  <Icon type="icon-shijian" />
                  <ConferenceCountDown
                    startTime={startTime}
                    duration={duration}
                    onComplete={() => {
                      onReload && onReload();
                    }}
                  />
                  开始会议
                </Flex>
              )}
              <Flex gap={20}>
                {isInvitationAllowed && members.length < maxCount && current?.isMaster && (
                  <InviteMember size="large" shape="round" apis={apis}>
                    邀请成员({members.length}/{maxCount})
                  </InviteMember>
                )}
                <Button
                  disabled={startTime && dayjs(startTime).isAfter(dayjs())}
                  size="large"
                  type="primary"
                  shape="round"
                  icon={<Icon type="icon-fasongduihua" />}
                  onClick={() => {
                    onEnter && onEnter();
                  }}
                >
                  进入会议
                </Button>
              </Flex>
            </>
          )}
          {status === 0 && inviter && (
            <>
              <div className={style['tips']}>{inviter.nickname}邀请你参加会议</div>
              {isInvitationAllowed && members.length < maxCount ? (
                <>
                  <Flex gap={8}>
                    <Icon type="icon-shijian" />
                    <ConferenceCountDown
                      startTime={startTime}
                      onComplete={() => {
                        onReload && onReload();
                      }}
                    />
                    后开始会议
                  </Flex>
                  <JoinConference
                    apis={apis}
                    onSuccess={data => {
                      onReload && onReload(data);
                    }}
                  >
                    {({ onClick }) => {
                      return (
                        <Button size="large" type="primary" shape="round" onClick={onClick}>
                          加入会议
                        </Button>
                      );
                    }}
                  </JoinConference>
                </>
              ) : (
                <Alert type="error" message="不能加入会议，人数已满或者会议不允许加入，请联系会议邀请人" />
              )}
            </>
          )}
          {status === 1 && <div className={style['tips']}>会议已结束</div>}
          {[0, 1].indexOf(status) === -1 && <div className={style['tips']}>会议错误请联系邀请人</div>}

          <Flex vertical className={style['member-area']}>
            <div className={style['member-title']}>
              参会人员:({members.length}/{maxCount})
            </div>
            <TableView
              className={style['member-table']}
              columns={[
                {
                  name: 'avatar',
                  title: '头像',
                  getValueOf: item => {
                    return <Image.Avatar size={30} id={item.avatar} />;
                  },
                  span: 4
                },
                {
                  name: 'nickname',
                  title: '昵称',
                  span: 12
                },
                {
                  name: 'role',
                  title: '角色',
                  getValueOf: (item, { target }) => (target.isMaster ? <StateTag type="success" text="主持人" /> : <StateTag text="参会者" />),
                  span: 4
                },
                isAdmin
                  ? {
                      name: 'options',
                      title: '操作',
                      getValueOf: (item, { target }) => {
                        return (
                          status === 0 && (
                            <Flex gap={8}>
                              <LoadingButton
                                type="link"
                                className="btn-no-padding"
                                onClick={() => {
                                  return onDetailEnter(item);
                                }}
                              >
                                进入
                              </LoadingButton>
                              <LoadingButton
                                type="link"
                                className="btn-no-padding"
                                onClick={() => {
                                  return onDetailLinkCopy(item);
                                }}
                              >
                                复制链接
                              </LoadingButton>
                            </Flex>
                          )
                        );
                      }
                    }
                  : {
                      name: 'options',
                      title: '操作',
                      getValueOf: (item, { target }) =>
                        status === 0 &&
                        !target.isMaster &&
                        current?.isMaster && (
                          <ConfirmButton
                            danger
                            size="small"
                            type="text"
                            icon={<Icon type="icon-shanchu" />}
                            onClick={async () => {
                              const { data: resData } = await ajax(
                                Object.assign({}, apis.removeMember, {
                                  data: { id: item.id }
                                })
                              );
                              if (resData.code !== 0) {
                                return;
                              }
                              message.success('删除成功');
                              onReload && onReload();
                            }}
                          >
                            删除
                          </ConfirmButton>
                        ),
                      span: 4
                    }
              ]}
              dataSource={members}
            />
          </Flex>
          {isAdmin && status === 1 && get(options, 'setting.record') && (
            <Flex vertical className={style['member-area']}>
              <div className={style['member-title']}>会议{get(options, 'setting.record') === 'video' ? '录像' : '录音'}</div>
              <InfoPage className={style['preview-list']}>
                <InfoPage.Part>
                  {get(options, 'recordFilesAchieved') ? (
                    (members || [])
                      .sort((a, b) => {
                        return a.isMaster === b.isMaster ? 0 : a.isMaster ? -1 : 1;
                      })
                      .map(item => {
                        const list =
                          transform(
                            get(options, `recordFiles.${item.id}`),
                            (result, value) => {
                              if (Array.from(value) && value.length > 0) {
                                result.push(...value);
                              }
                            },
                            []
                          ) || [];
                        return (
                          <InfoPage.Part title={`${item.nickname}(${item.isMaster ? '主持人' : '参会者'})`}>
                            <Flex gap={8} justify="center">
                              {list.length > 0 ? (
                                list.map(({ fileId }) => {
                                  return <FilePreview id={fileId} className={style['preview-file']} />;
                                })
                              ) : (
                                <Empty description="用户没有产生录制资源" />
                              )}
                            </Flex>
                          </InfoPage.Part>
                        );
                      })
                  ) : (
                    <Empty description="正在同步录制资源，最长需要10分钟，请稍后查看" />
                  )}
                </InfoPage.Part>
              </InfoPage>
            </Flex>
          )}
          {isAdmin && (
            <Flex justify="center">
              {isInvitationAllowed && status === 0 && (
                <InviteMember type="primary" size="large" shape="round" apis={apis} id={id} disabled={members.length >= maxCount}>
                  邀请成员({members.length}/{maxCount})
                </InviteMember>
              )}
            </Flex>
          )}
        </Flex>
      </SimpleBar>
    </Flex>
  );
});

const ConferenceDetail = ({ className, ...props }) => {
  return (
    <Flex className={classnames(className, style['info'])} vertical>
      <div className={style['right-panel-outer']}>
        <ConferenceDetailInner {...props} />
      </div>
    </Flex>
  );
};

export default ConferenceDetail;
