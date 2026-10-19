export const callValueOf = message => {
  const value = message?.content?.value;
  if (message?.type === 'custom' && value && (value.kind === 'call' || value.kind === 'callSignal')) {
    return value;
  }
  return null;
};

export const isCallSignal = message => callValueOf(message)?.kind === 'callSignal';

export const formatCallDuration = seconds => {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remain = total % 60;
  const clock = `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
};

export const callRecordText = (value, mine, formatMessage) => {
  if (!value) {
    return '';
  }
  if (value.status === 'duration') {
    return formatMessage({ id: 'CallDuration' }, { time: formatCallDuration(value.duration) });
  }
  if (value.status === 'cancel') {
    return formatMessage({ id: mine ? 'CallCancelMine' : 'CallCancelOther' });
  }
  if (value.status === 'reject') {
    return formatMessage({ id: mine ? 'CallRejectMine' : 'CallRejectOther' });
  }
  if (value.status === 'missed') {
    return formatMessage({ id: mine ? 'CallMissedMine' : 'CallMissedOther' });
  }
  return formatMessage({ id: value.media === 'video' ? 'VideoCall' : 'VoiceCall' });
};
