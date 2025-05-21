import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import CountDown from '@kne/count-down';

const ConferenceCountDown = ({ startTime, duration, onComplete }) => {
  const [current, setCurrent] = useState(dayjs());
  const ref = useRef({ startTime, duration, onComplete });
  ref.current = { startTime, duration, onComplete };
  useEffect(() => {
    const { startTime, duration, onComplete } = ref.current;
    const timer = setInterval(() => {
      const now = dayjs();
      setCurrent(now);
      if (now.isAfter(startTime)) {
        clearInterval(timer);
        onComplete && onComplete();
      }
      if (now.isAfter(dayjs(startTime).add(duration, 'minute'))) {
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
    return '会议已开始，点击进入会议按钮直接进入';
  }
  if (dayjs(startTime).diff(current, 'second') <= 3600) {
    return (
      <>
        <CountDown duration={dayjs(startTime).diff(current, 'second')} />
        s后
      </>
    );
  }

  if (dayjs(startTime).isSame(current, 'day')) {
    return `${dayjs(startTime).diff(current, 'hour')}小时后`;
  }
  return `${dayjs(startTime).diff(current, 'day')}天后`;
};

export default ConferenceCountDown;
