import { AudioMutedOutlined, AudioOutlined, PhoneFilled, PhoneOutlined, SwapOutlined, VideoCameraOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from '@kne/react-intl';
import { acceptCall, bindCallViews, flipCallCamera, hangupCall, rejectCall, toggleCallCamera, toggleCallMute, toggleCallSpeaker, useCall } from './callSession';
import { formatCallDuration } from './callRecord';
import style from './style.module.scss';

const Control = ({ label, danger, accept, onClick, children }) => (
  <button type="button" className={style['call-control']} onClick={onClick}>
    <span className={classnames(style['call-control-btn'], danger && style['is-danger'], accept && style['is-accept'])}>{children}</span>
    <span className={style['call-control-label']}>{label}</span>
  </button>
);

const CallOverlay = ({ placement = 'panel' }) => {
  const call = useCall();
  const { formatMessage } = useIntl();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (call.phase !== 'connected') {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [call.phase]);

  useEffect(() => {
    bindCallViews({ local: localRef.current, remote: remoteRef.current });
  }, [call.phase, call.media, call.cameraOff, call.roomReady, call.remoteUserId, call.remoteVideo]);

  if (call.phase === 'idle') {
    return null;
  }

  const video = call.media === 'video';
  const connected = call.phase === 'connected';
  const incoming = call.phase === 'incoming';
  const showLocal = video && !incoming && !call.cameraOff;
  const showRemote = video && call.remoteVideo;
  const status = connected
    ? formatCallDuration(Math.max(0, Math.round((now - call.startedAt) / 1000)))
    : incoming
      ? formatMessage({ id: video ? 'CallInviteVideo' : 'CallInviteVoice' })
      : formatMessage({ id: 'CallWaiting' });
  const title = call.peerName || formatMessage({ id: video ? 'VideoCall' : 'VoiceCall' });

  if (placement === 'notice') {
    if (!incoming || typeof document === 'undefined') {
      return null;
    }
    return createPortal(
      <div className={style['notice-anchor']}>
        <div className={classnames(style['notice-card'], style['is-call'])}>
          <span className={style['notice-name']}>{title}</span>
          <span className={style['notice-text']}>{status}</span>
          <span className={style['notice-actions']}>
            <button type="button" className={style['notice-reject']} onClick={rejectCall}>
              {formatMessage({ id: 'CallReject' })}
            </button>
            <button type="button" className={style['notice-accept']} onClick={acceptCall}>
              {formatMessage({ id: 'CallAccept' })}
            </button>
          </span>
        </div>
      </div>,
      document.body
    );
  }

  if (incoming) {
    return null;
  }

  return (
    <div className={style['call-overlay']}>
      <div ref={remoteRef} className={classnames(style['call-video'], style['is-full'], !showRemote && style['is-hidden'])} />
      <div ref={localRef} className={classnames(style['call-video'], showRemote ? style['is-pip'] : style['is-full'], !showLocal && style['is-hidden'])} />
      {showLocal && showRemote ? (
        <button type="button" className={style['call-flip']} onClick={flipCallCamera} aria-label={formatMessage({ id: 'CallSwitchCamera' })}>
          <SwapOutlined />
        </button>
      ) : null}
      {!showRemote ? (
        <div className={style['call-person']}>
          <div className={style['call-avatar']}>{call.peerAvatar ? <img src={call.peerAvatar} alt="" /> : (title || '?').slice(0, 1)}</div>
          <div className={style['call-name']}>{title}</div>
          <div className={style['call-status']}>{status}</div>
        </div>
      ) : (
        <div className={style['call-status-top']}>{status}</div>
      )}
      <div className={style['call-controls']}>
        {incoming ? (
          <>
            <Control danger label={formatMessage({ id: 'CallReject' })} onClick={rejectCall}>
              <PhoneFilled className={style['phone-hangup']} />
            </Control>
            <Control accept label={formatMessage({ id: 'CallAccept' })} onClick={acceptCall}>
              {video ? <VideoCameraOutlined /> : <PhoneOutlined className={style['phone-call']} />}
            </Control>
          </>
        ) : (
          <>
            {connected ? (
              <Control label={formatMessage({ id: 'CallMute' })} onClick={toggleCallMute}>
                {call.muted ? <AudioMutedOutlined /> : <AudioOutlined />}
              </Control>
            ) : null}
            <Control danger label={formatMessage({ id: call.phase === 'outgoing' ? 'CallCancel' : 'CallHangup' })} onClick={hangupCall}>
              <PhoneFilled className={style['phone-hangup']} />
            </Control>
            {connected && !video ? (
              <Control label={formatMessage({ id: 'CallSpeaker' })} onClick={toggleCallSpeaker}>
                {call.speakerOff ? <AudioMutedOutlined /> : <AudioOutlined />}
              </Control>
            ) : null}
            {connected && video ? (
              <Control label={formatMessage({ id: 'CallCamera' })} onClick={toggleCallCamera}>
                <VideoCameraOutlined />
              </Control>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
