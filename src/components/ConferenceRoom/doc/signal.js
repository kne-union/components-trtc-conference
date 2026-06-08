const { default: ConferenceRoom } = _ConferenceRoom;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Flex, Card } = antd;
const { useState } = React;

const conference = mockConferenceList.pageData[0];
const now = new Date();

const SignalExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [signalLevel, setSignalLevel] = useState(3);

  return (
    <PureGlobal preset={preset}>
      <Flex vertical gap={16}>
        <Card title="信号强度切换" size="small">
          <Flex gap={8}>
            {[0, 1, 2, 3].map(level => (
              <button
                key={level}
                onClick={() => setSignalLevel(level)}
                style={{
                  padding: '4px 12px',
                  border: signalLevel === level ? '2px solid #4F185A' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  background: signalLevel === level ? '#f5e6f8' : '#fff',
                  cursor: 'pointer'
                }}
              >
                Level {level}
              </button>
            ))}
          </Flex>
        </Card>
        <ConferenceRoom
          conference={{ ...conference, name: '网络质量测试会议', startTime: now.toISOString() }}
          isMaster
          isInvitationAllowed
          signalLevel={signalLevel}
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
          list={Array.from({ length: 2 }).map((_, index) => (
            <div key={index} style={{ width: '100%', height: '100%', background: `hsl(${index * 120}, 60%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
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
      </Flex>
    </PureGlobal>
  );
});

render(<SignalExample />);
