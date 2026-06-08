import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceFormInner from './ConferenceFormInner';
import { App } from 'antd';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const AddConference = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@usePreset']
})(withLocale(({ remoteModules, children, apis, onSuccess }) => {
  const [FormInfo, usePreset] = remoteModules;
  const { useFormModal } = FormInfo;
  const formModal = useFormModal();
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  return children({
    onClick: () => {
      const formModalApi = formModal({
        title: formatMessage({ id: 'AddMeetingTitle' }),
        size: 'small',
        formProps: {
          onSubmit: async data => {
            const { data: resData } = await ajax(
              Object.assign({}, apis.create, {
                data: Object.assign(
                  {},
                  data,
                  data.options?.document
                    ? {
                        options: Object.assign({}, data.options, { documentType: 'files' })
                      }
                    : {}
                )
              })
            );
            if (resData.code !== 0) {
              return;
            }
            message.success(formatMessage({ id: 'AddSuccess' }));
            formModalApi.close();
            onSuccess && onSuccess(resData.data);
          }
        },
        children: <ConferenceFormInner />
      });
    }
  });
}));

export default AddConference;
