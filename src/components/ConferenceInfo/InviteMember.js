import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, App } from 'antd';
import formatConferenceTime from './formatConferenceTime';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const renderModal = ({ inviter, conference, shorten, message, formatMessage }) => {
  const link = `${window.location.origin}/invite?code=${shorten}`;
  const text = `
            ${inviter.nickname || inviter.email || formatMessage({ id: 'DefaultUser' })} ${formatMessage({ id: 'InviteToVideoConference' })}
            ${formatMessage({ id: 'MeetingNameLabel' })}：${conference.name}
            ${formatMessage({ id: 'MeetingTime' })}：${formatConferenceTime({ startTime: conference.startTime, duration: conference.duration, formatMessage })}

            ${formatMessage({ id: 'ClickLinkToJoin' })}：
            ${link}`;
  return {
    title: formatMessage({ id: 'InviteParticipants' }),
    size: 'small',
    footer: null,
    children: (
      <Flex vertical gap={60}>
        <div
          style={{
            whiteSpace: 'pre-wrap'
          }}
        >
          {text}
        </div>
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
  modules: ['components-core:Modal@ModalButton']
})(withLocale(({ remoteModules, apis, id, ...props }) => {
  const [ModalButton] = remoteModules;
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  return (
    <ModalButton
      {...props}
      api={Object.assign({}, apis.inviteMember, {
        data: { id }
      })}
      modalProps={({ data }) => {
        return renderModal(Object.assign({}, data, { message, formatMessage }));
      }}
    />
  );
}));

InviteMember.renderModal = renderModal;

export default InviteMember;
