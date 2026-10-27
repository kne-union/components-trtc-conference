### Im

即时通讯面板。调用会话接口拿到 WebSocket 凭证后拉取历史并收发消息。会话接口返回 `conversationId` 时为会议模式，连接只属于这一个会话。不返回 `conversationId` 时为用户级模式，一条连接接收该用户全部会话的消息，切换会话不重连，各会话的未读、最后一条消息和排序实时更新。自己的未读消息显示圆点，悬停可撤回。发送时间在消息间隔超过 5 分钟时居中显示。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 根节点类名 |
| avatarShape | `'circle' \| 'rounded'` | 否 | `circle` | 头像形状。`circle` 为圆形，`rounded` 为圆角矩形。作用于会话列表、联系人、消息和通话头像 |
| sessionUrl | string | 否 | - | 创建或加入会话的 POST 地址。会议模式成功时 `data` 含 `wsToken`、`conversationId`、`memberId`；用户级模式只含 `wsToken`、`userId`（对应 IM 成员的 `userId`）。传入 `data` 时不需要 |
| data | object | 否 | - | 静态消息。传入后不建立连接，直接渲染。字段：`memberId`、`memberName`、`peerReadSeq`、`messages` |
| devApiHost | string | 否 | - | 本地开发时的 WebSocket 主机，例如 `localhost:8042`。不传则使用当前页面主机 |
| wsPath | string | 否 | `/api/v1/im/ws` | WebSocket 路径，接在接口主机后面 |
| uploadUrl | string | 否 | `/api/v1/static/upload` | 图片和文件上传地址 |
| showPhrases | boolean | 否 | `true` | 是否显示常用语 |
| showEmoji | boolean | 否 | `true` | 是否显示表情 |
| showImage | boolean | 否 | `true` | 是否允许发送图片 |
| showFile | boolean | 否 | `true` | 是否允许发送文件 |
| showRaiseHand | boolean | 否 | `true` | 是否显示举手，举手超过 10 秒自动放下 |
| showVoiceCall | boolean | 否 | `false` | 是否显示语音通话。接通后使用 TRTC，通话记录写入消息列表。当前会话里至少还有一名其他成员在线时才可发起 |
| showVideoCall | boolean | 否 | `false` | 是否显示视频通话。接通后使用 TRTC，通话记录写入消息列表。当前会话里至少还有一名其他成员在线时才可发起 |
| features | object | 否 | - | 统一开关。字段：`phrases`、`emoji`、`image`、`file`、`raiseHand`、`voiceCall`、`videoCall`。传入的字段覆盖同名 `show*` |
| callUrl | string | 否 | - | 签发 TRTC 进房参数的 POST 地址。请求体 `{ roomId }`，成功时 `data` 含 `sdkAppId`、`userId`、`userSig`、`roomId` |
| phrases | string[] | 否 | 内置会议常用语 | 自定义常用语，点击后直接发送 |
| conversations | array | 否 | - | 左侧会话列表，不传则不显示左侧栏。项字段：`id`、`name`、`avatar`、`preview`、`time`、`unread`、`contactId`。用户级模式下 `id` 为 IM 会话 ID，`unread`、`preview`、`time` 由连接实时覆盖并按最新消息排序，在线状态按会话成员判断 |
| contacts | array | 否 | - | 左侧联系人列表，不传则不显示通讯录。项字段：`id`、`name`、`avatar`、`remark`。与 `conversations` 同时传入时，左侧可在聊天和通讯录之间切换。通讯录可按姓名、备注关键字筛选 |
| activeConversationId | string | 否 | 第一项 | 当前会话。不传时组件内部记住点击项。用户级模式下切换只更换历史和发送目标，不重连；没有当前会话时提示选择会话。收到其他会话的来电会自动切到该会话并回调 `onConversationSelect` |
| onConversationSelect | function | 否 | - | 点击会话时回调，参数为该项。可在这里切换右侧 `data` 或会话连接 |
| onContactSelect | function | 否 | - | 在联系人资料卡上点击「发消息」时回调，参数为该项。已有会话（`id` 或 `contactId` 对上）则打开；没有则新建一条与该联系人的会话并打开。父组件可在回调里补上这条会话的 `data`。回调返回 Promise 并解析为会话项（含真实 `id`）时，用该项代替临时会话打开，适用于用户级模式先创建单聊再进入 |

### ImUnreadButton

带未读徽标的按钮。不传 `count` 时读取当前连接的未读数。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| count | number | 否 | 当前未读数 | 徽标数字。不传则使用 `useIm().unread` |
| icon | ReactNode | 否 | - | 按钮图标 |
| children | ReactNode | 否 | - | 按钮内容 |
| className | string | 否 | - | 按钮类名 |
| 其他 | - | 否 | - | 透传给 antd `Button`，如 `type`、`onClick`、`shape`、`size` |

### ImNotice

接收一条消息后在页面右侧展示通知。默认使用内部通知。传入 `onNotify` 后改为调用外部系统，不再渲染内部通知。不传 `message` 时监听当前连接收到的消息。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| message | object | 否 | 连接中的新消息 | 要展示的消息。字段：`id`、`name`、`text`。不传则使用连接里的通知 |
| onNotify | function | 否 | - | 外部通知函数，参数为 `{ id, name, text, message }`。传入后不显示内部通知 |

### ImConnection

页面级连接。挂载后建立会话，卸载且没有其他持有者时断开。聊天面板关闭时也应保持挂载，以便接收消息。默认在页面右侧弹出内部通知。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| sessionUrl | string | 是 | - | 与 `Im` 相同。用户级模式下页面只需挂一个连接，即可接收全部会话的消息、未读和来电 |
| devApiHost | string | 否 | - | 与 `Im` 相同 |
| wsPath | string | 否 | `/api/v1/im/ws` | 与 `Im` 相同 |
| showNotice | boolean | 否 | `true` | 是否在连接组件内展示通知 |
| onNotify | function | 否 | - | 同 `ImNotice`。传入后改用外部通知 |
| callUrl | string | 否 | - | 同 `Im`。来电界面由连接组件挂在页面上，聊天面板关闭时也能接听 |

### useIm

读取当前连接状态。需与 `Im` 或 `ImConnection` 出现在同一页面。

#### 返回值

| 字段名 | 类型 | 说明 |
|--------|------|------|
| ready | boolean | WebSocket 是否已打开 |
| connectError | string | 失败原因。`failed` 表示连接失败，其他字符串为服务端消息 |
| messages | array | 当前消息列表 |
| memberId | string | 当前成员 ID |
| unread | number | 会议模式为面板关闭期间收到的他人消息数；用户级模式为全部会话未读之和（面板打开时不含当前会话） |
| onlineUsers | array | 在线成员。项含 `userId`、`name`、`avatar`。用户级模式下连接后会查询每个会话的在线成员并合并 |
| userMode | boolean | 是否为用户级连接 |
| userId | string | 用户级模式下当前用户的 IM `userId` |
| conversationId | string | 用户级模式下当前会话 ID |
| conversations | array | 用户级模式下服务端会话列表，项含 `id`、`members`、`unreadCount`、`lastMessage` |
| conversationUnread | object | 用户级模式下各会话未读数，键为会话 ID |
| lastMessages | object | 用户级模式下各会话最后一条消息，键为会话 ID |

### isImPeerOnline

判断某个会话里除自己外是否有成员在线。参数为 `useIm()` 的返回值和会话 ID，返回 boolean。用户级模式下可用于在会话列表或业务卡片上显示对方在线状态。

```js
const im = useIm();
const online = isImPeerOnline(im, conversationId);
```
