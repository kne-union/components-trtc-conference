import { createWithRemoteLoader } from '@kne/remote-loader';
import MemberFormInner from './MemberFormInner';
import { App } from 'antd';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const SaveMember = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@usePreset']
})(withLocale(({ remoteModules, children, data, apis, onSuccess }) => {
  const [FormInfo, usePreset] = remoteModules;
  const { useFormModal } = FormInfo;
  const formModal = useFormModal();
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const { formatMessage } = useIntl();

  return children({
    onClick: () => {
      const formModalApi = formModal({
        title: formatMessage({ id: 'ModifyParticipantInfo' }),
        size: 'small',
        formProps: {
          data,
          onSubmit: async data => {
            const { data: resData } = await ajax(Object.assign({}, apis.saveMember, { data }));
            if (resData.code !== 0) {
              return;
            }
            message.success(formatMessage({ id: 'ModifySuccess' }));
            formModalApi.close();
            onSuccess && onSuccess();
          }
        },
        children: <MemberFormInner />
      });
    }
  });
}));

export default SaveMember;
