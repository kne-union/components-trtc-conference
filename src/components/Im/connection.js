import { ingestCallSignal } from './callSession';
import { isCallSignal } from './callRecord';

const listeners = new Set();

const emptyState = {
  ready: false,
  connectError: '',
  messages: [],
  memberId: '',
  unread: 0,
  notice: null,
  peerReadSeq: 0,
  historyLoaded: false,
  onlineUsers: []
};

const defaultOptions = {
  sessionUrl: '',
  wsPath: '/api/v1/im/ws',
  devApiHost: ''
};

let state = emptyState;
let socket = null;
let conversationId = '';
let retainCount = 0;
let generation = 0;
let chatOpen = false;
let handTimer = null;
let options = { ...defaultOptions };
let noticeSeq = 0;
let pendingUnread = null;
let entryNotified = false;
const signalMessageIds = new Set();

const HAND_HOLD_MS = 10000;

const clearHandTimer = () => {
  if (handTimer) {
    clearTimeout(handTimer);
    handTimer = null;
  }
};

const requestOnlineUsers = current => {
  sendSocket(current, 'getOnlineUsers', { conversationId });
};

const upsertOnlineUser = user => {
  const userId = String(user?.userId || '');
  if (!userId || state.onlineUsers.some(item => String(item.userId) === userId)) {
    return;
  }
  patch({ onlineUsers: [...state.onlineUsers, user] });
};

const removeOnlineUser = userId => {
  const id = String(userId || '');
  if (!id) {
    return;
  }
  patch({ onlineUsers: state.onlineUsers.filter(item => String(item.userId) !== id) });
};

const latestOwnRaiseHand = (messages, memberId) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (String(item.senderId) !== String(memberId || '')) {
      continue;
    }
    const value = item?.content?.value;
    if (Number(item.status) === 1) {
      continue;
    }
    if (item?.type === 'custom' && value && value.kind === 'raiseHand') {
      return item;
    }
  }
  return null;
};

const scheduleAutoLower = (messages, memberId) => {
  clearHandTimer();
  const latest = latestOwnRaiseHand(messages, memberId);
  if (!latest?.content?.value?.raised) {
    return;
  }
  const raisedAt = Date.parse(latest.createdAt || '') || Number(latest.sentAt) || Date.now();
  const delay = Math.max(0, raisedAt + HAND_HOLD_MS - Date.now());
  handTimer = setTimeout(() => {
    handTimer = null;
    const current = latestOwnRaiseHand(state.messages, state.memberId);
    if (!current?.content?.value?.raised || String(current.id) !== String(latest.id)) {
      return;
    }
    sendImContent('custom', {
      type: 'custom',
      value: { kind: 'raiseHand', raised: false }
    });
  }, delay);
};

