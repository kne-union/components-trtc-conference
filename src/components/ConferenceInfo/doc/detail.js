const { ConferenceDetail } = _ConferenceInfo;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[0];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ '--box-width': '100%' }}>
        <ConferenceDetail
          {...conference}
          current={conference.members[0]}
          apis={preset.apis.conference}
          isAdmin
          onEnter={() => console.log('进入会议')}
          onReload={() => {}}
          onEdit={() => console.log('编辑会议')}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
