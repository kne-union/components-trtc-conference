import { createWithRemoteLoader } from '@kne/remote-loader';
import MemberFormInner from './MemberFormInner';
import { App } from 'antd';

const JoinConference = createWithRemoteLoader({
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
        title: '加入会议',
        size: 'small',
        formProps: {
          onSubmit: async data => {
            const { data: resData } = await ajax(Object.assign({}, apis.joinConference, { data }));
            if (resData.code !== 0) {
              return;
            }
            message.success('加入成功');
            formModalApi.close();
            onSuccess && onSuccess(resData.data);
          }
        },
        children: <MemberFormInner />
      });
    }
  });
});

export default JoinConference;
