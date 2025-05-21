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
