import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex } from 'antd';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const MemberFormInner = createWithRemoteLoader({
  modules: ['components-core:FormInfo']
})(withLocale(({ remoteModules }) => {
  const [FormInfo] = remoteModules;
  const { Input, Avatar } = FormInfo.fields;
  const { formatMessage } = useIntl();
  return (
    <FormInfo
      column={1}
      list={[
        <Flex justify="center">
          <Avatar name="avatar" label={formatMessage({ id: 'Avatar' })} labelHidden interceptor="photo-string" />
        </Flex>,
        <Input name="nickname" label={formatMessage({ id: 'Nickname' })} rule="REQ LEN-0-100" />,
        <Input name="email" label={formatMessage({ id: 'Email' })} rule="EMAIL LEN-0-100" />
      ]}
    />
  );
}));

export default MemberFormInner;
