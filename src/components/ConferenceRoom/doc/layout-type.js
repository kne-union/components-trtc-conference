const { LayoutType } = _ConferenceRoom;
const { useState } = React;
const { Flex, Radio, Card } = antd;

const BaseExample = () => {
  const [layoutType, setLayoutType] = useState(1);
  return (
    <Flex vertical gap={16}>
      <Card title="布局类型选择器" size="small">
        <LayoutType value={layoutType} onChange={setLayoutType} />
      </Card>
      <div>当前选中的布局类型: {layoutType}</div>
      <Radio.Group
        value={layoutType}
        onChange={e => setLayoutType(e.target.value)}
        options={[
          { value: 1, label: '网格' },
          { value: 2, label: '顶部成员列表' },
          { value: 3, label: '左侧成员列表' },
          { value: 4, label: '底部成员列表' }
        ]}
      />
    </Flex>
  );
};

render(<BaseExample />);
