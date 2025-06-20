import TRTC from 'trtc-sdk-v5';

class ConferenceSDK {
  STREAM_TYPE_MAIN = TRTC.TYPE.STREAM_TYPE_MAIN;
  STREAM_TYPE_SUB = TRTC.TYPE.STREAM_TYPE_SUB;

  constructor({ sdkParams, conference, current, events = {} }) {
    this.sdkParams = {
      sdkAppId: sdkParams.sdkAppId,
      userId: sdkParams.userId,
      userSig: sdkParams.userSig,
      strRoomId: sdkParams.roomId
    };
    this.roomId = sdkParams.roomId;
    this.events = events;
    this.conference = conference;
    this.current = current;
    this.isEnd = false;
    this.connectTimer = null;
    this.trtc = TRTC.create();
    //0: 未加入房间 1: 已加入房间
    this.clientState = {};
    this.taskPromise = {};
    this.localQuality = -1;

    this.trtc.on(TRTC.EVENT.REMOTE_USER_ENTER, ({ userId }) => {
      if (/^robot/.test(String(userId))) {
        return;
      }
      this.events.onEnterRoom?.({ userId, type: 'remote' });
      this.clientState[userId] = 1;
    });

    this.trtc.on(TRTC.EVENT.REMOTE_USER_EXIT, ({ userId }) => {
      this.events.onExitRoom?.({ userId, type: 'remote' });
      this.clientState[userId] = 0;
    });

    this.trtc.on(TRTC.EVENT.REMOTE_VIDEO_AVAILABLE, ({ userId, streamType, ...props }) => {
      this.runTask(userId, async () => {
        await this.trtc.startRemoteVideo({ userId, streamType });
        await this.events.onUpdate?.({ userId, type: 'remote', streamType, videoIsPlay: true });
      });
    });
    this.trtc.on(TRTC.EVENT.REMOTE_VIDEO_UNAVAILABLE, ({ userId, streamType }) => {
      this.runTask(userId, async () => {
        await this.trtc.stopRemoteVideo({ userId, streamType });
        this.events.onUpdate?.({ userId, type: 'remote', streamType, videoIsPlay: false });
      });
    });
    this.trtc.on(TRTC.EVENT.REMOTE_AUDIO_AVAILABLE, ({ userId }) => {
      this.events.onUpdate?.({ userId, type: 'remote', audioIsPlay: true });
    });
    this.trtc.on(TRTC.EVENT.REMOTE_AUDIO_UNAVAILABLE, ({ userId }) => {
      this.events.onUpdate?.({ userId, type: 'remote', audioIsPlay: false });
    });
    this.trtc.on(TRTC.EVENT.KICKED_OUT, event => {
      this.isEnd = true;
      this.events.onKickedOut?.({ reason: event.reason });
    });
    this.trtc.on(TRTC.EVENT.NETWORK_QUALITY, event => {
      const format = {
        0: -1,
        1: 3,
        2: 2,
        3: 2,
        4: 1,
        5: 1,
        6: -1
      };
      this.localQuality = format[Math.max(event.uplinkNetworkQuality, event.downlinkNetworkQuality)] || -1;
      this.events.onQualityChange?.(this.localQuality);
    });

    this.trtc.on(TRTC.EVENT.SCREEN_SHARE_STOPPED, () => {
      this.events.onShareScreenStop?.();
      this.events.onUpdate?.({
        userId: this.sdkParams.userId,
        type: 'local',
        streamType: this.STREAM_TYPE_SHARE,
        videoIsPlay: false
      });
    });

    this.trtc.on(TRTC.EVENT.CUSTOM_MESSAGE, event => {
      // receive custom message
      const message = JSON.parse(new TextDecoder().decode(event.data));
      if (message.type === 10000 && message.payload?.end) {
        this.events.onSpeech?.({ sender: message.sender, message: message.payload.text });
      }
    });

    this.trtc.on(TRTC.EVENT.CONNECTION_STATE_CHANGED, event => {
      const prevState = event.prevState;
      const curState = event.state;
      if (curState === 'CONNECTED') {
        this.connectTimer && clearTimeout(this.connectTimer);
      }
      if (prevState === 'CONNECTED' && curState === 'DISCONNECTED') {
        this.connectTimer = setTimeout(() => {
          !this.isEnd && this.events.onDisconnected?.();
        }, 1000);
      }
    });
  }

  async runTask(id, task) {
    await Promise.resolve(this.taskPromise[id]);
    this.taskPromise[id] = task();
    await this.taskPromise[id];
  }

