import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceFormInner from './ConferenceFormInner';
import { App, Button } from 'antd';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const EditConference = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@usePreset']
})(withLocale(({ remoteModules, children, data, apis, onSuccess }) => {
  const [FormInfo, usePreset] = remoteModules;
  const { useFormModal } = FormInfo;
  const formModal = useFormModal();
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const id = data.id;
  const { formatMessage } = useIntl();
  return children({
    onClick: () => {
      const formModalApi = formModal({
        title: formatMessage({ id: 'EditMeeting' }),
        size: 'small',
        formProps: {
          data,
          onSubmit: async data => {
            const { data: resData } = await ajax(
              Object.assign({}, apis.save, {
                data: Object.assign(
                  {},
                  data,
                  data.options?.document
                    ? {
                        options: Object.assign({}, data.options, { documentType: 'files' })
                      }
                    : {},
                  { id }
                )
              })
            );
            if (resData.code !== 0) {
              return;
            }
            message.success(formatMessage({ id: 'SaveSuccess' }));
            formModalApi.close();
            onSuccess && onSuccess();
          }
        },
        children: <ConferenceFormInner isEdit />
      });
    }
  });
}));

export const EditConferenceButton = ({ data, apis, onSuccess, ...props }) => {
  return (
    <EditConference data={data} apis={apis} onSuccess={onSuccess}>
      {({ onClick }) => <Button {...props} onClick={onClick} />}
    </EditConference>
  );
};

export default EditConference;
