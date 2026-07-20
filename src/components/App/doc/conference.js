const { default: App } = _App;
const { default: ConferenceRoom } = _ConferenceRoom;
const { default: preset, mockConferenceList, mockUserInfo } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Route, Routes, Navigate, useNavigate } = reactRouterDom;

const conference = mockConferenceList.pageData[0];
const now = new Date();

const ConferenceBackRoom = () => {
  const navigate = useNavigate();
  return (
    <ConferenceRoom
      conference={{ ...conference, startTime: now.toISOString() }}
      isMaster
      isInvitationAllowed
      signalLevel={3}
      onBack={() => {
        navigate('/conference');
      }}
      devices={{
        cameras: [
          { deviceId: 'cam-1', label: '内置摄像头' },
          { deviceId: 'cam-2', label: '外接摄像头' }
        ],
        microphones: [
          { deviceId: 'mic-1', label: '内置麦克风' },
          { deviceId: 'mic-2', label: '外接麦克风' }
        ]
      }}
      list={Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          style={{
            width: '100%',
            height: '100%',
            background: `hsl(${index * 80}, 60%, 30%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 24
          }}
        >
          参会者 {index + 1}
        </div>
      ))}
      actions={{
        shareScreen: () => {},
        invite: () => {},
        leave: () => {
          navigate('/conference/detail');
        },
        end: () => {
          navigate('/conference/detail');
        }
      }}
    />
  );
};

const ConferenceExample = createWithRemoteLoader({
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
        <Route path="/room" element={<ConferenceBackRoom />} />
        <Route path="*" element={<Navigate to="/room" replace />} />
      </Routes>
    </PureGlobal>
  );
});

render(<ConferenceExample />);
