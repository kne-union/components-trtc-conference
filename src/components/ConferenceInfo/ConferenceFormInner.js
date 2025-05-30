import { createWithRemoteLoader } from '@kne/remote-loader';
import dayjs from 'dayjs';
import range from 'lodash/range';

const ConferenceFormInner = createWithRemoteLoader({
  modules: ['components-core:FormInfo']
})(({ remoteModules, isEdit }) => {
  const [FormInfo] = remoteModules;
  const { TableList, useFormContext } = FormInfo;
  const { Input, DatePicker, Select, Upload, Switch, InputNumber, Checkbox, RadioGroup } = FormInfo.fields;
  const { formData } = useFormContext();
  return (
    <>
      <FormInfo
        column={1}
        list={[
          <Input name="name" label="会议名称" rule="REQ LEN-0-100" />,
          <DatePicker
            disabled={isEdit}
            name="startTime"
            label="开始时间"
            rule="REQ"
            inputReadOnly
            showTime
            minuteStep={15}
            format="YYYY-MM-DD HH:mm"
            disabledDate={date => {
              return date && date.isBefore(dayjs().startOf('day'));
            }}
            disabledTime={current => {
              const now = dayjs();
              const output = {};
              if (current && current.isSame(now, 'day')) {
                output.disabledHours = () => range(0, now.hour());
              }
              return output;
            }}
          />,
          <Select
            name="duration"
            label="时长"
            defaultValue={60}
            rule="REQ"
            options={[
              { label: '15分钟', value: 15 },
              { label: '30分钟', value: 30 },
              {
                label: '45分钟',
                value: 45
              },
              { label: '1小时', value: 60 },
              { label: '1小时30分钟', value: 90 },
              {
                label: '2小时',
                value: 120
              },
              { label: '3小时', value: 180 }
            ]}
          />,
          <Switch
            name="isInvitationAllowed"
            label="是否允许邀请"
            defaultValue={true}
            tips="主持人可以邀请其他人进入会议，达到或超过最大参会成员数则不能继续邀请"
          />,
          <InputNumber name="maxCount" label="最大参会成员数" defaultValue={2} display={formData.isInvitationAllowed} />,
          <Upload
            name="options.document"
            label="文档"
            maxLength={10}
            accept={['.pdf', '.jpg', '.png', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.html']}
          />,
          <Switch
            name="options.documentVisibleAll"
            label="文档全员可见"
            tips="默认仅主持人可见"
            display={formData.options?.document && formData.options?.document.length > 0}
          />
        ]}
      />
      {!isEdit && (
        <>
          <TableList
            name="members"
            title="成员"
            column={1}
            list={[
              <Input name="nickname" label="昵称" />,
              <Input name="email" label="邮箱" rule="EMAIL" />,
              <Switch name="isMaster" label="是否主持人" />
            ]}
          />
          <Checkbox name="includingMe" label="我也参加" labelHidden defaultValue={true}>
            我也参加
          </Checkbox>
        </>
      )}
      {!isEdit && (
        <FormInfo
          title="高级设置"
          column={1}
          list={[
            <RadioGroup
              name="options.setting.record"
              label="是否录制会议"
              defaultValue=""
              options={[
                { value: '', label: '不启用' },
                { value: 'audio', label: '录制音频' },
                { value: 'video', label: '录制视频' }
              ]}
            />,
            <RadioGroup
              name="options.setting.speech"
              label="是否开启实时语音识别"
              defaultValue={false}
              options={[
                { value: false, label: '关闭' },
                { value: true, label: '开启' }
              ]}
            />
          ]}
        />
      )}
    </>
  );
});

export default ConferenceFormInner;
