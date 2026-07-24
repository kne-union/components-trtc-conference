# RoomEvents

### 概述

房间情况展示组件，基于后端聚合摘要展示实际会议时长、成员在线摘要、设备信息、质量分析图表和事件时间线。可被会议详情或其他平台（如 unfolds）直接复用。


### 示例

#### 示例代码

- 基础用法
- 传入 mock 房间事件摘要与成员数据，展示房间概览、摘要与成员详情
- _RoomEvents(@components/RoomEvents),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: RoomEvents } = _RoomEvents;
const { default: preset, mockConferenceList, mockTrtcRoomEventsSummary } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[0];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 860, maxWidth: '100%', margin: '0 auto', padding: 16 }}>
        <RoomEvents
          id={conference.id}
          name={conference.name}
          status={conference.status}
          members={conference.members}
          data={mockTrtcRoomEventsSummary}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 空数据
- 未传入摘要时展示空状态
- _RoomEvents(@components/RoomEvents),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: RoomEvents } = _RoomEvents;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[0];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 860, maxWidth: '100%', margin: '0 auto', padding: 16 }}>
        <RoomEvents id={conference.id} name={conference.name} status={1} members={conference.members} data={null} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

### API

### RoomEvents

房间情况展示组件。基于后端聚合摘要展示实际会议时长、成员摘要、设备信息、质量分析与事件时间线。组件纯展示，不请求接口。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 自定义 CSS 类名 |
| id | string | 否 | - | 房间/会议 ID，展示在概览区 |
| name | string | 否 | - | 房间/会议名称，展示在概览区标题 |
| status | number | 否 | - | 会议状态（兼容字段） |
| members | array | 否 | `[]` | 成员列表，用于名称映射，字段含 `id` / `nickname` / `email` |
| data | object | 否 | - | 后端房间事件聚合摘要（`getTrtcRoomEventsSummary`） |

#### 远程调用示例（unfolds 等）

```jsx
import RemoteLoader from '@kne/remote-loader';

<RemoteLoader
  module="components-trtc-conference:RoomEvents"
  id={roomId}
  name={roomName}
  status={1}
  members={members}
  data={roomEventsSummary}
/>
```
