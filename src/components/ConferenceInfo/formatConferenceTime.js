import dayjs from 'dayjs';

const formatConferenceTime = ({ startTime, duration, formatMessage }) => {
  if (!startTime) {
    return formatMessage({ id: 'NoTimeLimit' });
  }

  const startTimeStr = dayjs(startTime).format(
    (() => {
      if (dayjs(startTime).isSame(dayjs(), 'day')) {
        return 'HH:mm';
      }
      if (dayjs(startTime).isSame(dayjs(), 'year')) {
        return 'MM-DD HH:mm';
      }
      return 'YYYY-MM-DD HH:mm';
    })()
  );
  if (!duration) {
    return `${startTimeStr}${formatMessage({ id: 'Start' })}`;
  }
  const endTimeStr = dayjs(startTime).add(duration, 'second').format('HH:mm');

  return `${startTimeStr} - ${endTimeStr}`;
};

export default formatConferenceTime;
