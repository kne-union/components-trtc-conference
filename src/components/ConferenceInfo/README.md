# ConferenceInfo

### 概述

会议信息管理组件集，提供会议列表展示、会议创建与编辑、成员管理、会议详情查看、邀请成员等完整的会议信息管理功能。

包含以下子组件：
- **ConferenceInfo**：会议信息主组件，展示会议列表和侧边栏操作菜单
- **ConferenceFormInner**：会议表单内部组件，用于创建和编辑会议的表单字段
- **MemberFormInner**：成员表单内部组件，用于编辑参会成员信息
- **ConferenceDetail**：会议详情组件，展示会议详情、参会人员、会议文档和录制资源；房间情况通过独立组件 `RoomEvents` 展示
- **InviteMember**：邀请成员组件，生成邀请链接和会议信息

房间情况展示请使用独立组件 `RoomEvents`（`components-trtc-conference:RoomEvents`），可被 unfolds 等平台直接复用。


### 示例(全屏)

#### 示例代码

- 会议列表
- 展示会议信息主组件，包含侧边栏操作菜单和会议列表，支持创建会议、快速会议、查看和编辑
- _ConferenceInfo(@components/ConferenceInfo),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { default: ConferenceInfo } = _ConferenceInfo;
const { default: preset, mockConferenceList, mockUserInfo } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [current, setCurrent] = React.useState(1);

  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 980, maxWidth: '100%', margin: '0 auto', '--box-width': '900px' }}>
        <ConferenceInfo
          user={mockUserInfo}
          current={current}
          pageSize={20}
          onPageChange={({ currentPage }) => setCurrent(currentPage)}
          getDetailUrl={item => &#96;/conference/detail?id=${item.id}&#96;}
          data={mockConferenceList}
          reload={() => {}}
          apis={preset.apis.conference}
          actions={{
            remove: ({ id }) => console.log('删除会议', id),
            getMemberShorten: item => Promise.resolve({ shorten: 'shorten-' + item.id })
          }}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 会议表单
- 展示创建会议的表单组件，包含会议名称、时间、时长、邀请设置、成员和高级设置
- _ConferenceInfo(@components/ConferenceInfo),remoteLoader(@kne/remote-loader)

```jsx
const { ConferenceFormInner } = _ConferenceInfo;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [FormInfo, PureGlobal] = remoteModules;
  const { Form, SubmitButton } = FormInfo;
  return (
    <PureGlobal preset={{ ajax: () => Promise.resolve({ data: { code: 0, data: null } }) }}>
      <Form
        onSubmit={data => {
          console.log('提交的会议数据:', data);
        }}
      >
        <ConferenceFormInner />
        <div>
          <SubmitButton>创建会议</SubmitButton>
        </div>
      </Form>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 会议详情（进行中）
- 展示进行中会议的详情页面，包含当前用户信息、倒计时、邀请成员、参会人员列表和文档
- _ConferenceInfo(@components/ConferenceInfo),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { ConferenceDetail } = _ConferenceInfo;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[0];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ '--box-width': '100%' }}>
        <ConferenceDetail
          {...conference}
          current={conference.members[0]}
          apis={preset.apis.conference}
          isAdmin
          onEnter={() => console.log('进入会议')}
          onReload={() => {}}
          onEdit={() => console.log('编辑会议')}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 会议详情（已结束）
- 展示已结束会议的详情页面，包含参会人员列表和录制资源回放
- _ConferenceInfo(@components/ConferenceInfo),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader)

```jsx
const { ConferenceDetail } = _ConferenceInfo;
const { default: preset, mockConferenceList, mockAiTranscriptionContent } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[2];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ '--box-width': '100%' }}>
        <ConferenceDetail
          {...conference}
          current={conference.members[0]}
          apis={preset.apis.conference}
          isAdmin
          aiTranscriptionContent={mockAiTranscriptionContent}
          onReload={() => {}}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 成员表单
- 展示成员信息编辑表单，包含头像、昵称和邮箱字段
- _ConferenceInfo(@components/ConferenceInfo),remoteLoader(@kne/remote-loader)

```jsx
const { MemberFormInner } = _ConferenceInfo;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [FormInfo, PureGlobal] = remoteModules;
  const { Form, SubmitButton } = FormInfo;
  return (
    <PureGlobal preset={{ ajax: () => Promise.resolve({ data: { code: 0, data: null } }) }}>
      <Form
        data={{
          nickname: '张三',
          email: 'zhangsan@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
        }}
        onSubmit={data => {
          console.log('提交的成员数据:', data);
        }}
      >
        <MemberFormInner />
        <div>
          <SubmitButton>保存</SubmitButton>
        </div>
      </Form>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

- 邀请成员
- 展示邀请成员弹窗，包含会议邀请信息和复制链接功能
- _ConferenceInfo(@components/ConferenceInfo),_mockPreset(@root/mockPreset),remoteLoader(@kne/remote-loader),antd(antd)

```jsx
const { InviteMember } = _ConferenceInfo;
const { default: preset, mockInviteData } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Flex, App } = antd;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <App>
        <Flex vertical gap={16}>
          <InviteMember
            type="primary"
            size="large"
            shape="round"
            apis={preset.apis.conference}
          >
            邀请成员(3/10)
          </InviteMember>
        </Flex>
      </App>
    </PureGlobal>
  );
});

render(<BaseExample />);

```

### API

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
| options.allowExtend | boolean | 是否允许主持人延长会议（默认开启；开启后剩余不足15分钟时可延长15分钟） |
| isInvitationAllowed | boolean | 是否允许邀请（默认允许） |
| maxCount | number | 最大参会成员数（默认2） |
| options.attention | string | 会议注意事项（富文本 HTML，使用 CKEditor 编辑） |
| options.documentType | string | 文档类型：`'files'` 文件列表、`'iframe'` 内嵌页面 |
| options.document | array | 会议文档文件列表（最多10个，type为 files 时使用） |
| options.documentUrl | string | 内嵌页面地址（type为 iframe 时使用） |
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

会议详情组件，展示会议完整信息，包括当前用户状态、注意事项、参会人员列表、会议文档和录制资源。

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
| members | array | 否 | `[]` | 参会成员列表，成员含 `attended`（是否参加过会议） |
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
