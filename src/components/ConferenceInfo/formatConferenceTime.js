import dayjs from 'dayjs';

const formatConferenceTime = ({ startTime, duration }) => {
  if (!startTime) {
    return '无时间限制';
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
    return `${startTimeStr}开始`;
  }
  const endTimeStr = dayjs(startTime).add(duration, 'minute').format('HH:mm');

  return `${startTimeStr} - ${endTimeStr}`;
};

export default formatConferenceTime;
