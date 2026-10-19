const { ImNotice } = _Im;
const { Button, Space } = antd;
const { useState } = React;

const BaseExample = () => {
  const [message, setMessage] = useState(null);
  const [external, setExternal] = useState(false);
  const [log, setLog] = useState('');
  return (
    <Space direction="vertical">
      <Space>
        <Button
          onClick={() =>
            setMessage({
              id: Date.now(),
              name: '李明辉',
              text: '我到了，声音正常。'
            })
          }
        >
          收到一条消息
        </Button>
        <Button onClick={() => setExternal(value => !value)}>{external ? '改回内部通知' : '接入外部通知'}</Button>
      </Space>
      {log ? <div>外部通知：{log}</div> : null}
      <ImNotice message={message} onNotify={external ? item => setLog(`${item.name}：${item.text}`) : undefined} />
    </Space>
  );
};

render(<BaseExample />);
