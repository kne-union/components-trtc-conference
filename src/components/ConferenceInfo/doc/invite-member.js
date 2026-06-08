const { InviteMember } = _ConferenceInfo;
const { default: preset, mockInviteData } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Flex, App } = antd;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <App>
        <Flex vertical gap={16}>
          <InviteMember
            type="primary"
            size="large"
            shape="round"
            apis={preset.apis.conference}
          >
            邀请成员(3/10)
          </InviteMember>
        </Flex>
      </App>
    </PureGlobal>
  );
});

render(<BaseExample />);
