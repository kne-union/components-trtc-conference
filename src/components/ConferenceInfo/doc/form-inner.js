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
