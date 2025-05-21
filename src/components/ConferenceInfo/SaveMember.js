import { createWithRemoteLoader } from '@kne/remote-loader';
import MemberFormInner from './MemberFormInner';
import { App } from 'antd';

const SaveMember = createWithRemoteLoader({
  modules: ['components-core:FormInfo', 'components-core:Global@usePreset']
})(({ remoteModules, children, data, apis, onSuccess }) => {
  const [FormInfo, usePreset] = remoteModules;
  const { useFormModal } = FormInfo;
  const formModal = useFormModal();
  const { ajax } = usePreset();
  const { message } = App.useApp();

  return children({
    onClick: () => {
      const formModalApi = formModal({
        title: '修改参会人信息',
        size: 'small',
        formProps: {
          data,
          onSubmit: async data => {
            const { data: resData } = await ajax(Object.assign({}, apis.saveMember, { data }));
            if (resData.code !== 0) {
              return;
            }
            message.success('修改成功');
            formModalApi.close();
            onSuccess && onSuccess();
          }
        },
        children: <MemberFormInner />
      });
    }
  });
});

export default SaveMember;
