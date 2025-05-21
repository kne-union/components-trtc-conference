import { createWithRemoteLoader } from '@kne/remote-loader';
import ConferenceFormInner from './ConferenceFormInner';
import { App } from 'antd';

const AddConference = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@usePreset']
})(({ remoteModules, children, apis, onSuccess }) => {
  const [FormInfo, usePreset] = remoteModules;
  const { useFormModal } = FormInfo;
  const formModal = useFormModal();
  const { ajax } = usePreset();
  const { message } = App.useApp();
  return children({
    onClick: () => {
      const formModalApi = formModal({
        title: '添加会议',
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
            message.success('添加成功');
            formModalApi.close();
            onSuccess && onSuccess();
          }
        },
        children: <ConferenceFormInner />
      });
    }
  });
});

export default AddConference;