  async enterRoom() {
    await this.runTask(this.sdkParams.userId, async () => {
      await this.trtc.enterRoom(this.sdkParams);
      await this.trtc.startLocalVideo();
      await this.trtc.startLocalAudio();
    });
    this.clientState[this.sdkParams.userId] = 1;
    this.events.onLocalStateChange?.(this.clientState[this.sdkParams.userId]);
    this.events.onEnterRoom?.({
      userId: this.sdkParams.userId,
      type: 'local',
      videoView: { [this.STREAM_TYPE_MAIN]: true }
    });
  }

  async exitRoom() {
    this.isEnd = true;
    await this.runTask(this.sdkParams.userId, async () => {
      await this.trtc.stopLocalVideo();
      await this.trtc.stopLocalAudio();
      await this.trtc.exitRoom();
    });
    this.clientState[this.sdkParams.userId] = 0;
    this.events.onLocalStateChange?.(this.clientState[this.sdkParams.userId]);
    this.events.onExitRoom?.({ userId: this.sdkParams.userId, type: 'local' });
  }

  async updateLocalVideo({ el, mute = false }) {
    this.clientState[this.sdkParams.userId] === 1 && (await this.trtc.updateLocalVideo({ view: el, mute }));
  }

  async updateLocalAudio({ mute = false }) {
    this.clientState[this.sdkParams.userId] === 1 && (await this.trtc.updateLocalAudio({ mute }));
  }

  async updateRemote({ userId, streamType, el }) {
    await this.taskPromise;
    this.clientState[this.sdkParams.userId] === 1 &&
      this.clientState[userId] === 1 &&
      (await this.trtc.updateRemoteVideo({
        userId,
        streamType,
        view: el
      }));
  }

  async shareScreen() {
    await this.trtc.startScreenShare();
    await this.events.onUpdate?.({
      userId: this.sdkParams.userId,
      type: 'local',
      streamType: this.STREAM_TYPE_SHARE,
      videoIsPlay: true
    });
  }

  async stopShareScreen() {
    await this.trtc.stopScreenShare();
    await this.events.onUpdate?.({
      userId: this.sdkParams.userId,
      type: 'local',
      streamType: this.STREAM_TYPE_SHARE,
      videoIsPlay: false
    });
  }

  async updateScreenShare({ el }) {
    await this.trtc.updateScreenShare({ view: el });
  }
}

export default ConferenceSDK;

/*const conferenceSDK = ({ appId, userId, userSig, events }) => {
  const { onEnterRoom, onExitRoom, onQualityChange } = events;
  const trtc = TRTC.create();
  let localState = '';

  const api = {
    enterRoom: async roomId => {
      await trtc.enterRoom({ strRoomId: roomId, sdkAppId: appId, userId, userSig });
      await trtc.startLocalVideo();
      await trtc.startLocalAudio();
    },
    exitRoom: async () => {
      await trtc.stopLocalVideo();
      await trtc.stopLocalAudio();
      await trtc.exitRoom();
    },
    shareScreen: async () => {
      await trtc.startScreenShare();
    },
    stopShareScreen:async ()=>{
      await trtc.stopScreenShare();
    },
    updateScreenShare: async ({ el }) => {
      await trtc.updateScreenShare({ view: el });
    },
    updateLocalVideo: async ({ el, mute }) => {
      await trtc.updateLocalVideo({ view: el, mute });
    },
    updateLocalAudio: async ({ mute }) => {
      await trtc.updateLocalAudio({ mute });
    },
    updateRemote: async ({ userId, streamType, el }) => {
      await trtc.updateRemoteVideo({ userId, streamType, view: el });
    },
    destroy: async () => {
      await trtc.exitRoom();
      trtc.destroy();
    }
  };

  trtc.on(TRTC.EVENT.REMOTE_USER_ENTER, (event) => {
    console.log('>>>>>>>ENTER_ROOM',event);
  });

  trtc.on(TRTC.EVENT.REMOTE_VIDEO_AVAILABLE, ({ userId, streamType }) => {
    onEnterRoom({ userId, streamType });
    trtc.startRemoteVideo({ userId, streamType });
  });
  trtc.on(TRTC.EVENT.REMOTE_VIDEO_UNAVAILABLE, ({ userId, streamType }) => {
    onExitRoom({ userId, streamType });
    trtc.stopRemoteVideo({ userId, streamType });
  });
  trtc.on(TRTC.EVENT.NETWORK_QUALITY, event => {
    const format = {
      0: -1,
      1: 3,
      2: 2,
      3: 2,
      4: 1,
      5: 1,
      6: -1
    };
    onQualityChange && onQualityChange(format[Math.max(event.uplinkNetworkQuality, event.downlinkNetworkQuality)] || 0);
  });

  return api;
};

export default conferenceSDK;*/
