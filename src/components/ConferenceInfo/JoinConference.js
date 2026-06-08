import { createWithRemoteLoader } from '@kne/remote-loader';
import MemberFormInner from './MemberFormInner';
import { App } from 'antd';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const JoinConference = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@usePreset']
})(
  withLocale(({ remoteModules, children, apis, onSuccess }) => {
    const [FormInfo, usePreset] = remoteModules;
    const { useFormModal } = FormInfo;
    const formModal = useFormModal();
    const { ajax } = usePreset();
    const { message } = App.useApp();
    const { formatMessage } = useIntl();

    return children({
      onClick: () => {
        const formModalApi = formModal({
          title: formatMessage({ id: 'JoinMeetingTitle' }),
          size: 'small',
          formProps: {
            onSubmit: async data => {
              const { data: resData } = await ajax(Object.assign({}, apis.joinConference, { data }));
              if (resData.code !== 0) {
                return;
              }
              message.success(formatMessage({ id: 'JoinSuccess' }));
              formModalApi.close();
              onSuccess && onSuccess(resData.data);
            }
          },
          children: <MemberFormInner />
        });
      }
    });
  })
);

export default JoinConference;
