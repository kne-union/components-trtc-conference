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
        size: 'large',
        formProps: {
          onSubmit: async data => {
            const options = Object.assign({}, data.options);
            if (options.documentType === 'iframe') {
              if (options.documentUrl) {
                delete options.document;
              } else {
                delete options.documentType;
                delete options.documentUrl;
              }
            } else if (options.document?.length) {
              options.documentType = 'files';
              delete options.documentUrl;
            } else {
              delete options.documentType;
              delete options.document;
              delete options.documentUrl;
            }
            const { data: resData } = await ajax(
              Object.assign({}, apis.create, {
                data: Object.assign({}, data, { options })
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
