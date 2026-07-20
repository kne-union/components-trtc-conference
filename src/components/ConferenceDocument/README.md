# ConferenceDocument

### 概述

会议文档展示组件，支持两种文档类型：文件列表预览和远程模块加载。文件列表模式下提供文件选择器和预览功能；远程模块模式下可加载自定义的远程组件，支持语音识别和会议结束回调的集成。

核心特性：
- **文件列表模式**：支持 PDF、图片、Office 文档等多种格式的文件预览和切换
- **远程模块模式**：支持加载自定义远程组件，灵活扩展文档协作功能
- **语音识别集成**：远程模块模式下支持接入语音输入和语音识别事件
- **会议生命周期回调**：支持获取会议结束回调，用于文档组件的清理操作


### 示例

#### 示例代码

- 文件列表模式
- 文件列表模式：顶部下拉切换；文件名超长省略，列表超长可滚动/搜索
- _ConferenceDocument(@components/ConferenceDocument),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: ConferenceDocument } = _ConferenceDocument;
const { default: preset } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const LONG_NAME =
  '2026年Q2产品规划与跨部门协作方案-最终版-含附录与修订记录-v3.2.1.pdf';

const MANY_FILES = [
  { filename: LONG_NAME, id: 'file-001' },
  { filename: '竞品分析报告.xlsx', id: 'file-002' },
  { filename: '技术架构概览.pdf', id: 'file-003' },
  { filename: '用户访谈纪要-华东区-2026-03.docx', id: 'file-004' },
  { filename: '预算明细表-市场部与产品部联合评审.xlsx', id: 'file-005' },
  { filename: '视觉设计规范.pdf', id: 'file-006' },
  { filename: '接口文档-会议模块-OpenAPI.yaml', id: 'file-007' },
  { filename: '上线检查清单.md', id: 'file-008' },
  { filename: '客户反馈汇总-超长文件名用于验证省略显示效果-请打开下拉查看完整列表.html', id: 'file-009' },
  { filename: '附录A-参考资料.pdf', id: 'file-010' }
];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ height: 500, maxWidth: 420, border: '1px dashed #d9d9d9', padding: 12, boxSizing: 'border-box' }}>
        <ConferenceDocument type="files" files={MANY_FILES} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 远程模块模式
- 展示会议文档的远程模块模式，加载自定义远程组件并传递语音识别和会议结束回调
- _ConferenceDocument(@components/ConferenceDocument),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader),antd(antd)

```jsx
const { default: ConferenceDocument } = _ConferenceDocument;
const { default: preset } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Flex } = antd;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <Flex vertical gap={16}>
        <div style={{ color: '#999', fontSize: 12 }}>
          远程模块模式需要配置有效的远程模块路径，此示例展示组件的调用方式
        </div>
        <div style={{ height: 400 }}>
          <ConferenceDocument
            type="remote-module"
            module="components-example:CustomDocument"
            moduleProps={{
              conferenceStep: 'waiting',
              customProp: '示例数据'
            }}
            getSpeechInput={onSpeechInput => {
              console.log('已注册语音输入回调');
            }}
            onSpeechStart={() => console.log('语音识别开始')}
            onSpeechEnd={() => console.log('语音识别结束')}
            getEndConferenceCallback={callback => {
              console.log('已注册会议结束回调');
            }}
          />
        </div>
      </Flex>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

### API

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
