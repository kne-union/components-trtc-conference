### App

视频会议主应用组件，提供路由管理和全局上下文配置，包含首页、详情、邀请和会议四个页面。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| baseUrl | string | 是 | - | 应用路由基础路径，所有子路由基于此路径 |
| userInfo | object | 是 | - | 当前登录用户信息，包含 id、nickname、email、avatar 等字段 |
| headerName | string | 否 | `'x-trtc-conference-code'` | 请求头中用于传递会议认证码的字段名 |
| name | string | 否 | `'conference'` | 应用标识名称 |

#### userInfo 数据结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 用户唯一标识 |
| nickname | string | 用户昵称 |
| email | string | 用户邮箱 |
| avatar | string | 用户头像地址 |

#### 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `{baseUrl}` | Home | 首页，展示会议列表 |
| `{baseUrl}/invite` | Invite | 邀请页，通过邀请链接加入会议 |
| `{baseUrl}/detail` | Detail | 会议详情页 |
| `{baseUrl}/conference` | Conference | 会议进行页面 |
