import ConferenceRoom from '@components/ConferenceRoom';
import plugins from './plugins';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { App, Flex, Spin, Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './style.module.scss';
import { createWithRemoteLoader } from '@kne/remote-loader';
import useRefCallback from '@kne/use-ref-callback';
import transform from 'lodash/transform';
import pick from 'lodash/pick';
import { InviteMember } from '@components/ConferenceInfo';
import ConferenceDocument from '@components/ConferenceDocument';
import get from 'lodash/get';
import createCollector from './createCollector';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const ViewBar = createWithRemoteLoader({
  modules: ['components-core:Image', 'components-core:Icon']
})(withLocale(({ remoteModules, current = {}, shareScreen, videoIsPlay, audioIsPlay }) => {
  const [Image, Icon] = remoteModules;
  const { formatMessage } = useIntl();
  return (
    <Flex className={style['view-item-bar']} justify="space-between" align="center" gap={8}>
      <Flex gap={8}>
        <Image.Avatar className={style['avatar']} id={current.avatar} />
        <div>
          {current.nickname || formatMessage({ id: 'Unnamed' })}
          {shareScreen ? formatMessage({ id: 'ScreenShareOf' }) : ''}
        </div>
      </Flex>
      {shareScreen ? (
        <div></div>
      ) : (
        <Flex gap={8}>
          <Icon type={videoIsPlay ? 'icon-shexiangtouyikaiqi' : 'icon-shexiangtouyiguanbi'} fontClassName="iconfont-ai" size={16} />
          <Icon type={audioIsPlay ? 'icon-maikefengyikaiqi' : 'icon-maikefengyiguanbi'} fontClassName="iconfont-ai" size={16} />
        </Flex>
      )}
    </Flex>
  );
}));

const ViewClose = createWithRemoteLoader({
  modules: ['components-core:Icon']
})(({ remoteModules, className }) => {
  const [Icon] = remoteModules;
  return <Icon className={className} type="icon-eyes-off" fontClassName="iconfont-ai" size={40} />;
});

const CurrentView = ({ sdk, current, videoIsPlay, audioIsPlay, onVideoElementChange }) => {
  const ref = useRef(null);
  const optionsRef = useRef({ sdk });
  useEffect(() => {
    onVideoElementChange?.(ref.current);
    return () => {
      onVideoElementChange?.(null);
    };
  }, [onVideoElementChange]);

  useEffect(() => {
    if (!videoIsPlay) {
      return;
    }
    const { sdk } = optionsRef.current;
    sdk.updateLocalVideo({ el: ref.current, mute: false });
  }, [videoIsPlay]);

  useEffect(() => {
    if (!audioIsPlay) {
      return;
    }
    const { sdk } = optionsRef.current;
    sdk.updateLocalAudio({ el: ref.current, mute: false });
  }, [audioIsPlay]);

  return (
    <div className={style['view-item']}>
      <div ref={ref} className={style['video-outer']} />
      {!videoIsPlay && <ViewClose className={style['view-close']} />}
      <ViewBar current={current} videoIsPlay={videoIsPlay} audioIsPlay={audioIsPlay} />
    </div>
  );
};

const CurrentShareScreenView = ({ sdk, current }) => {
  const ref = useRef(null);
  const optionsRef = useRef({ sdk });
  useEffect(() => {
    const { sdk } = optionsRef.current;
    sdk.updateScreenShare({ el: ref.current });
  }, []);

  return (
    <div className={style['view-item']}>
      <div ref={ref} className={style['video-outer']} />
      <ViewBar current={current} shareScreen />
    </div>
  );
};

const RemoteView = ({ sdk, userId, streamType, current, videoIsPlay, audioIsPlay, shareScreen }) => {
  const ref = useRef(null);
  useEffect(() => {
    videoIsPlay && sdk.updateRemote({ userId, streamType, el: ref.current });
  }, [sdk, userId, streamType, videoIsPlay]);

  return (
    <div className={style['view-item']}>
      <div ref={ref} className={style['video-outer']} />
      {!videoIsPlay && <ViewClose className={style['view-close']} />}
      <ViewBar current={current} shareScreen={shareScreen} videoIsPlay={videoIsPlay} audioIsPlay={audioIsPlay} />
    </div>
  );
};

const sortLocal = (a, b) => {
  if (a.type === 'local') {
    return -1;
  }
  if (b.type === 'local') {
    return 1;
  }
  return 0;
};

const Conference = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset', 'components-core:Modal@useModal', 'components-core:Modal@useConfirmModal']
})(withLocale(({ remoteModules, sdkParams, conference, current = {}, apis, baseUrl, ...props }) => {
  const [usePreset, useModal, useConfirmModal] = remoteModules;
  const { ajax } = usePreset();
  const navigate = useNavigate();
  const modal = useModal();
  const confirmModal = useConfirmModal();
  const [conferenceState, setConferenceState] = useState(conference);
  const [now, setNow] = useState(() => dayjs());
  const [extending, setExtending] = useState(false);
  const [currentSdk, setCurrentSdk] = useState(null);
  const [signalLevel, setSignalLevel] = useState(-1);
  const [setting, setSetting] = useState({
    layoutType: get(conference, 'options.setting.layoutType') || 1,
    mainIndex: 0,
    mainWindowKey: null,
    microphoneOpen: true,
    cameraOpen: true,
    documentInside: true,
    shareScreenOpen: false
  });
  const memberMap = useMemo(() => {
    return new Map((conference.members || []).map(item => [item.id, item]));
  }, [conference.members]);
  const speechInputRef = useRef(null);
  const collectorsRef = useRef(null);
  const endConferenceCallbackRef = useRef(null);
  const localVideoElementRef = useRef(null);
  const settingRef = useRef(setting);
  const { message } = App.useApp();
  const [list, setList] = useState([]);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const { formatMessage } = useIntl();
  useEffect(() => {
    setConferenceState(conference);
  }, [conference]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const remainingSeconds = useMemo(() => {
    if (!conferenceState?.startTime || !conferenceState?.duration) {
      return Number.POSITIVE_INFINITY;
    }
    return dayjs(conferenceState.startTime).add(conferenceState.duration, 'second').diff(now, 'second');
  }, [conferenceState, now]);
  const showExtendAction =
    current.isMaster &&
    conferenceState?.options?.allowExtend &&
    remainingSeconds > 0 &&
    remainingSeconds <= 15 * 60;

  const onExtendDuration = useCallback(async () => {
    if (!apis.extendDuration) {
      return;
    }
    setExtending(true);
    try {
      const { data: resData } = await ajax(
        Object.assign({}, apis.extendDuration, {
          data: { extendSeconds: 900 }
        })
      );
      if (resData.code !== 0) {
        message.error(resData.msg || formatMessage({ id: 'InterviewExtendFailed' }));
        return;
      }
      setConferenceState(resData.data || conferenceState);
      message.success(formatMessage({ id: 'InterviewExtendSuccess' }));
    } finally {
      setExtending(false);
    }
  }, [ajax, apis.extendDuration, conferenceState, formatMessage, message]);
  const buildClientDeviceInfo = useCallback(({ cameras = [], microphones = [], setting = {} } = {}) => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
      devicePixelRatio: window.devicePixelRatio,
      connection: connection
        ? {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          }
        : undefined,
      audioDevices: microphones.map(item => ({ deviceId: item.deviceId, label: item.label, groupId: item.groupId })),
      videoDevices: cameras.map(item => ({ deviceId: item.deviceId, label: item.label, groupId: item.groupId })),
      audioDeviceId: setting.microphoneId,
      videoDeviceId: setting.cameraId
    };
  }, []);
  useEffect(() => {
    settingRef.current = setting;
  }, [setting]);
  const onLocalVideoElementChange = useCallback(element => {
    localVideoElementRef.current = element;
  }, []);

  const updateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { cameras: [], microphones: [], setting: {} };
    }
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    const cameras = mediaDevices.filter(device => device.kind === 'videoinput');
    const microphones = mediaDevices.filter(device => device.kind === 'audioinput');
    const currentSetting = settingRef.current || {};
    const nextDeviceSetting = {
      cameraId: currentSetting.cameraId || cameras[0]?.deviceId,
      microphoneId: currentSetting.microphoneId || microphones[0]?.deviceId
    };
    setDevices({ cameras, microphones });
    setSetting(setting => {
      return Object.assign({}, setting, nextDeviceSetting);
    });
    return { cameras, microphones, setting: nextDeviceSetting };
  }, []);

  const onEnterRoom = useRefCallback(({ userId, type, ...props }) => {
    setList(list => {
      const newList = list.slice(0);
      const index = newList.findIndex(item => item.userId === userId && item.type === type);
      if (index > -1) {
        newList.splice(index, 1);
      }
      newList.push({ userId, type, ...props });
      return newList.sort(sortLocal);
    });
  });

  const onExitRoom = useRefCallback(({ userId, type }) => {
    setList(list => {
      const newList = list.slice(0);
      const index = newList.findIndex(item => item.userId === userId && item.type === type);
      if (index > -1) {
        newList.splice(index, 1);
      }
      return newList.sort(sortLocal);
    });
  });

  const onUpdate = useRefCallback(({ userId, type, streamType, videoIsPlay, ...props }) => {
    setList(list => {
      const newList = list.slice(0);
      const index = newList.findIndex(item => item.userId === userId && item.type === type);
      if (index > -1) {
        const currentItem = newList[index];
        newList.splice(
          index,
          1,
          Object.assign({}, currentItem, props, {
            videoView: Object.assign({}, currentItem.videoView, { [streamType]: videoIsPlay })
          })
        );
      }
      return newList.sort(sortLocal);
    });
  });

  const onSpeechStart = async () => {
    const { data: resData } = await ajax(Object.assign({}, apis.startAITranscription));
    if (resData.code !== 0) {
      return;
    }
    message.success(formatMessage({ id: 'StartSpeechRecognition' }));
  };

  const initSdk = useRefCallback(async () => {
    const collector = createCollector(data => {
      return ajax(
        Object.assign({}, apis.recordAITranscription, {
          data: { records: data }
        })
      );
    });
    const clientEventCollector = createCollector(
      data => {
        if (!apis.recordClientEvents) {
          return Promise.resolve();
        }
        return ajax(
          Object.assign({}, apis.recordClientEvents, {
            data: { events: data }
          })
        );
      },
      { maxLength: 1 }
    );
    collectorsRef.current = { collector, clientEventCollector };
    return plugins('trtc').then(sdk => {
      const currentSdk = sdk({
        sdkParams: {
          ...sdkParams,
          roomId: conference.id
        },
        conference,
        current,
        events: {
          onEnterRoom,
          onExitRoom,
          onUpdate,
          onQualityChange: level => {
            setSignalLevel(level);
          },
          onClientEvent: event => {
            clientEventCollector(event);
          },
          onKickedOut: ({ reason }) => {
            switch (reason) {
              case 'kick':
                message.error(formatMessage({ id: 'KickedOutByOtherDevice' }));
                break;
              case 'banned':
                message.error(formatMessage({ id: 'BannedByHost' }));
                break;
              case 'room_disband':
                message.warning(formatMessage({ id: 'RoomDisbanded' }));
                break;
              default:
                message.error(formatMessage({ id: 'UnknownOfflineReason' }));
            }
            navigate(baseUrl + '/detail');
          },
          onShareScreenStop: () => {
            setSetting(setting => {
              return Object.assign({}, setting, { shareScreenOpen: false });
            });
          },
          onSpeech: (message, ...args) => {
            const member = memberMap.get(message.sender);
            const target = {
              sender: message.sender,
              member: pick(member, ['id', 'nickname', 'avatar', 'email', 'isMaster']),
              message: message.message,
              time: new Date()
            };
            collector(target);
            speechInputRef.current && speechInputRef.current(target, ...args);
          },
          onDisconnected: () => {
            confirmModal({
              type: 'confirm',
              confirmType: 'warning',
              title: formatMessage({ id: 'NetworkDisconnected' }),
              message: formatMessage({ id: 'CheckNetworkConnection' }),
              onOk: () => {
                window.location.reload();
              }
            });
          }
        }
      });
      setCurrentSdk(currentSdk);
      return currentSdk;
    });
  });

  useEffect(() => {
    const promise = initSdk().then(async currentSdk => {
      await currentSdk.enterRoom();
      const deviceInfo = await updateDevices();
      currentSdk.recordClientEvent('device-info', buildClientDeviceInfo(deviceInfo));
      return currentSdk;
    });
    return () => {
      promise.then(async currentSdk => {
        await collectorsRef.current?.collector?.flush?.();
        await collectorsRef.current?.clientEventCollector?.flush?.();
        collectorsRef.current?.collector?.destroy?.();
        collectorsRef.current?.clientEventCollector?.destroy?.();
        collectorsRef.current = null;
        return currentSdk.exitRoom();
      });
    };
  }, [buildClientDeviceInfo, conference.id, initSdk, updateDevices]);

  useEffect(() => {
    const flushCollectors = () => {
      collectorsRef.current?.collector?.flush?.();
      collectorsRef.current?.clientEventCollector?.flush?.();
    };
    window.addEventListener('beforeunload', flushCollectors);
    return () => {
      window.removeEventListener('beforeunload', flushCollectors);
    };
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) {
      return;
    }
    navigator.mediaDevices.addEventListener('devicechange', updateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
    };
  }, [updateDevices]);

  const targetList = useMemo(() => {
    if (!currentSdk) {
      return [];
    }

    const pushWindow = (result, key, view, extra = {}) => {
      result.push(Object.assign({ key, view }, extra));
    };

    return transform(
      list,
      (result, item) => {
        const { userId, type, videoView, audioIsPlay } = item;
        const currentUser = currentSdk.conference.members.find(item => item.id === userId);
        const mainKey = `${userId}:${currentSdk.STREAM_TYPE_MAIN}`;

        if (type === 'local') {
          pushWindow(
            result,
            mainKey,
            <CurrentView
              key={mainKey}
              sdk={currentSdk}
              roomId={currentSdk.roomId}
              current={currentUser}
              audioIsPlay={setting.microphoneOpen}
              videoIsPlay={setting.cameraOpen && videoView && videoView[currentSdk.STREAM_TYPE_MAIN]}
              onVideoElementChange={onLocalVideoElementChange}
            />
          );
        } else {
          pushWindow(
            result,
            mainKey,
            <RemoteView
              key={mainKey}
              sdk={currentSdk}
              userId={userId}
              current={currentUser}
              streamType={currentSdk.STREAM_TYPE_MAIN}
              audioIsPlay={audioIsPlay}
              videoIsPlay={videoView && videoView[currentSdk.STREAM_TYPE_MAIN]}
            />
          );
        }

        videoView &&
          Object.keys(videoView).forEach(streamType => {
            if (streamType !== currentSdk.STREAM_TYPE_MAIN && videoView[streamType]) {
              const shareKey = `${userId}:${streamType}`;
              pushWindow(
                result,
                shareKey,
                type === 'local' ? (
                  <CurrentShareScreenView key={shareKey} sdk={currentSdk} current={currentUser} />
                ) : (
                  <RemoteView
                    key={shareKey}
                    sdk={currentSdk}
                    userId={userId}
                    streamType={streamType}
                    current={currentUser}
                    videoIsPlay={videoView && videoView[streamType]}
                    shareScreen
                  />
                ),
                { isShare: true }
              );
            }
          });
      },
      []
    );
  }, [list, currentSdk, setting.cameraOpen, setting.microphoneOpen, onLocalVideoElementChange]);

  useEffect(() => {
    if (!currentSdk) {
      return;
    }
    const activeShare = targetList.find(item => item.isShare);
    setSetting(currentSetting => {
      if (activeShare) {
        if (currentSetting.mainWindowKey === activeShare.key) {
          return currentSetting;
        }
        return Object.assign({}, currentSetting, { mainWindowKey: activeShare.key });
      }
      if (currentSetting.mainWindowKey && currentSetting.mainWindowKey !== '__document__' && targetList.every(item => item.key !== currentSetting.mainWindowKey)) {
        const fallbackKey = `${currentSdk.sdkParams.userId}:${currentSdk.STREAM_TYPE_MAIN}`;
        return Object.assign({}, currentSetting, { mainWindowKey: fallbackKey });
      }
      return currentSetting;
    });
  }, [currentSdk, targetList]);

  if (!currentSdk) {
    return (
      <Flex justify="center" align="center">
        <Spin />
      </Flex>
    );
  }

  return (
    <>
      <ConferenceRoom
        {...props}
        conference={conferenceState}
        isMaster={current.isMaster}
        isInvitationAllowed={conference.isInvitationAllowed && current.isMaster}
        signalLevel={signalLevel}
        devices={devices}
        value={setting}
        onChange={setSetting}
        headerExtra={
          showExtendAction ? (
            <Tooltip title={formatMessage({ id: 'InterviewExtendReminder' })}>
              <Button size="small" type="primary" loading={extending} onClick={onExtendDuration}>
                {formatMessage({ id: 'InterviewExtendAction' })}
              </Button>
            </Tooltip>
          ) : null
        }
        document={
          conference.options?.documentType &&
          (conference.options?.documentVisibleAll || current.isMaster) && (
            <ConferenceDocument
              type={conference.options.documentType}
              moduleProps={conference.options.moduleProps}
              getSpeechInput={onSpeechInput => {
                speechInputRef.current = onSpeechInput;
              }}
              getEndConferenceCallback={callback => {
                endConferenceCallbackRef.current = callback;
              }}
              onSpeechStart={onSpeechStart}
              onSpeechEnd={async () => {
                const { data: resData } = await ajax(Object.assign({}, apis.stopAITranscription));
                if (resData.code !== 0) {
                  return;
                }
                message.success(formatMessage({ id: 'StopSpeechRecognition' }));
              }}
              files={conference.options.document}
              url={conference.options.documentUrl}
              module={conference.options.module}
            />
          )
        }
        actions={{
          setMicrophoneOpen: async open => {
            await currentSdk.setLocalAudioOpen({ open, microphoneId: setting.microphoneId });
            setSetting(setting => {
              return Object.assign({}, setting, { microphoneOpen: open });
            });
          },
          setCameraOpen: async open => {
            await currentSdk.setLocalVideoOpen({ open, el: localVideoElementRef.current, cameraId: setting.cameraId });
            setSetting(setting => {
              return Object.assign({}, setting, { cameraOpen: open });
            });
          },
          setMicrophoneId: async microphoneId => {
            if (setting.microphoneOpen) {
              await currentSdk.switchLocalAudioDevice({ microphoneId });
            }
            setSetting(setting => {
              return Object.assign({}, setting, { microphoneId });
            });
          },
          setCameraId: async cameraId => {
            if (setting.cameraOpen) {
              await currentSdk.switchLocalVideoDevice({ cameraId });
            }
            setSetting(setting => {
              return Object.assign({}, setting, { cameraId });
            });
          },
          shareScreen: async () => {
            if (setting.shareScreenOpen) {
              await currentSdk.stopShareScreen();
              setSetting(setting => {
                return Object.assign({}, setting, { shareScreenOpen: false });
              });
            } else {
              await currentSdk.shareScreen();
              setSetting(setting => {
                return Object.assign({}, setting, { shareScreenOpen: true });
              });
            }
          },
          invite: async () => {
            const { data: resData } = await ajax(Object.assign({}, apis.inviteMember));
            if (resData.code !== 0) {
              return;
            }
            modal(InviteMember.renderModal(Object.assign({}, resData.data, { message, formatMessage })));
          },
          leave: () => {
            navigate(baseUrl + '/detail');
          },
          end: async () => {
            const { data: resData } = await ajax(
              Object.assign({}, apis.endConference, {
                data: { id: conferenceState.id }
              })
            );
            if (resData.code !== 0) {
              return;
            }
            endConferenceCallbackRef.current && (await endConferenceCallbackRef.current());
            navigate(baseUrl + '/detail');
          }
        }}
        list={targetList}
      />
    </>
  );
}));

export default Conference;
