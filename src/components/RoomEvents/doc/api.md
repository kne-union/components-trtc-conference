### RoomEvents

房间情况展示组件。基于后端聚合摘要（`getTrtcRoomEventsSummary` / `open-api/roomEventsSummary`）展示实际会议时长、成员摘要、设备信息、质量分析、降采样图表与离散事件时间线。组件纯展示，不请求接口。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 自定义 CSS 类名 |
| id | string | 否 | - | 房间/会议 ID，展示在概览区 |
| name | string | 否 | - | 房间/会议名称，展示在概览区标题 |
| status | number | 否 | - | 会议状态（兼容字段，实际结束时间以 `data.overview` 为准） |
| members | array | 否 | `[]` | 成员列表，用于名称映射，字段含 `id` / `nickname` / `email` |
| data | object | 否 | - | 后端房间事件聚合摘要 |

#### data 结构（常用字段）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| overview | object | `actualStart` / `actualEnd` / `actualDurationSeconds` / `useLiveEnd` |
| summary | object | `memberCount` / `onlineCount` / `networkIssueCount` / `deviceIssueCount` |
| members | array | 按人聚合：`deviceInfo` / `analysis` / `charts` / `timeline` |

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
