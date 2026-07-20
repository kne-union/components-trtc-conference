const { default: ConferenceRoom } = _ConferenceRoom;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Flex, Card, Radio, Switch, Button, Tooltip, message } = antd;
const { useEffect, useState } = React;

const conference = mockConferenceList.pageData[0];
const EXTEND_SECONDS = 15 * 60;

const RemainingTimeExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [timeMode, setTimeMode] = useState('normal');
  const [allowExtend, setAllowExtend] = useState(true);
  const [startTime, setStartTime] = useState(() => new Date().toISOString());
  const [duration, setDuration] = useState(60 * 60);

  useEffect(() => {
    setStartTime(new Date().toISOString());
    setDuration(timeMode === 'warning' ? EXTEND_SECONDS : 60 * 60);
  }, [timeMode]);

  const showExtendAction = allowExtend && duration <= EXTEND_SECONDS;

  const onExtendDuration = () => {
    setDuration(current => current + EXTEND_SECONDS);
    message.success('已延长 15 分钟');
  };

  return (
    <PureGlobal preset={preset}>
      <Flex vertical gap={16}>
        <Card title="剩余时间与延长会议" size="small">
          <Flex vertical gap={12}>
            <Flex gap={8} align="center" wrap="wrap">
              <span>剩余时间：</span>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={timeMode}
                onChange={e => setTimeMode(e.target.value)}
                options={[
                  { value: 'normal', label: '普通时间' },
                  { value: 'warning', label: '15分钟以内' }
                ]}
              />
            </Flex>
            <Flex gap={8} align="center">
              <span>允许延长：</span>
              <Switch checked={allowExtend} onChange={setAllowExtend} />
              <span style={{ color: '#667085', fontSize: 12 }}>
                {showExtendAction
                  ? '主持人可看到「延长 15 分钟」按钮'
                  : timeMode === 'warning' && !allowExtend
                    ? '剩余不足 15 分钟，但不显示延长按钮'
                    : duration > EXTEND_SECONDS && timeMode === 'warning'
                      ? '已延长，剩余时间恢复为普通状态'
                      : '普通时间下不显示延长按钮'}
              </span>
            </Flex>
          </Flex>
        </Card>
        <ConferenceRoom
          key={`${timeMode}-${startTime}`}
          conference={{
            ...conference,
            name: '剩余时间演示会议',
            startTime,
            duration,
            options: {
              ...conference.options,
              allowExtend
            }
          }}
          isMaster
          isInvitationAllowed
          signalLevel={3}
          headerExtra={
            showExtendAction ? (
              <Tooltip title="距离会议结束不足 15 分钟，是否延长 15 分钟？">
                <Button size="small" type="primary" onClick={onExtendDuration}>
                  延长 15 分钟
                </Button>
              </Tooltip>
            ) : null
          }
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

render(<RemainingTimeExample />);
