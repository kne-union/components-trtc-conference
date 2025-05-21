
# ConferenceInfo


### 概述

会议信息


### 示例(全屏)

#### 示例代码

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceInfo(@components/ConferenceInfo)

```jsx
const { default: ConferenceInfo } = _ConferenceInfo;
const BaseExample = () => {
  return <ConferenceInfo />;
};

render(<BaseExample />);

```

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceInfo(@components/ConferenceInfo),remoteLoader(@kne/remote-loader)

```jsx
const { ConferenceFormInner } = _ConferenceInfo;
const { createWithRemoteLoader } = remoteLoader;
const BaseExample = createWithRemoteLoader({
  modules: ['components-core:FormInfo']
})(({ remoteModules }) => {
  const [FormInfo] = remoteModules;
  const { Form, SubmitButton } = FormInfo;
  return (
    <Form
      onSubmit={data => {
        console.log(data);
      }}
    >
      <ConferenceFormInner />
      <div>
        <SubmitButton>提交</SubmitButton>
      </div>
    </Form>
  );
});

render(<BaseExample />);

```

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceInfo(@components/ConferenceInfo)

```jsx
const { ConferenceDetail } = _ConferenceInfo;
const BaseExample = () => {
  return (
    <ConferenceDetail
      startTime={new Date()}
      duration={60}
      name="张三的会议"
      status={0}
      memberList={[
        {
          nickname: '张三',
          isMaster: true
        },
        {
          nickname: '李四'
        }
      ]}
    />
  );
};

render(<BaseExample />);

```

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceInfo(@components/ConferenceInfo)

```jsx
const { ConferenceDetail } = _ConferenceInfo;
const BaseExample = () => {
  return (
    <ConferenceDetail
      startTime={new Date()}
      duration={60}
      name="张三的会议"
      status={1}
      memberList={[
        {
          nickname: '张三',
          isMaster: true
        },
        {
          nickname: '李四'
        }
      ]}
    />
  );
};

render(<BaseExample />);

```


### API

|属性名|说明|类型|默认值|
|  ---  | ---  | --- | --- |

