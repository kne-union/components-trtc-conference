const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const TextExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 420, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im data={mockIm} showRaiseHand={false} showImage={false} showFile={false} phrases={['收到', '我看一下', '马上处理']} />
      </div>
    </PureGlobal>
  );
});

render(<TextExample />);
