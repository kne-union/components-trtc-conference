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
