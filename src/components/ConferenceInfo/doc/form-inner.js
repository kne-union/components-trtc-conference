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
