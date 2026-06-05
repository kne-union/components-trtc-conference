### ConferenceInfo

会议信息主组件，展示会议列表和侧边栏操作菜单，支持分页浏览、创建会议、快速会议和会议管理。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 自定义CSS类名 |
| user | object | 是 | - | 当前登录用户信息，包含 value 字段（含 avatar/email/nickname） |
| current | number | 否 | `1` | 当前页码 |
| pageSize | number | 否 | `20` | 每页显示数量 |
| onPageChange | function | 否 | - | 页码变化回调，参数为 `{currentPage, pageSize}` |
| getDetailUrl | function | 是 | - | 获取会议详情URL的函数，参数为会议对象，返回URL字符串 |
| data | object | 是 | - | 会议列表数据，包含 pageData（会议数组）和 totalCount（总数） |
| reload | function | 否 | - | 刷新数据的回调函数 |
| apis | object | 是 | - | API接口配置对象 |
| actions | object | 是 | - | 操作回调集合 |

#### actions 结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| remove | function | 删除会议，参数为 `{id}` |
| getMemberShorten | function | 获取成员短链接，参数为成员对象 |

### ConferenceFormInner

会议表单内部组件，提供创建和编辑会议所需的表单字段。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| isEdit | boolean | 否 | `false` | 是否为编辑模式，编辑模式下开始时间和成员列表不可修改 |

#### 表单字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | string | 会议名称（必填，最长100字） |
| startTime | Date | 开始时间（必填，创建后不可修改） |
| duration | number | 会议时长，可选15/30/45/60/90/120/180分钟 |
| isInvitationAllowed | boolean | 是否允许邀请（默认允许） |
| maxCount | number | 最大参会成员数（默认2） |
| options.document | array | 会议文档（最多10个文件） |
| options.documentVisibleAll | boolean | 文档是否全员可见（默认仅主持人可见） |
| members | array | 参会成员列表（仅创建时可编辑） |
| includingMe | boolean | 我也参加（默认选中，仅创建时显示） |
| options.setting.record | string | 录制模式：`''`不启用、`'audio'`录制音频、`'video'`录制视频 |
| options.setting.speech | boolean | 是否开启实时语音识别 |

### MemberFormInner

成员表单内部组件，用于编辑参会成员的昵称、头像和邮箱信息。

#### 表单字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| avatar | string | 成员头像 |
| nickname | string | 成员昵称（必填，最长100字） |
| email | string | 成员邮箱（需符合邮箱格式） |

### ConferenceDetail

会议详情组件，展示会议完整信息，包括当前用户状态、参会人员列表、会议文档和录制资源。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| className | string | 否 | - | 自定义CSS类名 |
| id | string | 否 | - | 会议ID |
| current | object | 否 | - | 当前用户信息，包含 avatar/nickname/isMaster 等字段 |
| inviter | object | 否 | - | 邀请者信息，包含 nickname 字段 |
| startTime | string | 否 | - | 会议开始时间（ISO格式） |
| duration | number | 否 | - | 会议时长（分钟） |
| name | string | 是 | - | 会议名称 |
| status | number | 是 | - | 会议状态：0-进行中/待开始、1-已结束 |
| isInvitationAllowed | boolean | 否 | - | 是否允许邀请成员 |
| maxCount | number | 否 | - | 最大参会成员数 |
| members | array | 否 | `[]` | 参会成员列表 |
| options | object | 否 | - | 会议选项配置 |
| apis | object | 否 | - | API接口配置 |
| onReload | function | 否 | - | 数据刷新回调 |
| onEnter | function | 否 | - | 进入会议回调 |
| onDetailEnter | function | 否 | - | 进入其他成员详情回调 |
| onDetailLinkCopy | function | 否 | - | 复制成员详情链接回调 |
| onEdit | function | 否 | - | 编辑会议回调 |
| onBack | function | 否 | - | 返回回调 |
| isAdmin | boolean | 否 | - | 是否为管理员视角 |

### InviteMember

邀请成员组件，生成邀请链接和会议信息文本，支持复制邀请信息或链接。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| apis | object | 是 | - | API接口配置 |
| id | string | 否 | - | 会议ID |
| disabled | boolean | 否 | - | 是否禁用邀请按钮（如人数已满时） |

#### 静态方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| renderModal | `{inviter, conference, shorten, message}` | Modal配置对象 | 渲染邀请信息的弹窗配置 |
