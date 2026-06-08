# App

### 概述

基于腾讯实时音视频（TRTC）的视频会议系统，提供完整的会议创建、管理、邀请和实时音视频通讯能力。支持多人同时参会、屏幕分享、会议录制、AI语音转写等核心功能，通过模块化组件设计，可灵活集成到各类业务系统中。

核心特性：
- **全流程会议管理**：覆盖会议创建、编辑、邀请成员、加入会议、结束会议的完整生命周期
- **多种布局模式**：支持网格、顶部成员列表、右侧成员列表、底部成员列表四种视频布局，满足不同会议场景
- **实时音视频通讯**：基于TRTC SDK实现低延迟、高质量的音视频通话，支持屏幕分享
- **会议文档协作**：支持文件预览和远程模块两种文档展示方式，可配置文档全员可见
- **AI语音转写**：支持实时语音识别，自动将会议语音转为文字记录
- **会议录制**：支持音频和视频两种录制模式，会议结束后可回放录制内容


### 示例(全屏)

#### 示例代码

- 基础用法
- 配置基础路由和用户信息，展示完整的视频会议应用
- _App(@components/App),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader),reactRouterDom(react-router-dom)

```jsx
const { default: App } = _App;
const { default: preset, mockUserInfo } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Route, Routes, Navigate } = reactRouterDom;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <Routes>
        <Route
          path="/conference/*"
          element={<App baseUrl="/conference" userInfo={mockUserInfo} headerName="x-trtc-conference-code" name="conference" />}
        />
        <Route path="*" element={<Navigate to="/conference" replace />} />
      </Routes>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

### API

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
