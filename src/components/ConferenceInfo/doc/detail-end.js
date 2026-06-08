const { ConferenceDetail } = _ConferenceInfo;
const { default: preset, mockConferenceList, mockAiTranscriptionContent } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[2];

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
          aiTranscriptionContent={mockAiTranscriptionContent}
          onReload={() => {}}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