const wsBase = () => {
  const apiRoot = (window.runtimeApiUrl || '').replace(/\/+$/, '');
  if (apiRoot && /^https?:\/\//i.test(apiRoot)) {
    return apiRoot.replace(/^http/i, 'ws');
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NODE_ENV === 'development' && options.devApiHost ? options.devApiHost : window.location.host;
  return `${protocol}//${host}`;
};

const createClientMsgId = () => `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const sendSocket = (current, type, payload, extra = {}) => {
  if (!current || current.readyState !== WebSocket.OPEN) {
    return false;
  }
  current.send(JSON.stringify({ type, payload, ...extra }));
  return true;
};

const mergeMessages = (current, incoming) => {
  const map = new Map(current.map(item => [String(item.id), item]));
  incoming.forEach(item => {
    if (item && item.id != null) {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values()).sort((a, b) => Number(a.seq || 0) - Number(b.seq || 0));
};

const emit = next => {
  state = next;
  listeners.forEach(listener => listener(state));
};

const patch = partial => {
  emit({ ...state, ...partial });
};

export const getImState = () => state;

export const subscribeIm = listener => {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
};

const unreadFromPayload = data => {
  if (data.type === 'unreadCountUpdated') {
    return Number(data.payload?.unreadCount || 0);
  }
  const conversations = data.payload?.conversations || {};
  if (conversationId && conversations[conversationId] != null) {
    return Number(conversations[conversationId] || 0);
  }
  return Object.values(conversations).reduce((sum, value) => sum + Number(value || 0), 0);
};

const maybeEntryNotice = () => {
  if (entryNotified || chatOpen || !state.historyLoaded || pendingUnread == null || pendingUnread <= 0) {
    return;
  }
  const incoming = [...state.messages].reverse().find(item => String(item.senderId) !== String(state.memberId) && Number(item.status) !== 1 && !isCallSignal(item));
  if (!incoming) {
    return;
  }
  entryNotified = true;
  noticeSeq += 1;
  patch({ notice: { seq: noticeSeq, message: incoming } });
};

const applyUnreadCount = data => {
  pendingUnread = unreadFromPayload(data);
  patch({ unread: chatOpen ? 0 : pendingUnread });
  maybeEntryNotice();
};

const markRead = list => {
  const last = list[list.length - 1];
  if (!last || !conversationId || !chatOpen) {
    return;
  }
  sendSocket(socket, 'readMessages', {
    conversationId,
    lastMessageId: last.id,
    lastSeq: last.seq
  });
};

const disconnect = () => {
  clearHandTimer();
  generation += 1;
  const current = socket;
  socket = null;
  conversationId = '';
  chatOpen = false;
  pendingUnread = null;
  entryNotified = false;
  options = { ...defaultOptions };
  if (current && current.readyState < WebSocket.CLOSING) {
    current.close();
  }
  emit(emptyState);
};

const connect = async (ajax, currentGeneration) => {
  if (!options.sessionUrl) {
    patch({ connectError: 'failed', ready: false });
    return;
  }
  try {
    const { data: body } = await ajax({
      url: options.sessionUrl,
      method: 'POST',
      data: {}
    });
    if (currentGeneration !== generation) {
      return;
    }
    if (!body || body.code !== 0 || !body.data?.wsToken) {
      patch({ connectError: body?.msg || 'failed', ready: false });
      return;
    }
    const memberId = String(body.data.memberId);
    conversationId = String(body.data.conversationId);
    const wsPath = options.wsPath || defaultOptions.wsPath;
    const nextSocket = new WebSocket(`${wsBase()}${wsPath}?token=${encodeURIComponent(body.data.wsToken)}`);
    socket = nextSocket;
    nextSocket.addEventListener('open', () => {
      if (currentGeneration !== generation || socket !== nextSocket) {
        return;
      }
      patch({ connectError: '', ready: true, memberId });
      sendSocket(nextSocket, 'getMessageHistory', { conversationId, limit: 100 });
      sendSocket(nextSocket, 'getUnreadCount', {});
      requestOnlineUsers(nextSocket);
    });
    nextSocket.addEventListener('message', event => {
      if (currentGeneration !== generation || socket !== nextSocket) {
        return;
      }
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        return;
      }
      if (data.type === 'error') {
        patch({ connectError: data.payload?.message || 'failed' });
        return;
      }
      if (data.type === 'onlineUsers') {
        patch({ onlineUsers: Array.isArray(data.payload?.users) ? data.payload.users : [] });
        return;
      }
      if (data.type === 'userOnline') {
        upsertOnlineUser(data.payload);
        return;
      }
      if (data.type === 'userOffline') {
        removeOnlineUser(data.payload?.userId);
        return;
      }
      if (data.type === 'messageHistory') {
        const list = mergeMessages([], data.payload?.list || []);
        const maxSeq = list.reduce((max, item) => Math.max(max, Number(item.seq || 0)), 0);
        patch({
          messages: list,
          memberId,
          historyLoaded: true,
          peerReadSeq: state.peerReadSeq > 0 ? state.peerReadSeq : maxSeq
        });
        scheduleAutoLower(list, memberId);
        markRead(list);
        maybeEntryNotice();
        return;
      }
      if (data.type === 'unreadCount' || data.type === 'unreadCountUpdated') {
        applyUnreadCount(data);
        return;
      }
      if (data.type === 'messageRevoked') {
        const messageId = String(data.payload?.messageId || '');
        const messages = state.messages.map(item => (String(item.id) === messageId ? { ...item, status: 1 } : item));
        patch({ messages });
        scheduleAutoLower(messages, state.memberId);
        if (signalMessageIds.has(messageId)) {
          signalMessageIds.delete(messageId);
          sendSocket(nextSocket, 'getUnreadCount', {});
        }
        return;
      }
      if (data.type === 'messageRead') {
        const lastId = String(data.payload?.lastMessageId || '');
        const target = state.messages.find(item => String(item.id) === lastId);
        const seq = Number(target?.seq || 0);
        if (seq > Number(state.peerReadSeq || 0)) {
          patch({ peerReadSeq: seq });
        }
        return;
      }
      if (data.type === 'newMessage' || data.type === 'sendMessageSuccess') {
        const incoming = data.payload?.message;
        if (!incoming) {
          return;
        }
        const messages = mergeMessages(state.messages, [incoming]);
        const mine = String(incoming.senderId) === memberId;
        const signal = isCallSignal(incoming);
        if (signal && mine && incoming.id != null) {
          signalMessageIds.add(String(incoming.id));
          sendSocket(nextSocket, 'revokeMessage', { messageId: incoming.id });
        }
        if (data.type === 'newMessage' && signal && !mine) {
          ingestCallSignal(incoming);
        }
        const shouldNotify = data.type === 'newMessage' && !mine && !chatOpen && !signal;
        const unread = shouldNotify ? state.unread + 1 : state.unread;
        noticeSeq += shouldNotify ? 1 : 0;
        patch({
          messages,
          memberId,
          unread,
          notice: shouldNotify ? { seq: noticeSeq, message: incoming } : state.notice
        });
        scheduleAutoLower(messages, memberId);
        markRead(messages);
        if (data.type === 'newMessage') {
          sendSocket(nextSocket, 'recvAck', { messageId: incoming.id, conversationId: incoming.conversationId });
        }
      }
    });
    nextSocket.addEventListener('close', event => {
      if (currentGeneration !== generation || socket !== nextSocket) {
        return;
      }
      socket = null;
      patch({
        ready: false,
        connectError: event.code !== 1000 ? 'failed' : '',
        onlineUsers: []
      });
    });
  } catch (error) {
    console.error(error);
    if (currentGeneration === generation) {
      patch({ connectError: 'failed', ready: false });
    }
  }
};

export const retainIm = (ajax, nextOptions) => {
  retainCount += 1;
  if (retainCount === 1) {
    options = { ...defaultOptions, ...nextOptions };
    connect(ajax, generation);
  }
  return () => {
    retainCount -= 1;
    if (retainCount <= 0) {
      retainCount = 0;
      disconnect();
    }
  };
};

export const isImChatOpen = () => chatOpen;

export const setImChatOpen = open => {
  chatOpen = open;
  if (open) {
    patch({ unread: 0 });
    markRead(state.messages);
  }
};

export const revokeImMessage = messageId => sendSocket(socket, 'revokeMessage', { messageId });

export const sendImContent = (type, content) => {
  const clientMsgId = createClientMsgId();
  return (
    state.ready &&
    sendSocket(
      socket,
      'sendMessage',
      {
        conversationId,
        type,
        content,
        clientMsgId,
        sentAt: Date.now()
      },
      { traceId: clientMsgId }
    )
  );
};
