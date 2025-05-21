import ConferenceRoom from '@components/ConferenceRoom';
import plugins from './plugins';
import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Flex, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import style from './style.module.scss';
import { createWithRemoteLoader } from '@kne/remote-loader';
import useRefCallback from '@kne/use-ref-callback';
import transform from 'lodash/transform';
import { InviteMember } from '@components/ConferenceInfo';
import ConferenceDocument from '@components/ConferenceDocument';

const ViewBar = createWithRemoteLoader({
  modules: ['components-core:Image', 'components-code:Icon']
})(({ remoteModules, current = {}, shareScreen, videoIsPlay, audioIsPlay }) => {
  const [Image, Icon] = remoteModules;
  return (
    <Flex className={style['view-item-bar']} justify="space-between" align="center" gap={8}>
      <Flex gap={8}>
        <Image.Avatar className={style['avatar']} id={current.avatar} />
        <div>
          {current.nickname || '未命名'}
          {shareScreen ? '的屏幕分享' : ''}
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
});

const ViewClose = createWithRemoteLoader({
  modules: ['components-code:Icon']
})(({ remoteModules, className }) => {
  const [Icon] = remoteModules;
  return <Icon className={className} type="icon-eyes-off" fontClassName="iconfont-ai" size={40} />;
});

const CurrentView = ({ sdk, current, videoIsPlay, audioIsPlay }) => {
  const ref = useRef(null);
  const optionsRef = useRef({ sdk });
  useEffect(() => {
    const { sdk } = optionsRef.current;
    sdk.updateLocalVideo({ el: ref.current, mute: !videoIsPlay });
  }, [videoIsPlay]);

  useEffect(() => {
    const { sdk } = optionsRef.current;
    sdk.updateLocalAudio({ el: ref.current, mute: !audioIsPlay });
  }, [audioIsPlay]);

  return (
    <div className={style['view-item']}>
      <div ref={ref} />
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
      <div ref={ref} />
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
      <div ref={ref} />
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
  modules: ['components-core:Global@usePreset', 'components-core:Modal@useModal']
})(({ remoteModules, sdkParams, conference, current = {}, apis, baseUrl, ...props }) => {
  const [usePreset, useModal] = remoteModules;
  const { ajax } = usePreset();
  const navigate = useNavigate();
  const modal = useModal();
  const [currentSdk, setCurrentSdk] = useState(null);
  const [signalLevel, setSignalLevel] = useState(-1);
  const [setting, setSetting] = useState({
    layoutType: 1,
    mainIndex: 0,
    microphoneOpen: true,
    cameraOpen: true,
    documentInside: true,
    shareScreenOpen: false
  });
  const { message } = App.useApp();
  const [list, setList] = useState([]);

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

  const initSdk = useRefCallback(async () => {
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
      return currentSdk;
    });
    return () => {
      promise.then(currentSdk => {
        return currentSdk.exitRoom();
      });
    };
  }, [conference.id, initSdk]);

  const targetList = useMemo(() => {
    if (!currentSdk) {
      return [];
    }

    return transform(
      list,
      (result, item) => {
        const { userId, type, videoView, audioIsPlay } = item;
        const currentUser = currentSdk.conference.members.find(item => item.id === userId);

        if (type === 'local') {
          result.push(
            <CurrentView
              sdk={currentSdk}
              roomId={currentSdk.roomId}
              current={currentUser}
              audioIsPlay={setting.microphoneOpen}
              videoIsPlay={setting.cameraOpen && videoView && videoView[currentSdk.STREAM_TYPE_MAIN]}
            />
          );
        } else {
          result.push(
            <RemoteView
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
              result.push(
                type === 'local' ? (
                  <CurrentShareScreenView sdk={currentSdk} current={currentUser} />
                ) : (
                  <RemoteView
                    sdk={currentSdk}
                    userId={userId}
                    streamType={streamType}
                    current={currentUser}
                    videoIsPlay={videoView && videoView[currentSdk.STREAM_TYPE_MAIN]}
                    shareScreen
                  />
                )
              );
            }
          });
      },
      []
    );
  }, [list, currentSdk, setting.cameraOpen, setting.microphoneOpen]);

  if (!currentSdk) {
    return (
      <Flex justify="center" align="center">
        <Spin />
      </Flex>
    );
  }

  return (
    <ConferenceRoom
      {...props}
      conference={conference}
      isMaster={current.isMaster}
      isInvitationAllowed={conference.isInvitationAllowed && current.isMaster}
      signalLevel={signalLevel}
      value={setting}
      onChange={setSetting}
      document={
        conference.options?.document &&
        (conference.options?.documentVisibleAll || current.isMaster) && (
          <ConferenceDocument type={conference.options.documentType} files={conference.options.document} />
        )
      }
      actions={{
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
          modal(InviteMember.renderModal(Object.assign({}, resData.data, { message })));
        },
        leave: () => {
          navigate(baseUrl + '/detail');
        },
        end: async () => {
          const { data: resData } = await ajax(Object.assign({}, apis.endConference));
          if (resData.code !== 0) {
            return;
          }
          navigate(baseUrl + '/detail');
        }
      }}
      list={targetList}
    />
  );
});

export default Conference;
