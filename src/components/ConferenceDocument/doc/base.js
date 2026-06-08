const { default: ConferenceDocument } = _ConferenceDocument;
const { default: preset } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ height: 500 }}>
        <ConferenceDocument
          type="files"
          files={[
            { filename: 'Q2产品规划.pdf', id: 'file-001' },
            { filename: '竞品分析报告.xlsx', id: 'file-002' },
            { filename: '技术架构概览.pdf', id: 'file-003' }
          ]}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
