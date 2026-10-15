import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, App } from 'antd';
import formatConferenceTime from './formatConferenceTime';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';
import style from './style.module.scss';

const renderModal = ({ inviter, conference, shorten, message, formatMessage }) => {
  const link = `${window.location.origin}/invite?code=${shorten}`;
  const text = [
    `${inviter.nickname || inviter.email || formatMessage({ id: 'DefaultUser' })} ${formatMessage({ id: 'InviteToVideoConference' })}`,
    `${formatMessage({ id: 'MeetingNameLabel' })}：${conference.name}`,
    `${formatMessage({ id: 'MeetingTime' })}：${formatConferenceTime({ startTime: conference.startTime, duration: conference.duration, formatMessage })}`,
    '',
    `${formatMessage({ id: 'ClickLinkToJoin' })}：`,
    link
  ].join('\n');
  return {
    title: formatMessage({ id: 'InviteParticipants' }),
    size: 'small',
    footer: null,
    children: (
      <Flex vertical gap={60}>
        <div className={style['invite-text']}>{text}</div>
        <Flex justify="center" gap={12}>
          <RemoteLoader
            module="components-core:LoadingButton"
            type="primary"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              message.success(formatMessage({ id: 'CopyMeetingInfoSuccess' }));
            }}
          >
            {formatMessage({ id: 'CopyMeetingInfo' })}
          </RemoteLoader>
          <RemoteLoader
            module="components-core:LoadingButton"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              message.success(formatMessage({ id: 'CopyMeetingLinkSuccess' }));
            }}
          >
            {formatMessage({ id: 'CopyMeetingLink' })}
          </RemoteLoader>
        </Flex>
      </Flex>
    )
  };
};

const InviteMember = createWithRemoteLoader({
  modules: ['components-core:LoadingButton', 'components-core:Modal@useModal', 'components-core:Global@usePreset']
})(withLocale(({ remoteModules, apis, id, ...props }) => {
  const [LoadingButton, useModal, usePreset] = remoteModules;
  const modal = useModal();
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  return (
    <LoadingButton
      {...props}
      onClick={async () => {
        const { data: resData } = await ajax(
          Object.assign({}, apis.inviteMember, {
            data: { id }
          })
        );
        if (resData.code !== 0) {
          return;
        }
        modal(renderModal(Object.assign({}, resData.data, { message, formatMessage })));
      }}
    />
  );
}));

InviteMember.renderModal = renderModal;

export default InviteMember;
