import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Card, Divider, Button, Alert, App } from 'antd';
import dayjs from 'dayjs';
import classnames from 'classnames';
import style from './style.module.scss';
import SaveMember from './SaveMember';
import InviteMember from './InviteMember';
import JoinConference from './JoinConference';
import formatConferenceTime from './formatConferenceTime';
import ConferenceCountDown from './ConferenceCountDown';

export const ConferenceDetailInner = createWithRemoteLoader({
  modules: [
    'components-core:Icon',
    'components-core:Image',
    'components-core:InfoPage@TableView',
    'components-core:StateTag',
    'components-core:ConfirmButton',
    'components-core:Global@usePreset'
  ]
})(({
  remoteModules,
  current,
  inviter,
  startTime,
  duration,
  name,
  status,
  isInvitationAllowed,
  maxCount,
  members = [],
  apis,
  onReload,
  onEnter,
  onDetailEnter,
  onDetailLinkCopy,
  onBack,
  isAdmin
}) => {
  const [Icon, Image, TableView, StateTag, ConfirmButton, usePreset] = remoteModules;
  const { ajax } = usePreset();
  const { message } = App.useApp();

  return (
    <Flex vertical flex={1} className={style['right-panel']}>
      <Flex className={style['title']} gap={8}>
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
      <Divider className={style['divider']} />
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
                            <Button
                              type="link"
                              className="btn-no-padding"
                              onClick={() => {
                                onDetailEnter(item);
                              }}
                            >
                              进入
                            </Button>
                            <Button
                              type="link"
                              className="btn-no-padding"
                              onClick={() => {
                                onDetailLinkCopy(item);
                              }}
                            >
                              复制链接
                            </Button>
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
      </Flex>
    </Flex>
  );
});

const ConferenceDetail = ({ className, ...props }) => {
  return (
    <Flex className={classnames(className, style['info'])} vertical>
      <ConferenceDetailInner {...props} />
    </Flex>
  );
};

export default ConferenceDetail;
