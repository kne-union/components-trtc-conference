### RoomEvents

房间情况展示组件，基于 TRTC 房间事件数据展示实际会议时长、成员摘要、设备信息、质量分析与事件时间线。组件纯展示，不请求接口，可由宿主传入 `events` 数据后直接渲染，便于 unfolds 等平台复用。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 自定义 CSS 类名 |
| id | string | 否 | - | 房间/会议 ID，展示在概览区 |
| name | string | 否 | - | 房间/会议名称，展示在概览区标题 |
| status | number | 否 | - | 会议状态：`0` 进行中/待开始、`1` 已结束；已结束时若无退房/解散事件，会用最后一条事件时间推断实际结束时间 |
| members | array | 否 | `[]` | 成员列表，用于名称映射与摘要统计，字段含 `id` / `nickname` / `email` |
| events | array | 否 | `[]` | TRTC 房间事件列表，结构与 `getTrtcInstanceEvents` 返回的 `pageData` 一致 |

#### events 单条结构（常用字段）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 事件 ID |
| code | string | 事件编码，如 `Client.enter`、`Client.network-quality`、`1001` |
| time | string | 事件时间（ISO 字符串） |
| payload | object | 事件载荷，含 `userId` / `reporterId` / `event` / `data` 等 |

#### 远程调用示例（unfolds 等）

```jsx
import RemoteLoader from '@kne/remote-loader';

<RemoteLoader
  module="components-trtc-conference:RoomEvents"
  id={roomId}
  name={roomName}
  status={1}
  members={members}
  events={events}
/>
```
