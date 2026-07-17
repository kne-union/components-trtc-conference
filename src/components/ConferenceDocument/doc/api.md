### ConferenceDocument

会议文档展示组件，根据类型渲染不同的文档内容。

#### 属性说明

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| type | string | 是 | - | 文档类型：`'files'` 文件列表模式、`'iframe'` 内嵌页面模式、`'remote-module'` 远程模块模式 |
| files | array | 否 | - | 文件列表（type为'files'时使用） |
| url | string | 否 | - | 内嵌页面地址（type为'iframe'时使用） |
| module | string | 否 | - | 远程模块路径（type为'remote-module'时使用） |
| moduleProps | object | 否 | - | 传递给远程模块的属性 |
| getSpeechInput | function | 否 | - | 获取语音输入回调函数的函数，参数为回调函数 |
| onSpeechStart | function | 否 | - | 语音识别开始回调 |
| onSpeechEnd | function | 否 | - | 语音识别结束回调 |
| getEndConferenceCallback | function | 否 | - | 获取会议结束回调函数的函数，参数为回调函数 |

#### files 数据结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| filename | string | 文件名 |
| id | string | 文件ID，用于文件预览 |

#### moduleProps 常用字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| conferenceStep | string | 会议阶段，如 'waiting'、'ongoing' 等 |
| 其他属性 | any | 根据远程模块需求自定义 |
