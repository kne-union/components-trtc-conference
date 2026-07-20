# ConferenceRoom

### 概述

会议房间组件，提供视频会议的核心交互界面，包含视频窗口布局、工具栏操作、网络信号指示等功能。支持四种布局模式切换、麦克风/摄像头控制、屏幕分享、邀请成员等操作，可配合 TRTC SDK 实现实时音视频通讯。

核心特性：
- **四种布局模式**：网格布局、顶部成员列表、右侧成员列表、底部成员列表，灵活适配不同参会人数
- **音视频控制**：麦克风开关、摄像头开关、屏幕分享等一键操作
- **网络状态监控**：实时显示网络信号强度，帮助判断通话质量
- **文档协同展示**：支持会议文档与视频画面并列展示，可调整分屏比例
- **主持人特权**：主持人可结束会议，普通参会者仅可退出会议
- **可拖拽分屏**：视频窗口与文档区域支持拖拽调整大小，并自动记忆用户偏好


### 示例(全屏)

#### 示例代码

- 基础用法
- 展示会议房间的基础用法，包含视频画面、工具栏和会议信息头部
- _ConferenceRoom(@components/ConferenceRoom),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
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
          <div key={index} style={{ width: '100%', height: '100%', background: &#96;hsl(${index * 80}, 60%, 30%)&#96;, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
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

```

- 剩余时间与延长会议
- 切换普通时间 / 15分钟以内，以及是否允许延长，预览倒计时预警与延长按钮
- _ConferenceRoom(@components/ConferenceRoom),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader),antd(antd)

```jsx
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
          key={&#96;${timeMode}-${startTime}&#96;}
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
                background: &#96;hsl(${index * 80}, 60%, 30%)&#96;,
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

```

- 布局类型选择器
- 展示LayoutType布局类型选择器，支持四种布局模式切换
- _ConferenceRoom(@components/ConferenceRoom),antd(antd)

```jsx
const { LayoutType } = _ConferenceRoom;
const { useState } = React;
const { Flex, Radio, Card } = antd;

const BaseExample = () => {
  const [layoutType, setLayoutType] = useState(1);
  return (
    <Flex vertical gap={16}>
      <Card title="布局类型选择器" size="small">
        <LayoutType value={layoutType} onChange={setLayoutType} />
      </Card>
      <div>当前选中的布局类型: {layoutType}</div>
      <Radio.Group
        value={layoutType}
        onChange={e => setLayoutType(e.target.value)}
        options={[
          { value: 1, label: '网格' },
          { value: 2, label: '顶部成员列表' },
          { value: 3, label: '左侧成员列表' },
          { value: 4, label: '底部成员列表' }
        ]}
      />
    </Flex>
  );
};

render(<BaseExample />);

```

- 视频窗口组件
- 展示Window组件的布局切换、文档显示和分屏功能
- _ConferenceRoom(@components/ConferenceRoom),antd(antd)

```jsx
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
            <div key={index} style={{ width: '100%', height: '100%', background: &#96;hsl(${index * 45}, 50%, 35%)&#96;, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>
              {name}
            </div>
          ))}
        />
      </Flex>
    </Provider>
  );
};

render(<BaseExample />);

```

- 信号强度指示
- 展示不同信号强度等级的显示效果
- _ConferenceRoom(@components/ConferenceRoom),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader),antd(antd)

```jsx
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
            <div key={index} style={{ width: '100%', height: '100%', background: &#96;hsl(${index * 120}, 60%, 30%)&#96;, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
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

```

### API

### ConferenceRoom

会议房间主组件，管理会议视频布局、工具栏操作和全局状态。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 自定义CSS类名 |
| conference | object | 是 | - | 会议信息对象，包含 name、startTime、duration、options 等字段 |
| list | array | 否 | `[]` | 视频画面列表，每项为 ReactNode |
| document | ReactNode | 否 | - | 会议文档内容组件 |
| isMaster | boolean | 否 | - | 当前用户是否为会议主持人 |
| isInvitationAllowed | boolean | 否 | - | 是否允许邀请成员加入会议 |
| defaultValue | object | 否 | 见下方 | 初始设置值 |
| signalLevel | number | 否 | `3` | 网络信号强度等级，0-3，0最差3最好 |
| actions | object | 否 | - | 操作回调集合 |
| devices | object | 否 | - | 可用设备列表，包含 cameras 和 microphones 数组 |
| value | object | 否 | - | 受控设置值 |
| onChange | function | 否 | - | 设置变化回调 |

#### defaultValue 结构

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| layoutType | number | `1` | 布局类型：1-网格、2-顶部成员列表、3-右侧成员列表、4-底部成员列表 |
| mainIndex | number | `0` | 主画面索引 |
| microphoneOpen | boolean | `true` | 麦克风是否开启 |
| cameraOpen | boolean | `true` | 摄像头是否开启 |
| documentInside | boolean | `true` | 文档是否内嵌显示（非网格布局时） |
| microphoneId | string | - | 当前选中的麦克风设备ID |
| cameraId | string | - | 当前选中的摄像头设备ID |

#### conference 数据结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | string | 会议名称 |
| startTime | string | 会议开始时间（ISO格式） |
| duration | number | 会议时长（分钟） |
| options | object | 会议选项配置，包含 setting（layoutType/record/speech）、documentType、document 等 |

#### actions 结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| shareScreen | function | 屏幕分享/停止分享 |
| invite | function | 邀请成员 |
| leave | function | 退出会议 |
| end | function | 结束会议（仅主持人可用） |

#### devices 结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| cameras | array | 可用摄像头列表，每项包含 deviceId 和 label |
| microphones | array | 可用麦克风列表，每项包含 deviceId 和 label |

### LayoutType

布局类型选择器组件，用于切换会议视频窗口的布局模式。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| defaultValue | number | 否 | `1` | 默认选中的布局类型：1-网格、2-顶部成员列表、3-左侧成员列表、4-底部成员列表 |
| value | number | 否 | - | 受控选中的布局类型 |
| onChange | function | 否 | - | 布局类型变化回调 |

### Window

视频窗口组件，根据布局类型渲染视频画面列表，支持文档与视频分屏显示。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| layoutType | number | 是 | - | 布局类型：1-网格、2-顶部成员列表、3-右侧成员列表、4-底部成员列表 |
| list | array | 否 | `[]` | 视频画面列表 |
| document | ReactNode | 否 | - | 会议文档组件 |
| documentInside | boolean | 否 | `true` | 非网格布局时文档是否内嵌在成员列表中显示 |
