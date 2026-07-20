const { default: App } = _App;
const { default: preset, mockUserInfo } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Route, Routes, Navigate } = reactRouterDom;

const DetailExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <Routes>
        <Route
          path="/conference/*"
          element={<App baseUrl="/conference" userInfo={mockUserInfo} headerName="x-trtc-conference-code" name="conference" />}
        />
        <Route path="*" element={<Navigate to="/conference/detail" replace />} />
      </Routes>
    </PureGlobal>
  );
});

render(<DetailExample />);
