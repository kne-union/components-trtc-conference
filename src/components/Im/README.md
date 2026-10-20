# Im

### 概述

会议即时通讯面板，可单独嵌到弹窗、侧栏或其他业务页面。左侧会话列表和联系人列表都是可选的，不传 `conversations`、`contacts` 时只显示聊天。传入 `data` 时可直接用静态消息预览，不必连接会话。支持文字、表情、图片、文件、常用语和举手。语音通话和视频通话默认关闭，可用 `showVoiceCall`、`showVideoCall` 或 `features` 打开。当前会话里至少还有一名其他成员在线时才能发起，接通后媒体走 TRTC，结束后在消息列表留下通话记录。静态 `data` 预览不检查在线状态。同一页面只保持一条会话连接，面板关闭后仍可由连接组件继续收消息并累计未读，同时在页面右上角弹出通知。自己发出且对方还未读的消息会显示未读圆点，悬停可以撤回。相邻消息间隔超过 5 分钟时，在中间显示发送时间。

其他项目通过远程模块 `components-trtc-conference:Im` 渲染聊天面板。页面进入时挂载 `components-trtc-conference:Im@ImConnection` 保持连接。未读按钮使用 `components-trtc-conference:Im@ImUnreadButton`，右侧通知使用 `components-trtc-conference:Im@ImNotice`。传入 `onNotify` 可改为外部系统展示通知。会话接口需返回 `wsToken`、`conversationId`、`memberId`。


### 示例

#### 示例代码

- 会议群聊
- 使用会议群聊的 mock 数据渲染完整面板，包含文字、文件、举手、撤回和未读
- _Im(@components/Im),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 420, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im data={mockIm} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 会话和联系人
- 左侧列表可选。不传 conversations 和 contacts 时只有聊天；同时传入时可在聊天和通讯录之间切换。通讯录里点发消息会打开或新建与该联系人的会话
- _Im(@components/Im),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { useState } = React;

const threads = {
  group: mockIm,
  li: {
    memberId: mockIm.memberId,
    memberName: mockIm.memberName,
    peerReadSeq: 1,
    messages: [
      {
        id: 'li-1',
        seq: 1,
        senderId: 'im-member-li',
        sender: { nickname: '李明辉' },
        type: 'text',
        content: { type: 'text', value: '方案我发你了，看完回我。' },
        status: 0,
        createdAt: new Date().toISOString()
      }
    ]
  }
};

const conversations = [
  { id: 'group', name: '产品需求评审', preview: '收到，我先看一下方案。', time: '10:24' },
  { id: 'li', name: '李明辉', preview: '方案我发你了，看完回我。', time: '09:12', unread: 2, contactId: 'im-member-li' }
];

const contacts = [
  { id: 'im-member-li', name: '李明辉', remark: '产品' },
  { id: 'im-member-wang', name: '王芳', remark: '设计' }
];

const emptyThread = () => ({
  memberId: mockIm.memberId,
  memberName: mockIm.memberName,
  peerReadSeq: 0,
  messages: []
});

const DirectoryExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [threadMap, setThreadMap] = useState(threads);
  const [activeId, setActiveId] = useState('group');
  const openConversation = item => {
    setThreadMap(current => {
      if (current[item.id]) {
        return current;
      }
      const next = Object.assign({}, current);
      next[item.id] = emptyThread();
      return next;
    });
    setActiveId(item.id);
  };
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 760, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im
          data={threadMap[activeId]}
          conversations={conversations}
          contacts={contacts}
          activeConversationId={activeId}
          onConversationSelect={openConversation}
        />
      </div>
    </PureGlobal>
  );
});

render(<DirectoryExample />);

```

- 只发文字和表情
- 关闭举手、图片和文件，并换成业务自己的常用语
- _Im(@components/Im),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const TextExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 420, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im data={mockIm} showRaiseHand={false} showImage={false} showFile={false} phrases={['收到', '我看一下', '马上处理']} />
      </div>
    </PureGlobal>
  );
});

render(<TextExample />);

```

- 语音和视频通话
- 默认关闭。通过 features 打开后，可发起通话；示例不进 TRTC 房间，挂断后在列表留下记录
- _Im(@components/Im),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 420, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im data={mockIm} features={{ voiceCall: true, videoCall: true }} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 未读按钮
- 按钮上展示未读徽标，count 可传入静态数字
- _Im(@components/Im)

```jsx
const { ImUnreadButton } = _Im;

const BaseExample = () => {
  return (
    <ImUnreadButton count={6} type="primary">
      聊天
    </ImUnreadButton>
  );
};

render(<BaseExample />);

```

- 右侧通知
- 收到消息后在页面右侧展示通知，也可改为外部系统处理
- _Im(@components/Im),antd(antd)

```jsx
const { ImNotice } = _Im;
const { Button, Space } = antd;
const { useState } = React;

const BaseExample = () => {
  const [message, setMessage] = useState(null);
  const [external, setExternal] = useState(false);
  const [log, setLog] = useState('');
  return (
    <Space direction="vertical">
      <Space>
        <Button
          onClick={() =>
            setMessage({
              id: Date.now(),
              name: '李明辉',
              text: '我到了，声音正常。'
            })
          }
        >
          收到一条消息
        </Button>
        <Button onClick={() => setExternal(value => !value)}>{external ? '改回内部通知' : '接入外部通知'}</Button>
      </Space>
      {log ? <div>外部通知：{log}</div> : null}
      <ImNotice message={message} onNotify={external ? item => setLog(&#96;${item.name}：${item.text}&#96;) : undefined} />
    </Space>
  );
};

render(<BaseExample />);

```

### API

### Im

即时通讯面板。调用会话接口拿到 WebSocket 凭证后拉取历史并收发消息。自己的未读消息显示圆点，悬停可撤回。发送时间在消息间隔超过 5 分钟时居中显示。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 根节点类名 |
| avatarShape | `'circle' \| 'rounded'` | 否 | `circle` | 头像形状。`circle` 为圆形，`rounded` 为圆角矩形。作用于会话列表、联系人、消息和通话头像 |
| sessionUrl | string | 否 | - | 创建或加入会话的 POST 地址，成功时 `data` 含 `wsToken`、`conversationId`、`memberId`。传入 `data` 时不需要 |
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
| conversations | array | 否 | - | 左侧会话列表，不传则不显示左侧栏。项字段：`id`、`name`、`avatar`、`preview`、`time`、`unread`、`contactId` |
| contacts | array | 否 | - | 左侧联系人列表，不传则不显示通讯录。项字段：`id`、`name`、`avatar`、`remark`。与 `conversations` 同时传入时，左侧可在聊天和通讯录之间切换。通讯录可按姓名、备注关键字筛选 |
| activeConversationId | string | 否 | 第一项 | 当前会话。不传时组件内部记住点击项 |
| onConversationSelect | function | 否 | - | 点击会话时回调，参数为该项。可在这里切换右侧 `data` 或会话连接 |
| onContactSelect | function | 否 | - | 在联系人资料卡上点击「发消息」时回调，参数为该项。已有会话（`id` 或 `contactId` 对上）则打开；没有则新建一条与该联系人的会话并打开。父组件可在回调里补上这条会话的 `data` |

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
| sessionUrl | string | 是 | - | 与 `Im` 相同 |
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
| unread | number | 面板关闭期间收到的他人消息数 |
| onlineUsers | array | 当前会话在线成员。项含 `userId`、`name`、`avatar` |
