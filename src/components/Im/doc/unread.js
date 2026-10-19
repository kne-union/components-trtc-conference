const { ImUnreadButton } = _Im;

const BaseExample = () => {
  return (
    <ImUnreadButton count={6} type="primary">
      聊天
    </ImUnreadButton>
  );
};

render(<BaseExample />);
