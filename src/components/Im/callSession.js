import { useEffect, useState } from 'react';
import ConferenceSDK from '@components/App/ConferenceMain/plugins/trtc';
import { startCallTone, stopCallTone } from './callTone';

const RING_MS = 60000;

const emptyCall = {
  phase: 'idle',
  media: 'voice',
  callId: '',
  roomId: '',
  peerName: '',
  peerAvatar: '',
  remoteUserId: '',
  remoteVideo: false,
  roomReady: false,
  muted: false,
  cameraOff: false,
  speakerOff: false,
  startedAt: 0,
  error: ''
};

let state = emptyCall;
let sdk = null;
let ajax = null;
let callUrl = '';
let send = null;
let onRecord = null;
let previewMode = false;
let previewEpoch = 0;
let ringTimer = null;
let closing = false;
let localEl = null;
let remoteEl = null;
const listeners = new Set();
let openChatHandler = null;

export const registerOpenChat = handler => {
  openChatHandler = handler;
  return () => {
    if (openChatHandler === handler) {
      openChatHandler = null;
    }
  };
};

const requestOpenChat = () => {
  if (typeof openChatHandler === 'function') {
    openChatHandler();
  }
};

const emit = () => {
  listeners.forEach(listener => listener(state));
};

const syncTone = () => {
  if (state.phase === 'outgoing' || state.phase === 'incoming') {
    startCallTone();
    return;
  }
  stopCallTone();
};

const patch = partial => {
  state = { ...state, ...partial };
  emit();
  syncTone();
};

const clearRing = () => {
  if (ringTimer) {
    clearTimeout(ringTimer);
    ringTimer = null;
  }
};

export const getCallState = () => state;

export const subscribeCall = listener => {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
};

export const useCall = () => {
  const [snapshot, setSnapshot] = useState(getCallState);
  useEffect(() => subscribeCall(setSnapshot), []);
  return snapshot;
};

export const configureCall = options => {
  if (!options) {
    return;
  }
  if (options.ajax) {
    ajax = options.ajax;
  }
  if (options.callUrl) {
    callUrl = options.callUrl;
  }
  if (options.send) {
    send = options.send;
  }
  if (options.preview === true) {
    previewEpoch += 1;
    previewMode = true;
    options.previewEpoch = previewEpoch;
  } else if (options.preview === false && options.previewEpoch === previewEpoch) {
    previewMode = false;
  }
  if (Object.prototype.hasOwnProperty.call(options, 'onRecord')) {
    onRecord = options.onRecord || null;
  }
};

const publish = (kind, value) => {
  const content = { type: 'custom', value: { kind, ...value } };
  if (kind === 'call' && previewMode && onRecord) {
    onRecord(content);
    return;
  }
  if (!previewMode && send) {
    send('custom', content);
  }
};

const fetchSign = async roomId => {
  const { data: body } = await ajax({
    url: callUrl,
    method: 'POST',
    data: { roomId }
  });
  const sign = body?.data;
  if (!body || body.code !== 0 || !sign?.userSig || !sign?.sdkAppId || !sign?.userId) {
    throw new Error(body?.msg || 'failed');
  }
  return sign;
};

const bindViews = () => {
  if (!sdk || state.phase === 'idle' || state.phase === 'incoming') {
    return;
  }
  if (state.media === 'video' && !state.cameraOff && localEl) {
    sdk.updateLocalVideo({ el: localEl, mute: false });
  }
  if (state.remoteUserId && state.remoteVideo && remoteEl) {
    sdk.updateRemote({
      userId: state.remoteUserId,
      streamType: sdk.STREAM_TYPE_MAIN,
      el: remoteEl
    });
  }
};

export const bindCallViews = views => {
  if (views) {
    localEl = views.local || null;
    remoteEl = views.remote || null;
  }
  bindViews();
};

const openSdk = async (sign, media) => {
  sdk = new ConferenceSDK({
    sdkParams: {
      sdkAppId: sign.sdkAppId,
      userId: sign.userId,
      userSig: sign.userSig,
      roomId: sign.roomId || state.roomId
    },
    conference: {},
    current: {},
    events: {
      onEnterRoom: ({ userId, type }) => {
        if (type === 'remote') {
          patch({ remoteUserId: userId });
          bindViews();
        }
      },
      onExitRoom: ({ userId, type }) => {
        if (type === 'remote' && userId === state.remoteUserId) {
          patch({ remoteUserId: '', remoteVideo: false });
        }
      },
      onUpdate: ({ userId, type, streamType, videoIsPlay }) => {
        if (type === 'remote' && streamType === sdk?.STREAM_TYPE_MAIN) {
          patch({ remoteUserId: userId, remoteVideo: !!videoIsPlay });
          bindViews();
        }
      }
    }
  });
  await sdk.enterRoom({ video: media === 'video', audio: true });
  patch({ roomReady: true, cameraOff: media !== 'video' });
  bindViews();
};

const closeSdk = async () => {
  const current = sdk;
  sdk = null;
  localEl = null;
  remoteEl = null;
  if (!current) {
    return;
  }
  try {
    await current.exitRoom();
  } catch (error) {
    console.warn('[im-call] exitRoom failed', error);
  }
  try {
    current.trtc.destroy();
  } catch (error) {
    console.warn('[im-call] destroy failed', error);
  }
};

const reset = () => {
  clearRing();
  state = emptyCall;
  emit();
  stopCallTone();
};

