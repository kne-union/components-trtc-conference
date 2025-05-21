
# ConferenceRoom


### 概述

会议房间


### 示例(全屏)

#### 示例代码

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceRoom(@components/ConferenceRoom)

```jsx
const { default: ConferenceRoom } = _ConferenceRoom;
const BaseExample = () => {
  return (
    <ConferenceRoom
      document={<div>这里显示文档</div>}
      list={Array.from({ length: 8 }).map((item, index) => {
        return <div key={index}>{index + 1}</div>;
      })}
    />
  );
};

render(<BaseExample />);

```

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceRoom(@components/ConferenceRoom)

```jsx
const { LayoutType } = _ConferenceRoom;
const BaseExample = () => {
  return <LayoutType />;
};

render(<BaseExample />);

```

- 这里填写示例标题
- 这里填写示例说明
- _ConferenceRoom(@components/ConferenceRoom),antd(antd)

```jsx
const { Window } = _ConferenceRoom;
const { Flex, Radio } = antd;
const { useState } = React;
const BaseExample = () => {
  const [layoutType, setLayoutType] = useState(1);
  return (
    <Flex vertical gap={12}>
      <div>
        <Radio.Group
          value={layoutType}
          onChange={e => {
            setLayoutType(e.target.value);
          }}
          options={[
            { value: 1, label: '网格' },
            { value: 2, label: '顶部成员列表' },
            {
              value: 3,
              label: '左侧成员列表'
            },
            { value: 4, label: '底部成员列表' }
          ]}
        />
      </div>
      <Window
        layoutType={layoutType}
        document={<div>这里显示document</div>}
        list={Array.from({ length: 9 }).map((item, index) => {
          return <div key={index}>{index + 1}</div>;
        })}
      />
    </Flex>
  );
};

render(<BaseExample />);

```


### API

|属性名|说明|类型|默认值|
|  ---  | ---  | --- | --- |

