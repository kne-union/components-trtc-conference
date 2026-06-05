const { Window, Provider } = _ConferenceRoom;
const { Flex, Radio, Switch } = antd;
const { useState } = React;

const BaseExample = () => {
  const [layoutType, setLayoutType] = useState(1);
  const [hasDocument, setHasDocument] = useState(true);
  const [documentInside, setDocumentInside] = useState(true);
  const [setting, setSetting] = useState({ layoutType: 1, mainIndex: 0, microphoneOpen: true, cameraOpen: true, documentInside: true });

  const mockDevices = {
    cameras: [
      { deviceId: 'cam-1', label: '内置摄像头' },
      { deviceId: 'cam-2', label: '外接摄像头' }
    ],
    microphones: [
      { deviceId: 'mic-1', label: '内置麦克风' },
      { deviceId: 'mic-2', label: '外接麦克风' }
    ]
  };

  const members = ['陈建国', '李明辉', '王芳', '赵磊', '刘洋', '孙婷', '周伟', '吴晓燕'];

  return (
    <Provider value={{ setting, setSetting, devices: mockDevices }}>
      <Flex vertical gap={12}>
        <Flex gap={16} align="center">
          <div>布局模式：</div>
          <Radio.Group
            value={layoutType}
            onChange={e => {
              const value = e.target.value;
              setLayoutType(value);
              setSetting(prev => ({ ...prev, layoutType: value }));
            }}
            options={[
              { value: 1, label: '网格' },
              { value: 2, label: '顶部成员列表' },
              { value: 3, label: '右侧成员列表' },
              { value: 4, label: '底部成员列表' }
            ]}
          />
          <div>显示文档：</div>
          <Switch checked={hasDocument} onChange={setHasDocument} />
          {hasDocument && layoutType !== 1 && (
            <>
              <div>文档内嵌：</div>
              <Switch checked={documentInside} onChange={setDocumentInside} />
            </>
          )}
        </Flex>
        <Window
          layoutType={layoutType}
          documentInside={documentInside}
          document={hasDocument ? <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>会议文档区域</div> : null}
          list={members.map((name, index) => (
            <div key={index} style={{ width: '100%', height: '100%', background: `hsl(${index * 45}, 50%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>
              {name}
            </div>
          ))}
        />
      </Flex>
    </Provider>
  );
};

render(<BaseExample />);
