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
