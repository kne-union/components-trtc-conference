const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 420, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im data={mockIm} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
