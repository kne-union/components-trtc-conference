const { default: ConferenceRoom } = _ConferenceRoom;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[0];
const now = new Date();

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <ConferenceRoom
        conference={{ ...conference, startTime: now.toISOString() }}
        isMaster
        isInvitationAllowed
        signalLevel={3}
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
          <div key={index} style={{ width: '100%', height: '100%', background: `hsl(${index * 80}, 60%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
            参会者 {index + 1}
          </div>
        ))}
        actions={{
          shareScreen: () => console.log('分享屏幕'),
          invite: () => console.log('邀请成员'),
          leave: () => console.log('退出会议'),
          end: () => console.log('结束会议')
        }}
      />
    </PureGlobal>
  );
});

render(<BaseExample />);
