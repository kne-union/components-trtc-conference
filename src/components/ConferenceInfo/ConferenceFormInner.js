import { createWithRemoteLoader } from '@kne/remote-loader';
import dayjs from 'dayjs';
import range from 'lodash/range';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const ConferenceFormInner = createWithRemoteLoader({
  modules: ['components-core:FormInfo']
})(withLocale(({ remoteModules, isEdit }) => {
  const [FormInfo] = remoteModules;
  const { TableList, useFormContext } = FormInfo;
  const { Input, DatePicker, Select, Upload, Switch, InputNumber, Checkbox, RadioGroup } = FormInfo.fields;
  const { formData } = useFormContext();
  const { formatMessage } = useIntl();
  return (
    <>
      <FormInfo
        column={1}
        list={[
          <Input name="name" label={formatMessage({ id: 'MeetingName' })} rule="REQ LEN-0-100" />,
          <DatePicker
            disabled={isEdit}
            name="startTime"
            label={formatMessage({ id: 'StartTime' })}
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
            label={formatMessage({ id: 'Duration' })}
            defaultValue={60 * 60}
            rule="REQ"
            options={[
              { label: formatMessage({ id: 'FifteenMinutes' }), value: 15 * 60 },
              { label: formatMessage({ id: 'ThirtyMinutes' }), value: 30 * 60 },
              {
                label: formatMessage({ id: 'FortyFiveMinutes' }),
                value: 45 * 60
              },
              { label: formatMessage({ id: 'OneHour' }), value: 60 * 60 },
              { label: formatMessage({ id: 'OneAndHalfHour' }), value: 90 * 60 },
              {
                label: formatMessage({ id: 'TwoHours' }),
                value: 120 * 60
              },
              { label: formatMessage({ id: 'ThreeHours' }), value: 180 * 60 }
            ]}
          />,
          <Switch
            name="isInvitationAllowed"
            label={formatMessage({ id: 'IsInvitationAllowed' })}
            defaultValue={true}
            tips={formatMessage({ id: 'InvitationTips' })}
          />,
          <InputNumber name="maxCount" label={formatMessage({ id: 'MaxMemberCount' })} defaultValue={2} display={formData.isInvitationAllowed} />,
          <Upload
            name="options.document"
            label={formatMessage({ id: 'Document' })}
            maxLength={10}
            accept={['.pdf', '.jpg', '.png', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.html']}
          />,
          <Switch
            name="options.documentVisibleAll"
            label={formatMessage({ id: 'DocumentVisibleAll' })}
            tips={formatMessage({ id: 'DocumentVisibleAllTips' })}
            display={formData.options?.document && formData.options?.document.length > 0}
          />
        ]}
      />
      {!isEdit && (
        <>
          <TableList
            name="members"
            title={formatMessage({ id: 'Members' })}
            column={1}
            list={[
              <Input name="nickname" label={formatMessage({ id: 'Nickname' })} rule="LEN-0-100" />,
              <Input name="email" label={formatMessage({ id: 'Email' })} rule="EMAIL LEN-0-100" />,
              <Switch name="isMaster" label={formatMessage({ id: 'IsHost' })} />
            ]}
          />
          <Checkbox name="includingMe" label={formatMessage({ id: 'IncludingMe' })} labelHidden defaultValue={true}>
            {formatMessage({ id: 'IncludingMe' })}
          </Checkbox>
        </>
      )}
      {!isEdit && (
        <FormInfo
          title={formatMessage({ id: 'AdvancedSettings' })}
          column={1}
          list={[
            <RadioGroup
              name="options.setting.record"
              label={formatMessage({ id: 'IsRecordMeeting' })}
              defaultValue=""
              options={[
                { value: '', label: formatMessage({ id: 'NotEnabled' }) },
                { value: 'audio', label: formatMessage({ id: 'RecordAudio' }) },
                { value: 'video', label: formatMessage({ id: 'RecordVideo' }) }
              ]}
            />,
            <RadioGroup
              name="options.setting.speech"
              label={formatMessage({ id: 'IsSpeechRecognition' })}
              defaultValue={false}
              options={[
                { value: false, label: formatMessage({ id: 'Close' }) },
                { value: true, label: formatMessage({ id: 'Open' }) }
              ]}
            />
          ]}
        />
      )}
    </>
  );
}));

export default ConferenceFormInner;
