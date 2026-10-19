import dayjs from 'dayjs';
import { useMemo } from 'react';
import { TimeWindow } from '@kne/react-calendar';
import '@kne/react-calendar/dist/index.css';
import { useIntl } from '@kne/react-intl';
import style from './style.module.scss';

const STEP_MINUTES = 15;
const DEFAULT_MINUTES = 60;
const MAX_MINUTES = 180;

const ceilToStep = (date, step) => {
  const current = dayjs(date).second(0).millisecond(0);
  const remainder = current.minute() % step;
  if (remainder === 0) {
    return current;
  }
  return current.add(step - remainder, 'minute');
};

const ConferenceTimeField = ({ hooks }) => {
  const { formatMessage, locale } = useIntl();
  const defaultStart = useMemo(() => ceilToStep(dayjs(), STEP_MINUTES).toDate(), []);
  const rangeStart = useMemo(() => dayjs().startOf('minute').toDate(), []);
  const startField = hooks.useField({
    name: 'startTime',
    label: formatMessage({ id: 'StartTime' }),
    rule: 'REQ',
    defaultValue: defaultStart
  });
  const durationField = hooks.useField({
    name: 'duration',
    label: formatMessage({ id: 'Duration' }),
    rule: 'REQ',
    defaultValue: DEFAULT_MINUTES * 60
  });
  const start = dayjs(startField.value || defaultStart);
  const minutes = Math.max(STEP_MINUTES, Math.round((Number(durationField.value) || DEFAULT_MINUTES * 60) / 60));

  return (
    <div className="react-form__field" ref={startField.fieldRef}>
      <div className="react-form__field-main">
        <div className="react-form__field-label is-req">{formatMessage({ id: 'StartTime' })}</div>
        <div className="react-form__field-input">
          <TimeWindow
            className={style['time-window']}
            locale={locale === 'en-US' ? 'en-US' : 'zh-CN'}
            value={[start.toDate(), start.add(minutes, 'minute').toDate()]}
            range={[rangeStart, null]}
            step={STEP_MINUTES}
            minDuration={STEP_MINUTES}
            maxDuration={MAX_MINUTES}
            debounceWait={0}
            onChange={([nextStart, nextEnd]) => {
              const nextMinutes = Math.max(STEP_MINUTES, Math.round(dayjs(nextEnd).diff(dayjs(nextStart), 'minute', true)));
              startField.onChange(dayjs(nextStart).second(0).millisecond(0).toDate());
              durationField.onChange(nextMinutes * 60);
            }}
          />
          {startField.errMsg ? <div className="react-form__field-error">{startField.errMsg}</div> : null}
        </div>
      </div>
    </div>
  );
};

export default ConferenceTimeField;
