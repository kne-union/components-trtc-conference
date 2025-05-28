import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, App } from 'antd';
import formatConferenceTime from './formatConferenceTime';

const renderModal = ({ inviter, conference, shorten, message }) => {
  const link = `${window.location.origin}/invite?code=${shorten}`;
  const text = `
            ${inviter.nickname || inviter.email || '默认用户'} 邀请您参加视频会议
            会议名称：${conference.name}
            会议时间：${formatConferenceTime(conference)}

            点击链接直接加入会议：
            ${link}`;
  return {
    title: '邀请参会人员',
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
              message.success('复制会议信息成功');
            }}
          >
            复制会议信息
          </RemoteLoader>
          <RemoteLoader
            module="components-core:LoadingButton"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              message.success('复制会议链接成功');
            }}
          >
            复制会议链接
          </RemoteLoader>
        </Flex>
      </Flex>
    )
  };
};

const InviteMember = createWithRemoteLoader({
  modules: ['components-core:Modal@ModalButton']
})(({ remoteModules, apis, id, ...props }) => {
  const [ModalButton] = remoteModules;
  const { message } = App.useApp();
  return (
    <ModalButton
      {...props}
      api={Object.assign({}, apis.inviteMember, {
        data: { id }
      })}
      modalProps={({ data }) => {
        return renderModal(Object.assign({}, data, { message }));
      }}
    />
  );
});

InviteMember.renderModal = renderModal;

export default InviteMember;
