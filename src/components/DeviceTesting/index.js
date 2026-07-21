import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Flex, Progress, Select, Spin } from 'antd';
import { AudioOutlined, CameraOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '@kne/responsive-utils';
import classnames from 'classnames';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';
import style from './style.module.scss';

const cleanStream = stream => {
  stream?.getTracks?.().forEach(track => track.stop());
};

const getDeviceErrorMessage = ({ error, formatMessage }) => {
  if (!error) {
    return formatMessage({ id: 'DeviceTestFailed' });
  }
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return formatMessage({ id: 'PermissionDenied' });
  }
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return formatMessage({ id: 'NoDeviceFound' });
  }
  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return formatMessage({ id: 'DeviceInUse' });
  }
  return error.message || formatMessage({ id: 'DeviceTestFailed' });
};

const DeviceTesting = withLocale(({ defaultAudioDeviceId, defaultVideoDeviceId, onComplete }) => {
  const isMobile = useIsMobile();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [audioDeviceId, setAudioDeviceId] = useState(defaultAudioDeviceId);
  const [videoDeviceId, setVideoDeviceId] = useState(defaultVideoDeviceId);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [stream, setStream] = useState(null);
  const [volume, setVolume] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { formatMessage } = useIntl();

  const audioOptions = useMemo(
    () =>
      audioDevices.map(device => ({
        value: device.deviceId,
        label: device.label || formatMessage({ id: 'DefaultMicrophone' })
      })),
    [audioDevices, formatMessage]
  );

  const videoOptions = useMemo(
    () =>
      videoDevices.map(device => ({
        value: device.deviceId,
        label: device.label || formatMessage({ id: 'DefaultCamera' })
      })),
    [videoDevices, formatMessage]
  );

  const stopVolumeDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setVolume(0);
  }, []);

  const startVolumeDetection = useCallback(
    mediaStream => {
      stopVolumeDetection();
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (!audioTrack) {
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return;
      }
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(new MediaStream([audioTrack])).connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setVolume(Math.min(Math.round((average / 128) * 100), 100));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    },
    [stopVolumeDetection]
  );

  const refreshDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const nextAudioDevices = devices.filter(device => device.kind === 'audioinput');
    const nextVideoDevices = devices.filter(device => device.kind === 'videoinput');
    setAudioDevices(nextAudioDevices);
    setVideoDevices(nextVideoDevices);
    setAudioDeviceId(value => value || nextAudioDevices[0]?.deviceId);
    setVideoDeviceId(value => value || nextVideoDevices[0]?.deviceId);
    return { audioDevices: nextAudioDevices, videoDevices: nextVideoDevices };
  }, []);

  const startTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    stopVolumeDetection();
    cleanStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices?.enumerateDevices) {
        throw new Error(formatMessage({ id: 'BrowserNotSupported' }));
      }
      await refreshDevices();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      startVolumeDetection(mediaStream);
      await refreshDevices();
    } catch (err) {
      setError(getDeviceErrorMessage({ error: err, formatMessage }));
    } finally {
      setLoading(false);
    }
  }, [audioDeviceId, refreshDevices, startVolumeDetection, stopVolumeDetection, videoDeviceId, formatMessage]);

  useEffect(() => {
    startTest();
  }, [startTest]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) {
      return;
    }
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  useEffect(() => {
    return () => {
      stopVolumeDetection();
      cleanStream(streamRef.current);
    };
  }, [stopVolumeDetection]);

  const handleComplete = () => {
    onComplete?.({
      audioDeviceId,
      videoDeviceId,
      devices: {
        microphones: audioDevices,
        cameras: videoDevices
      }
    });
  };

  const mobileButtonProps = isMobile ? { size: 'large', shape: 'round' } : {};
  const actionButtons = (
    <>
      <Button {...mobileButtonProps} icon={<ReloadOutlined />} onClick={startTest} loading={loading}>
        {formatMessage({ id: 'Retest' })}
      </Button>
      <Button {...mobileButtonProps} type="primary" onClick={handleComplete} disabled={!stream}>
        {formatMessage({ id: 'TestComplete' })}
      </Button>
    </>
  );

  return (
    <div className={classnames(style['device-testing'], { [style['is-mobile']]: isMobile, [style['has-footer']]: isMobile })}>
      <Flex gap={16} vertical className={style['content']}>
        <div className={style['preview']}>
          {stream ? <video ref={videoRef} autoPlay playsInline muted /> : <div className={style['preview-placeholder']}>{loading ? <Spin /> : formatMessage({ id: 'WaitingCameraPreview' })}</div>}
        </div>
        {error && <Alert type="error" showIcon message={error} />}
        <Flex gap={12} vertical={isMobile} className={style['device-row']}>
          <Flex vertical gap={6} flex={1} className={style['device-field']}>
            <div className={style['device-label']}>
              <AudioOutlined />
              {formatMessage({ id: 'Microphone' })}
            </div>
            <Select
              value={audioDeviceId}
              options={audioOptions}
              onChange={setAudioDeviceId}
              placeholder={formatMessage({ id: 'SelectMicrophone' })}
              style={{ width: '100%' }}
            />
          </Flex>
          <Flex vertical gap={6} flex={1} className={style['device-field']}>
            <div className={style['device-label']}>
              <CameraOutlined />
              {formatMessage({ id: 'Camera' })}
            </div>
            <Select
              value={videoDeviceId}
              options={videoOptions}
              onChange={setVideoDeviceId}
              placeholder={formatMessage({ id: 'SelectCamera' })}
              style={{ width: '100%' }}
            />
          </Flex>
        </Flex>
        <div className={style['volume-row']}>
          <div className={style['device-label']}>{formatMessage({ id: 'MicrophoneVolume' })}</div>
          <Progress percent={volume} showInfo={false} />
        </div>
        {!isMobile && (
          <Flex justify="flex-end" gap={12}>
            {actionButtons}
          </Flex>
        )}
      </Flex>
      {isMobile && (
        <div className={style['footer-actions']}>
          <Flex gap={12}>{actionButtons}</Flex>
        </div>
      )}
    </div>
  );
});

export default DeviceTesting;