const finish = async (status, duration) => {
  if (closing || state.phase === 'idle') {
    return;
  }
  closing = true;
  stopCallTone();
  const snapshot = state;
  clearRing();
  if (snapshot.phase === 'outgoing' || snapshot.phase === 'connected') {
    publish('callSignal', {
      action: status === 'duration' ? 'hangup' : 'cancel',
      callId: snapshot.callId,
      roomId: snapshot.roomId,
      media: snapshot.media
    });
  }
  if (snapshot.phase === 'incoming' && status === 'reject') {
    publish('callSignal', {
      action: 'reject',
      callId: snapshot.callId,
      roomId: snapshot.roomId,
      media: snapshot.media
    });
  }
  if (status) {
    publish('call', {
      media: snapshot.media,
      status,
      duration: duration || 0,
      callId: snapshot.callId
    });
  }
  await closeSdk();
  reset();
  closing = false;
};

export const startCall = async ({ media }) => {
  if (state.phase !== 'idle') {
    return false;
  }
  const callId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const roomId = `imcall${callId}`;
  patch({
    phase: 'outgoing',
    media: media === 'video' ? 'video' : 'voice',
    callId,
    roomId,
    peerName: '',
    peerAvatar: '',
    muted: false,
    cameraOff: media !== 'video',
    speakerOff: false,
    error: ''
  });
  if (!previewMode && (!callUrl || !ajax)) {
    reset();
    return false;
  }
  try {
    if (!previewMode) {
      const sign = await fetchSign(roomId);
      await openSdk(sign, state.media);
      publish('callSignal', { action: 'invite', callId, roomId, media: state.media });
    }
    ringTimer = setTimeout(() => {
      if (state.phase === 'outgoing' && state.callId === callId) {
        finish('missed');
      }
    }, RING_MS);
    return true;
  } catch (error) {
    console.warn('[im-call] start failed', error);
    await closeSdk();
    reset();
    return false;
  }
};

export const acceptCall = async () => {
  if (state.phase !== 'incoming') {
    return false;
  }
  clearRing();
  stopCallTone();
  if (!previewMode && (!callUrl || !ajax)) {
    return false;
  }
  try {
    if (!previewMode) {
      const sign = await fetchSign(state.roomId);
      await openSdk(sign, state.media);
      publish('callSignal', {
        action: 'accept',
        callId: state.callId,
        roomId: state.roomId,
        media: state.media
      });
    }
    patch({ phase: 'connected', startedAt: Date.now(), cameraOff: state.media !== 'video' });
    bindViews();
    requestOpenChat();
    return true;
  } catch (error) {
    console.warn('[im-call] accept failed', error);
    await closeSdk();
    patch({ phase: 'incoming', error: 'failed' });
    return false;
  }
};

export const rejectCall = () => finish('reject');

export const hangupCall = () => {
  if (state.phase === 'incoming') {
    return rejectCall();
  }
  if (state.phase === 'connected') {
    const duration = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
    return finish('duration', duration);
  }
  if (state.phase === 'outgoing') {
    return finish('cancel');
  }
  return undefined;
};

export const toggleCallMute = async () => {
  const muted = !state.muted;
  patch({ muted });
  if (sdk) {
    await sdk.updateLocalAudio({ mute: muted });
  }
};

export const toggleCallCamera = async () => {
  const cameraOff = !state.cameraOff;
  patch({ cameraOff });
  if (!sdk) {
    return;
  }
  await sdk.setLocalVideoOpen({ open: !cameraOff, el: localEl });
  bindViews();
};

export const toggleCallSpeaker = async () => {
  const speakerOff = !state.speakerOff;
  patch({ speakerOff });
  if (sdk) {
    await sdk.setRemoteAudioMuted(speakerOff);
  }
};

export const flipCallCamera = async () => {
  if (sdk) {
    await sdk.flipCamera();
  }
};

export const ingestCallSignal = message => {
  const value = message?.content?.value;
  if (!value || value.kind !== 'callSignal') {
    return;
  }
  const action = value.action;
  if (action === 'invite') {
    if (state.phase !== 'idle') {
      return;
    }
    const callId = value.callId;
    patch({
      phase: 'incoming',
      media: value.media === 'video' ? 'video' : 'voice',
      callId,
      roomId: value.roomId,
      peerName: message.senderInfo?.name || message.sender?.nickname || '',
      peerAvatar: message.senderInfo?.avatar || message.sender?.avatar || '',
      cameraOff: value.media !== 'video',
      error: ''
    });
    ringTimer = setTimeout(() => {
      if (state.phase === 'incoming' && state.callId === callId) {
        reset();
      }
    }, RING_MS);
    return;
  }
  if (!value.callId || value.callId !== state.callId) {
    return;
  }
  if (action === 'accept' && state.phase === 'outgoing') {
    clearRing();
    patch({
      phase: 'connected',
      startedAt: Date.now(),
      peerName: message.senderInfo?.name || message.sender?.nickname || state.peerName,
      peerAvatar: message.senderInfo?.avatar || message.sender?.avatar || state.peerAvatar
    });
    return;
  }
  if (action === 'reject' && state.phase === 'outgoing') {
    clearRing();
    stopCallTone();
    closeSdk().then(reset);
    return;
  }
  if (action === 'cancel' || action === 'hangup') {
    clearRing();
    stopCallTone();
    closeSdk().then(reset);
  }
};

export const endPreviewCall = () => {
  if (previewMode && state.phase !== 'idle') {
    clearRing();
    reset();
  }
};
