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
