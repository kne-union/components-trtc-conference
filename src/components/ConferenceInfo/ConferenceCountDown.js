import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import CountDown from '@kne/count-down';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const ConferenceCountDown = withLocale(({ startTime, duration, onComplete }) => {
  const [current, setCurrent] = useState(dayjs());
  const ref = useRef({ startTime, duration, onComplete });
  ref.current = { startTime, duration, onComplete };
  const { formatMessage } = useIntl();
  useEffect(() => {
    const { startTime, duration, onComplete } = ref.current;
    const timer = setInterval(() => {
      const now = dayjs();
      setCurrent(now);
      if (now.isAfter(startTime)) {
        clearInterval(timer);
        onComplete && onComplete();
      }
      if (now.isAfter(dayjs(startTime).add(duration, 'second'))) {
        clearInterval(timer);
        onComplete && onComplete();
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!startTime) {
    return null;
  }

  if (current.isAfter(startTime)) {
    return formatMessage({ id: 'MeetingStarted' });
  }
  if (dayjs(startTime).diff(current, 'second') <= 3600) {
    return (
      <>
        <CountDown duration={dayjs(startTime).diff(current, 'second')} />
        {formatMessage({ id: 'SecondsAfter' })}
      </>
    );
  }

  if (dayjs(startTime).diff(current, 'minute') < 60) {
    return `${dayjs(startTime).diff(current, 'minute')}${formatMessage({ id: 'MinutesAfter' })}`;
  }

  if (dayjs(startTime).diff(current, 'hour') < 24) {
    return `${dayjs(startTime).diff(current, 'hour')}${formatMessage({ id: 'HoursAfter' })}`;
  }
  return `${dayjs(startTime).diff(current, 'day')}${formatMessage({ id: 'DaysAfter' })}`;
});

export default ConferenceCountDown;
