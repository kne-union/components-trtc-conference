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
  onlineUsers: [],
  userMode: false,
  userId: '',
  conversationId: '',
  conversations: [],
  conversationUnread: {},
  lastMessages: {}
};

const defaultOptions = {
  sessionUrl: '',
  wsPath: '/api/v1/im/ws',
  devApiHost: '',
  apiBase: ''
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
// 用户级连接：令牌不绑定会话，一条连接收该用户全部会话的事件；我在各会话里的成员 id 各不相同
let userMode = false;
let selfUserId = '';
let memberIds = {};
let requestedConversationId = '';
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

const mergeOnlineUsers = users => {
  const map = new Map(state.onlineUsers.map(item => [String(item.userId), item]));
  users.forEach(item => {
    if (item?.userId != null) {
      map.set(String(item.userId), item);
    }
  });
  return Array.from(map.values());
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

const toWsOrigin = value => String(value || '').replace(/\/+$/, '').replace(/^http/i, 'ws');

const wsBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (process.env.NODE_ENV === 'development' && options.devApiHost) {
    return `${protocol}//${options.devApiHost}`;
  }
  const apiBase = String(options.apiBase || '').replace(/\/+$/, '');
  if (apiBase) {
    if (/^https?:\/\//i.test(apiBase)) {
      return toWsOrigin(apiBase);
    }
    const prefix = apiBase.startsWith('/') ? apiBase : `/${apiBase}`;
    return `${protocol}//${window.location.host}${prefix}`;
  }
  const apiRoot = (window.runtimeApiUrl || '').replace(/\/+$/, '');
  if (apiRoot && /^https?:\/\//i.test(apiRoot)) {
    return toWsOrigin(apiRoot);
  }
  return `${protocol}//${window.location.host}`;
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

const totalUnread = map => Object.keys(map).reduce((sum, key) => sum + (chatOpen && key === conversationId ? 0 : Number(map[key] || 0)), 0);

const patchConversationUnread = map => {
  patch({ conversationUnread: map, unread: totalUnread(map) });
};

const applyUserUnreadCount = data => {
  if (data.type === 'unreadCountUpdated') {
    const id = String(data.payload?.conversationId || '');
    if (!id) {
      return;
    }
    const count = chatOpen && id === conversationId ? 0 : Number(data.payload?.unreadCount || 0);
    patchConversationUnread({ ...state.conversationUnread, [id]: count });
    return;
  }
  const map = {};
  Object.entries(data.payload?.conversations || {}).forEach(([id, count]) => {
    map[String(id)] = chatOpen && String(id) === conversationId ? 0 : Number(count || 0);
  });
  patchConversationUnread(map);
};

const applyConversations = list => {
  const nextMemberIds = { ...memberIds };
  const unreadMap = { ...state.conversationUnread };
  const lastMessages = { ...state.lastMessages };
  list.forEach(item => {
    const id = String(item?.id || '');
    if (!id) {
      return;
    }
    const self = (item.members || []).find(member => String(member.userId) === selfUserId);
    if (self) {
      nextMemberIds[id] = String(self.id);
    }
    if (item.unreadCount != null) {
      unreadMap[id] = chatOpen && id === conversationId ? 0 : Number(item.unreadCount || 0);
    }
    if (item.lastMessage && !lastMessages[id]) {
      lastMessages[id] = item.lastMessage;
    }
  });
  memberIds = nextMemberIds;
  const memberId = conversationId ? memberIds[conversationId] || '' : '';
  const memberChanged = memberId && memberId !== state.memberId;
  patch({ conversations: list, conversationUnread: unreadMap, unread: totalUnread(unreadMap), lastMessages, memberId });
  if (memberChanged && !state.historyLoaded) {
    requestActiveConversation(socket);
  }
};

const requestActiveConversation = current => {
  if (!conversationId) {
    return;
  }
  sendSocket(current, 'getMessageHistory', { conversationId, limit: 100 });
  requestOnlineUsers(current);
};

const applyUnreadCount = data => {
  if (userMode) {
    applyUserUnreadCount(data);
    return;
  }
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
  if (userMode && Number(state.conversationUnread[conversationId] || 0) > 0) {
    patchConversationUnread({ ...state.conversationUnread, [conversationId]: 0 });
  }
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
  userMode = false;
  selfUserId = '';
  memberIds = {};
  requestedConversationId = '';
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
    userMode = !body.data.conversationId;
    selfUserId = userMode ? String(body.data.userId || '') : '';
    let memberId = userMode ? '' : String(body.data.memberId);
    conversationId = userMode ? requestedConversationId : String(body.data.conversationId);
    const wsPath = options.wsPath || defaultOptions.wsPath;
    const nextSocket = new WebSocket(`${wsBase()}${wsPath}?token=${encodeURIComponent(body.data.wsToken)}`);
    socket = nextSocket;
    nextSocket.addEventListener('open', () => {
      if (currentGeneration !== generation || socket !== nextSocket) {
        return;
      }
      if (userMode) {
        patch({ connectError: '', ready: true, userMode: true, userId: selfUserId, conversationId });
        sendSocket(nextSocket, 'getConversations', { page: 1, pageSize: 100 });
        sendSocket(nextSocket, 'getUnreadCount', {});
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
      if (data.type === 'conversations') {
        if (userMode) {
          applyConversations(Array.isArray(data.payload?.list) ? data.payload.list : []);
        }
        return;
      }
      if (data.type === 'onlineUsers') {
        const users = Array.isArray(data.payload?.users) ? data.payload.users : [];
        patch({ onlineUsers: userMode ? mergeOnlineUsers(users) : users });
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
        if (userMode) {
          if (String(data.payload?.conversationId || '') !== conversationId) {
            return;
          }
          memberId = memberIds[conversationId] || '';
        }
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
        if (userMode) {
          const lastMessages = { ...state.lastMessages };
          Object.keys(lastMessages).forEach(id => {
            if (String(lastMessages[id]?.id) === messageId) {
              lastMessages[id] = { ...lastMessages[id], status: 1 };
            }
          });
          patch({ lastMessages });
        }
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
        if (userMode && String(data.payload?.conversationId || '') !== conversationId) {
          return;
        }
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
        if (userMode) {
          const targetId = String(incoming.conversationId || '');
          if (data.type === 'sendMessageSuccess' && !memberIds[targetId] && incoming.senderId != null) {
            memberIds = { ...memberIds, [targetId]: String(incoming.senderId) };
          }
          if (!memberIds[targetId]) {
            sendSocket(nextSocket, 'getConversations', { page: 1, pageSize: 100 });
          }
          const signal = isCallSignal(incoming);
          if (!signal) {
            patch({ lastMessages: { ...state.lastMessages, [targetId]: incoming } });
          }
          if (targetId !== conversationId) {
            const mineElsewhere = data.type === 'sendMessageSuccess' || String(incoming.senderId) === String(memberIds[targetId] || '');
            if (signal && mineElsewhere && incoming.id != null) {
              signalMessageIds.add(String(incoming.id));
              sendSocket(nextSocket, 'revokeMessage', { messageId: incoming.id });
            }
            if (data.type === 'newMessage') {
              if (signal && !mineElsewhere) {
                // 接听、挂断的信令发往当前会话，来电前先切到来电所在会话
                setImConversation(targetId);
                ingestCallSignal(incoming);
              } else if (!mineElsewhere && !signal) {
                noticeSeq += 1;
                patch({ notice: { seq: noticeSeq, message: incoming } });
              }
              sendSocket(nextSocket, 'recvAck', { messageId: incoming.id, conversationId: incoming.conversationId });
            }
            return;
          }
          memberId = memberIds[targetId] || memberId;
        }
        const messages = mergeMessages(state.messages, [incoming]);
        const mine = String(incoming.senderId) === memberId || (userMode && data.type === 'sendMessageSuccess');
        const signal = isCallSignal(incoming);
        if (signal && mine && incoming.id != null) {
          signalMessageIds.add(String(incoming.id));
          sendSocket(nextSocket, 'revokeMessage', { messageId: incoming.id });
        }
        if (data.type === 'newMessage' && signal && !mine) {
          ingestCallSignal(incoming);
        }
        const shouldNotify = data.type === 'newMessage' && !mine && !chatOpen && !signal;
        const unread = shouldNotify && !userMode ? state.unread + 1 : state.unread;
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
  if (userMode) {
    patch({ unread: totalUnread(state.conversationUnread) });
    if (open) {
      markRead(state.messages);
    }
    return;
  }
  if (open) {
    patch({ unread: 0 });
    markRead(state.messages);
  }
};

// 用户级连接切换当前会话：不重连，只换历史、在线成员与发送目标
export const setImConversation = id => {
  const next = id == null ? '' : String(id);
  requestedConversationId = next;
  if (!userMode || next === conversationId) {
    return;
  }
  clearHandTimer();
  conversationId = next;
  const unreadMap = chatOpen && next ? { ...state.conversationUnread, [next]: 0 } : state.conversationUnread;
  patch({
    conversationId: next,
    memberId: next ? memberIds[next] || '' : '',
    messages: [],
    historyLoaded: false,
    peerReadSeq: 0,
    conversationUnread: unreadMap,
    unread: totalUnread(unreadMap)
  });
  if (!next) {
    return;
  }
  if (memberIds[next]) {
    requestActiveConversation(socket);
  } else {
    sendSocket(socket, 'getConversations', { page: 1, pageSize: 100 });
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
