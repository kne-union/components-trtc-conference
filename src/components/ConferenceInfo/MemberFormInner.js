import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex } from 'antd';

const MemberFormInner = createWithRemoteLoader({
  modules: ['components-core:FormInfo']
})(({ remoteModules }) => {
  const [FormInfo] = remoteModules;
  const { Input, Avatar } = FormInfo.fields;
  return (
    <FormInfo
      column={1}
      list={[
        <Flex justify="center">
          <Avatar name="avatar" label="头像" labelHidden interceptor="photo-string" />
        </Flex>,
        <Input name="nickname" label="昵称" rule="REQ" />,
        <Input name="email" label="邮箱" />
      ]}
    />
  );
});

export default MemberFormInner;
