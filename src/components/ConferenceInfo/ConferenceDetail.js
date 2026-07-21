import { createWithRemoteLoader } from '@kne/remote-loader';
import { useMemo } from 'react';
import { Flex, Card, Divider, Button, Alert, App, Empty, Descriptions, Collapse } from 'antd';
import dayjs from 'dayjs';
import classnames from 'classnames';
import style from './style.module.scss';
import SaveMember from './SaveMember';
import InviteMember from './InviteMember';
import JoinConference from './JoinConference';
import formatConferenceTime from './formatConferenceTime';
import ConferenceCountDown from './ConferenceCountDown';
import get from 'lodash/get';
import ConferenceDocument from '@components/ConferenceDocument';
import DeviceTesting from '@components/DeviceTesting';
import RoomEvents from '@components/RoomEvents';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import resolveAvatarProps from './resolveAvatarProps';

export const ConferenceDetailInner = createWithRemoteLoader({
  modules: [
    'components-core:Icon',
    'components-core:Image',
    'components-core:InfoPage',
    'components-core:StateTag',
    'components-core:ConfirmButton',
    'components-core:Global@usePreset',
    'components-core:LoadingButton',
    'components-core:FilePreview',
    'components-core:Common@SimpleBar',
    'components-core:Modal@useModal',
    'components-core:ButtonGroup',
    'components-core:ButtonGroup@ButtonFooter',
    'components-thirdparty:CKEditor',
    'components-admin:Account@Language'
  ]
})(withLocale(({
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
  onCancel,
  onBack,
  isAdmin,
  aiTranscriptionContent
}) => {
  const [Icon, Image, InfoPage, StateTag, ConfirmButton, usePreset, LoadingButton, FilePreview, SimpleBar, useModal, ButtonGroup, ButtonFooter, CKEditor, Language] = remoteModules;
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const modal = useModal();
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const DetailScroller = isMobile ? 'div' : SimpleBar;
  const isBeforeStart = status === 0 && startTime && dayjs().isBefore(dayjs(startTime));
  const canViewTrtcRoomEvents = isAdmin || current?.isMaster;
  const recordType = get(options, 'setting.record');
  const speechEnabled = !!get(options, 'setting.speech');
  const allowExtend = get(options, 'allowExtend') !== false;
  const getRecordSettingLabel = () => {
    if (recordType === 'video') {
      return formatMessage({ id: 'RecordVideo' });
    }
    if (recordType === 'audio') {
      return formatMessage({ id: 'RecordAudio' });
    }
    return formatMessage({ id: 'NotEnabled' });
  };
  const getEnabledLabel = enabled => (enabled ? formatMessage({ id: 'Open' }) : formatMessage({ id: 'Close' }));
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
  const transcriptionItems = useMemo(() => {
    const findMember = userId => (members || []).find(item => String(item.id) === String(userId));
    const findMemberName = userId => {
      const member = findMember(userId);
      return member?.nickname || member?.email || userId;
    };
    const sortByTime = items => {
      return items.slice().sort((a, b) => {
        const aTime = a.time ? dayjs(a.time).valueOf() : 0;
        const bTime = b.time ? dayjs(b.time).valueOf() : 0;
        return aTime - bTime;
      });
    };
    const contentItems = (aiTranscriptionContent?.content || []).map((item, index) => {
      const member = item.member || findMember(item.sender);
      return {
        key: `content-${member?.id || item.sender || 'message'}-${index}`,
        name: member?.nickname || (item.sender && findMemberName(item.sender)) || item.sender,
        avatar: member?.avatar,
        message: item.message,
        time: item.time,
        isHost: !!member?.isMaster
      };
    });
    if (contentItems.length > 0) {
      return sortByTime(contentItems);
    }
    const roundItems = (aiTranscriptionContent?.rounds || []).map((round, index) => {
      const member = findMember(round.userId);
      return {
        key: `round-${round.roundId || index}`,
        name: findMemberName(round.userId),
        avatar: member?.avatar,
        message: round.text,
        time: round.startTime,
        endTime: round.endTime,
        isHost: !!member?.isMaster
      };
    });
    if (roundItems.length > 0) {
      return sortByTime(roundItems);
    }
    if (aiTranscriptionContent?.text) {
      return [{ key: 'text-summary', message: aiTranscriptionContent.text }];
    }
    return [];
  }, [aiTranscriptionContent, members]);
  const renderTranscriptionItems = items => {
    return (
      <div className={style['transcription-chat']}>
        {items.map(item => (
          <div
            className={classnames(style['transcription-bubble-row'], {
              [style['is-host']]: item.isHost
            })}
            key={item.key}
          >
            <Image.Avatar size={32} {...resolveAvatarProps(item.avatar)} />
            <div className={style['transcription-bubble-main']}>
              <Flex
                align="center"
                gap={8}
                justify={item.isHost ? 'flex-end' : 'flex-start'}
                className={style['transcription-bubble-meta']}
              >
                <span className={style['transcription-member']}>{item.name || formatMessage({ id: 'DefaultUser' })}</span>
                {item.isHost && <StateTag type="success" text={formatMessage({ id: 'Host' })} />}
                {item.time && (
                  <span className={style['transcription-time']}>
                    {dayjs(item.time).format('HH:mm:ss')}
                    {item.endTime ? ` - ${dayjs(item.endTime).format('HH:mm:ss')}` : ''}
                  </span>
                )}
              </Flex>
              <div
                className={classnames(style['transcription-bubble'], {
                  [style['is-host']]: item.isHost
                })}
              >
                {item.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  const renderMemberActions = member => {
    if (isAdmin) {
      return (
        status === 0 && (
          <Flex gap={8} wrap className={style['member-actions-inner']}>
            <LoadingButton
              type="link"
              className="btn-no-padding"
              onClick={() => {
                return onDetailEnter(member);
              }}
            >
              {formatMessage({ id: 'Enter' })}
            </LoadingButton>
            <LoadingButton
              type="link"
              className="btn-no-padding"
              onClick={() => {
                return onDetailLinkCopy(member);
              }}
            >
              {formatMessage({ id: 'CopyLink' })}
            </LoadingButton>
          </Flex>
        )
      );
    }
    return (
      status === 0 &&
      !member?.isMaster &&
      current?.isMaster && (
        <ConfirmButton
          danger
          size="small"
          type="text"
          isModal={isMobile}
          icon={<Icon type="icon-shanchu" />}
          onClick={async () => {
            const { data: resData } = await ajax(
              Object.assign({}, apis.removeMember, {
                data: { id: member.id }
              })
            );
            if (resData.code !== 0) {
              return;
            }
            message.success(formatMessage({ id: 'DeleteSuccess' }));
            onReload && onReload();
          }}
        >
          {formatMessage({ id: 'Delete' })}
        </ConfirmButton>
      )
    );
  };
  const getMemberRecordFiles = memberId => {
    return get(options, `recordFiles.${memberId}`) || [];
  };
  const renderRecordFile = ({ fileId }) => {
    if (recordType === 'audio') {
      return (
        <FilePreview id={fileId}>
          {({ url }) => <audio controls src={url} className={style['preview-audio']} />}
        </FilePreview>
      );
    }
    if (recordType === 'video') {
      return (
        <FilePreview id={fileId}>
          {({ url }) => <video controls src={url} className={style['preview-video']} />}
        </FilePreview>
      );
    }
    return <FilePreview id={fileId} className={style['preview-file']} />;
  };
  const getMemberName = member => {
    return member?.nickname || member?.email || formatMessage({ id: 'DefaultUser' });
  };
  const showTrtcRoomEvents = async () => {
    const perPage = 200;
    const events = [];
    let currentPage = 1;
    // 按 totalCount 翻页拉全事件，只取第一页会截断会议后半段数据
    while (true) {
      const { data: resData } = await ajax(
        Object.assign({}, apis?.getTrtcInstanceEvents, {
          params: { id, perPage, currentPage }
        })
      );
      if (resData.code !== 0) {
        return;
      }
      const pageData = resData.data?.pageData || [];
      events.push(...pageData);
      const totalCount = resData.data?.totalCount ?? 0;
      if (pageData.length === 0 || events.length >= totalCount) {
        break;
      }
      currentPage += 1;
    }
    modal({
      title: formatMessage({ id: 'TrtcRoomEvents' }),
      footer: null,
      width: isMobile ? '100%' : 860,
      children: (
        <RoomEvents id={id} name={name} status={status} members={members} events={events} />
      )
    });
  };

  const canInviteAsMaster =
    status === 0 && !!current && isInvitationAllowed && members.length < maxCount && current?.isMaster;
  const canInviteAsAdmin = isAdmin && status === 0 && isInvitationAllowed;
  const showInviteMember = canInviteAsMaster || canInviteAsAdmin;
  const inviteMemberButton = showInviteMember ? (
    <InviteMember
      type={canInviteAsAdmin || isMobile ? 'primary' : undefined}
      size="large"
      shape="round"
      apis={apis}
      id={id}
      disabled={members.length >= maxCount}
      className={isMobile ? style['invite-footer-btn'] : undefined}
    >
      {formatMessage({ id: 'InviteMembers' })}({members.length}/{maxCount})
    </InviteMember>
  ) : null;

  const currentActionsNode =
    status === 0 && current ? (
      <>
        <Button
          size="large"
          shape="round"
          icon={<Icon type="icon-setting" fontClassName="iconfont-ai" />}
          onClick={() => {
            const modalApi = modal({
              title: formatMessage({ id: 'DeviceTesting' }),
              footer: null,
              width: isMobile ? '100%' : undefined,
              children: (
                <DeviceTesting
                  onComplete={() => {
                    message.success(formatMessage({ id: 'DeviceTestingComplete' }));
                    modalApi.close();
                  }}
                />
              )
            });
          }}
        >
          {formatMessage({ id: 'DeviceTesting' })}
        </Button>
        <LoadingButton
          disabled={startTime && dayjs(startTime).isAfter(dayjs())}
          size="large"
          type="primary"
          shape="round"
          icon={<Icon type="icon-fasongduihua" />}
          onClick={async () => {
            await onEnter?.();
          }}
        >
          {formatMessage({ id: 'EnterMeeting' })}
        </LoadingButton>
      </>
    ) : null;

  const joinConferenceNode =
    status === 0 && inviter && isInvitationAllowed && members.length < maxCount ? (
      <JoinConference
        apis={apis}
        onSuccess={data => {
          onReload && onReload(data);
        }}
      >
        {({ onClick }) => {
          return (
            <Button size="large" type="primary" shape="round" onClick={onClick}>
              {formatMessage({ id: 'JoinMeeting' })}
            </Button>
          );
        }}
      </JoinConference>
    ) : null;

  const footerRowCount = [inviteMemberButton, currentActionsNode, joinConferenceNode].filter(Boolean).length;
  const hasMobileFooter = isMobile && footerRowCount > 0;

  const titleActions = [];
  if (onCancel && status === 0) {
    titleActions.push({
      type: 'link',
      danger: true,
      children: formatMessage({ id: 'CancelMeeting' }),
      confirm: true,
      isModal: true,
      message: formatMessage({ id: 'CancelMeetingConfirm' }),
      okText: formatMessage({ id: 'CancelMeeting' }),
      onClick: onCancel
    });
  }
  if (onEdit && status === 0) {
    titleActions.push({
      type: 'link',
      children: formatMessage({ id: 'Edit' }),
      onClick: onEdit
    });
  }

  return (
    <Flex vertical flex={isMobile ? undefined : 1} className={style['right-panel']}>
      <Flex className={style['title']} gap={8} justify="space-between" align="center">
        <Flex gap={8} align="center" className={style['title-info']}>
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
              {formatMessage({ id: 'Back' })}
            </Button>
          )}
        </Flex>
        <Flex gap={8} align="center" className={style['title-actions']}>
          <Language colorful={false} />
          {titleActions.length > 0 && (
            <ButtonGroup
              list={titleActions}
              showLength={isMobile ? 2 : undefined}
              more={<Button icon={<Icon type="icon-gengduo2" />} className="btn-no-padding" type="link" />}
            />
          )}
        </Flex>
      </Flex>
      <Divider className={style['divider']} />
      <div className={style['detail-summary']}>
        <div className={style['detail-name']}>{name}</div>
        <div className={style['detail-time']}>({formatConferenceTime({ startTime, duration, formatMessage })})</div>
      </div>
      <DetailScroller
        className={classnames(style['scroller'], {
          [style['has-footer']]: hasMobileFooter,
          [style['has-footer-tall']]: footerRowCount > 1
        })}
      >
        <Flex vertical align="center" className={style['current-user']} gap={30}>
          {status === 0 && current && (
            <>
              <Card variant={'borderless'}>
                <Flex vertical gap={12} align="center">
                  <Image.Avatar size={100} {...resolveAvatarProps(current.avatar)} />
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
                  {formatMessage({ id: 'AfterStartMeeting' })}
                </Flex>
              )}
            </>
          )}
          {status === 0 && inviter && (
            <>
              <div className={style['tips']}>
                {inviter.nickname}
                {formatMessage({ id: 'InviteYouToMeeting' })}
              </div>
              {isInvitationAllowed && members.length < maxCount ? (
                <Flex gap={8}>
                  <Icon type="icon-shijian" />
                  <ConferenceCountDown
                    startTime={startTime}
                    onComplete={() => {
                      onReload && onReload();
                    }}
                  />
                  {formatMessage({ id: 'AfterStartMeeting' })}
                </Flex>
              ) : (
                <Alert type="error" message={formatMessage({ id: 'CannotJoinMeeting' })} />
              )}
            </>
          )}
          {status === 1 && <div className={style['tips']}>{formatMessage({ id: 'MeetingEnded' })}</div>}
          {status === 2 && <div className={style['tips']}>{formatMessage({ id: 'MeetingCanceled' })}</div>}
          {[0, 1, 2].indexOf(status) === -1 && <div className={style['tips']}>{formatMessage({ id: 'MeetingError' })}</div>}

          {!isMobile && currentActionsNode && (
            <Flex gap={12} className={style['current-actions']}>
              {canInviteAsMaster && inviteMemberButton}
              {currentActionsNode}
            </Flex>
          )}

          {!isMobile && joinConferenceNode}

          {options?.attention && (
            <Flex vertical className={style['member-area']}>
              <div className={style['member-title']}>{formatMessage({ id: 'Attention' })}</div>
              <CKEditor.Content className={style['attention-content']}>{options.attention}</CKEditor.Content>
            </Flex>
          )}

          {options?.documentType && (isAdmin || options?.documentVisibleAll || current?.isMaster) && (
            <Flex vertical className={style['member-area']}>
              <Flex align="center">
                <div className={style['member-title']}>{formatMessage({ id: 'MeetingDocument' })}</div>
                <LoadingButton
                  type="link"
                  onClick={() => {
                    modal({
                      title: formatMessage({ id: 'DocumentPreview' }),
                      footer: null,
                      width: isMobile ? '100%' : undefined,
                      children: (
                        <ConferenceDocument
                          type={options?.documentType}
                          moduleProps={Object.assign({}, options?.moduleProps, {
                            conferenceStep: 'waiting'
                          })}
                          files={options?.document}
                          url={options?.documentUrl}
                          module={options?.module}
                        />
                      )
                    });
                  }}
                >
                  {options?.documentTitle || formatMessage({ id: 'View' })}
                </LoadingButton>
              </Flex>
            </Flex>
          )}

          {!isMobile && canInviteAsAdmin && (
            <Flex justify="center">
              {inviteMemberButton}
            </Flex>
          )}

          <Flex vertical className={style['member-area']}>
            <div className={style['member-title']}>
              {formatMessage({ id: 'Participants' })}({members.length}/{maxCount})
            </div>
            <div className={style['member-list']}>
              {members.length > 0 ? (
                members.map(member => {
                  const memberActions = renderMemberActions(member);
                  return (
                    <div className={style['member-item']} key={member.id || member.email || member.nickname}>
                      <Flex align="center" gap={10} className={style['member-info']}>
                        <Image.Avatar size={36} {...resolveAvatarProps(member.avatar)} />
                        <div className={style['member-profile']}>
                          <div className={style['member-name']}>{member.nickname || member.email || '-'}</div>
                          <Flex gap={4} wrap className={style['member-tags']}>
                            <StateTag type={member.isMaster ? 'success' : undefined} text={member.isMaster ? formatMessage({ id: 'Host' }) : formatMessage({ id: 'Attendee' })} />
                            {!isBeforeStart && (
                              <StateTag
                                type={hasMemberAttended(member) ? 'success' : undefined}
                                text={hasMemberAttended(member) ? formatMessage({ id: 'Attended' }) : formatMessage({ id: 'NotAttended' })}
                              />
                            )}
                          </Flex>
                        </div>
                      </Flex>
                      {memberActions ? <div className={style['member-actions']}>{memberActions}</div> : null}
                    </div>
                  );
                })
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Flex>

          {isAdmin && (
            <div className={style['member-area']}>
              <Collapse
                ghost
                size="small"
                expandIconPosition="end"
                className={style['meeting-settings-collapse']}
                items={[
                  {
                    key: 'settings',
                    label: <div className={style['member-title']}>{formatMessage({ id: 'MeetingSettings' })}</div>,
                    children: (
                      <div className={style['meeting-settings']}>
                        <Descriptions
                          size="small"
                          column={1}
                          items={[
                            {
                              key: 'record',
                              label: formatMessage({ id: 'IsRecordMeeting' }),
                              children: <StateTag type={recordType ? 'success' : undefined} text={getRecordSettingLabel()} />
                            },
                            {
                              key: 'speech',
                              label: formatMessage({ id: 'IsSpeechRecognition' }),
                              children: <StateTag type={speechEnabled ? 'success' : undefined} text={getEnabledLabel(speechEnabled)} />
                            },
                            {
                              key: 'allowExtend',
                              label: formatMessage({ id: 'AllowExtend' }),
                              children: <StateTag type={allowExtend ? 'success' : undefined} text={getEnabledLabel(allowExtend)} />
                            },
                            {
                              key: 'invitation',
                              label: formatMessage({ id: 'IsInvitationAllowed' }),
                              children: (
                                <StateTag type={isInvitationAllowed ? 'success' : undefined} text={getEnabledLabel(!!isInvitationAllowed)} />
                              )
                            },
                            {
                              key: 'maxCount',
                              label: formatMessage({ id: 'MaxMemberCount' }),
                              children: maxCount ?? '-'
                            },
                            ...(options?.documentType
                              ? [
                                  {
                                    key: 'documentType',
                                    label: formatMessage({ id: 'DocumentType' }),
                                    children:
                                      options.documentType === 'iframe'
                                        ? formatMessage({ id: 'DocumentTypeIframe' })
                                        : formatMessage({ id: 'DocumentTypeFiles' })
                                  },
                                  {
                                    key: 'documentVisibleAll',
                                    label: formatMessage({ id: 'DocumentVisibleAll' }),
                                    children: (
                                      <StateTag
                                        type={options.documentVisibleAll ? 'success' : undefined}
                                        text={getEnabledLabel(!!options.documentVisibleAll)}
                                      />
                                    )
                                  }
                                ]
                              : [])
                          ]}
                        />
                      </div>
                    )
                  }
                ]}
              />
            </div>
          )}

          {(status === 1 || (status === 0 && !isBeforeStart)) && apis?.getTrtcInstanceEvents && canViewTrtcRoomEvents && (
            <Flex vertical className={style['member-area']}>
              <Flex align="center" justify="space-between">
                <div className={style['member-title']}>{formatMessage({ id: 'TrtcRoomEvents' })}</div>
                <LoadingButton type="link" onClick={showTrtcRoomEvents}>
                  {formatMessage({ id: 'ViewTrtcRoomEvents' })}
                </LoadingButton>
              </Flex>
            </Flex>
          )}

          {isAdmin && status === 1 && get(options, 'setting.record') && (
            <Flex vertical className={style['member-area']}>
              <div className={style['member-title']}>
                {formatMessage({ id: 'Meeting' })}
                {get(options, 'setting.record') === 'video' ? formatMessage({ id: 'MeetingRecording' }) : formatMessage({ id: 'MeetingAudio' })}
              </div>
              <InfoPage className={style['preview-list']}>
                <InfoPage.Part>
                  {get(options, 'recordFilesAchieved') ? (
                    (members || [])
                      .sort((a, b) => {
                        return a.isMaster === b.isMaster ? 0 : a.isMaster ? -1 : 1;
                      })
                      .map(item => {
                        const list = getMemberRecordFiles(item.id);
                        return (
                          <InfoPage.Part key={item.id} title={`${getMemberName(item)}(${item.isMaster ? formatMessage({ id: 'Host' }) : formatMessage({ id: 'Attendee' })})`}>
                            <Flex gap={8} justify="center">
                              {list.length > 0 ? (
                                list.map(({ fileId }) => {
                                  return <div key={fileId}>{renderRecordFile({ fileId })}</div>;
                                })
                              ) : (
                                <Empty description={formatMessage({ id: 'NoRecordedResources' })} />
                              )}
                            </Flex>
                          </InfoPage.Part>
                        );
                      })
                  ) : (
                    <Empty description={formatMessage({ id: 'SyncingRecordedResources' })}>
                      <Button size="small" type="primary" onClick={onReload}>
                        {formatMessage({ id: 'Refresh' })}
                      </Button>
                    </Empty>
                  )}
                </InfoPage.Part>
              </InfoPage>
            </Flex>
          )}

          {isAdmin && status === 1 && get(options, 'setting.speech') && (
            <Flex vertical className={style['member-area']}>
              <div className={style['member-title']}>{formatMessage({ id: 'AiTranscriptionContent' })}</div>
              {transcriptionItems.length > 0 ? (
                renderTranscriptionItems(transcriptionItems)
              ) : (
                <div className={style['transcription-chat']}>
                  <Empty description={formatMessage({ id: 'NoAiTranscriptionContent' })} />
                </div>
              )}
            </Flex>
          )}

        </Flex>
      </DetailScroller>
      {hasMobileFooter && (
        <ButtonFooter>
          <Flex vertical gap={10} className={style['footer-actions']}>
            {inviteMemberButton}
            {currentActionsNode && (
              <Flex gap={10} className={style['footer-actions-row']}>
                {currentActionsNode}
              </Flex>
            )}
            {joinConferenceNode}
          </Flex>
        </ButtonFooter>
      )}
    </Flex>
  );
}));

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
