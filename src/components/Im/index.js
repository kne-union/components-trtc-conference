import { createWithRemoteLoader } from '@kne/remote-loader';
import { MessageInput } from '@kne/react-bot';
import '@kne/react-bot/dist/index.css';
import Icon, { LeftOutlined, PaperClipOutlined, PictureOutlined, CommentOutlined, SmileOutlined, PhoneOutlined, VideoCameraOutlined, SearchOutlined } from '@ant-design/icons';
import { StackCard } from '@kne/react-box';
import '@kne/react-box/dist/index.css';
import { App, Badge, Button, Dropdown, Image, Input, Popover, Tooltip } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import withLocale from './withLocale';
import { getImState, retainIm, revokeImMessage, sendImContent, setImChatOpen, setImConversation, subscribeIm } from './connection';
import { callRecordText, isCallSignal } from './callRecord';
import { configureCall, endPreviewCall, startCall, useCall } from './callSession';
import CallOverlay from './CallOverlay';
import style from './style.module.scss';

export { isImChatOpen, isImPeerOnline } from './connection';
export { registerOpenChat } from './callSession';

const PHRASE_IDS = ['PhraseArrived', 'PhraseWait', 'PhraseHearMe', 'PhraseCantHear', 'PhraseCantSee', 'PhraseUnmute', 'PhraseMuted', 'PhraseNetwork', 'PhraseStart', 'PhraseStepAway'];

const EMOJIS = ['😀', '😄', '😂', '😉', '😍', '🤔', '😅', '😭', '👍', '👏', '🙏', '👌', '👋', '🎉', '❤️', '🔥', '✅', '❌', '👀', '💪'];

const TIME_GAP_MS = 5 * 60 * 1000;
const DIRECTORY_WIDTH = 248;
const CHAT_MIN_WIDTH = 280;

const messageStamp = item => Date.parse(item?.createdAt || '') || Number(item?.sentAt) || 0;

const formatChatTime = (value, formatMessage, locale) => {
  const time = dayjs(value);
  if (!time.isValid()) {
    return '';
  }
  const clock = time.format('HH:mm');
  const now = dayjs();
  if (time.isSame(now, 'day')) {
    return clock;
  }
  if (time.isSame(now.subtract(1, 'day'), 'day')) {
    return formatMessage({ id: 'TimeYesterday' }, { time: clock });
  }
  if (time.isSame(now, 'year')) {
    return locale === 'en-US' ? time.format('MMM D HH:mm') : time.format('M月D日 HH:mm');
  }
  return locale === 'en-US' ? time.format('MMM D, YYYY HH:mm') : time.format('YYYY年M月D日 HH:mm');
};

const RaiseHandSvg = props => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const RaiseHandIcon = () => <Icon component={RaiseHandSvg} />;

const raiseHandValue = message => {
  const value = message?.content?.value;
  if (message?.type === 'custom' && value && value.kind === 'raiseHand') {
    return value;
  }
  return null;
};

const ChatAttachment = ({ FilePreview, modal, isMobile, attachment }) => {
  const name = attachment.name || attachment.filename || attachment.id;
  if (attachment.kind !== 'image') {
    return (
      <button
        type="button"
        className={style['file-bar']}
        onClick={() => {
          modal({
            title: name,
            footer: null,
            width: isMobile ? '100%' : 860,
            children: <FilePreview id={String(attachment.id)} filename={name} />
          });
        }}
      >
        <PaperClipOutlined />
        <span className={style['file-name']}>{name}</span>
      </button>
    );
  }
  return (
    <FilePreview
      id={String(attachment.id)}
      filename={name}
      render={({ url }) => (
        <div className={style['file-image']}>
          <Image src={url} alt={name} preview />
        </div>
      )}
    />
  );
};

export const useIm = () => {
  const [snapshot, setSnapshot] = useState(getImState);
  useEffect(() => subscribeIm(setSnapshot), []);
  return snapshot;
};

const noticeText = message => {
  const content = message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (content && typeof content.value === 'string') {
    return content.value;
  }
  return '';
};

const noticePreview = (message, formatMessage) => {
  const hand = raiseHandValue(message);
  if (hand) {
    return formatMessage({ id: hand.raised ? 'HandRaised' : 'HandLowered' });
  }
  const value = message?.content && typeof message.content === 'object' ? message.content.value : null;
  const type = message?.type || message?.content?.type;
  if (value && typeof value === 'object' && value.id && (type === 'img' || type === 'image')) {
    return formatMessage({ id: 'ImageMessage' });
  }
  if (value && typeof value === 'object' && value.id && type === 'file') {
    return value.name || formatMessage({ id: 'FileMessage' });
  }
  if (value && value.kind === 'call') {
    return callRecordText(value, false, formatMessage);
  }
  const text = noticeText(message).replace(/\s+/g, ' ').trim();
  if (!text) {
    return formatMessage({ id: 'NewMessage' });
  }
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
};

const toNoticePayload = (source, formatMessage) => {
  if (!source) {
    return null;
  }
  if (source.message || source.seq != null) {
    const item = source.message || {};
    return {
      key: source.seq ?? item.id,
      id: item.id || source.seq,
      name: item.senderInfo?.name || item.sender?.nickname || source.name || formatMessage({ id: 'NewMessage' }),
      text: source.text || noticePreview(item, formatMessage),
      message: item
    };
  }
  return {
    key: source.id,
    id: source.id,
    name: source.name || formatMessage({ id: 'NewMessage' }),
    text: source.text || '',
    message: source.message || null
  };
};

export const ImNotice = withLocale(({ message, onNotify }) => {
  const { formatMessage } = useIntl();
  const { notice } = useIm();
  const call = useCall();
  const source = message !== undefined ? message : notice;
  const payload = useMemo(() => toNoticePayload(source, formatMessage), [source, formatMessage]);
  const shownKey = useRef(null);
  const onNotifyRef = useRef(onNotify);
  const [pile, setPile] = useState([]);
  const [noticeHover, setNoticeHover] = useState(false);
  onNotifyRef.current = onNotify;

  useEffect(() => {
    if (!payload || payload.key == null || payload.key === shownKey.current) {
      return;
    }
    shownKey.current = payload.key;
    if (onNotifyRef.current) {
      onNotifyRef.current(payload);
      setPile([]);
      return;
    }
    setPile(current => [{ id: payload.id, name: payload.name, text: payload.text }, ...current].slice(0, 3));
  }, [payload]);

  useEffect(() => {
    if (!pile.length || noticeHover || onNotifyRef.current) {
      return undefined;
    }
    const timer = window.setTimeout(() => setPile([]), 4500);
    return () => window.clearTimeout(timer);
  }, [pile, noticeHover]);

  const latest = pile[0];
  if (!latest || call.phase === 'incoming') {
    return null;
  }

  return (
    <div className={style['notice-anchor']} onMouseEnter={() => setNoticeHover(true)} onMouseLeave={() => setNoticeHover(false)}>
      <StackCard layers={Math.max(pile.length - 1, 0)} offset={8} offsetDirection="left-bottom" radius={10}>
        <div className={style['notice-card']}>
          <span className={style['notice-name']}>{latest.name}</span>
          <span className={style['notice-text']}>{latest.text}</span>
          <button type="button" className={style['notice-close']} aria-label="Close" onClick={() => setPile([])}>
            ×
          </button>
        </div>
      </StackCard>
    </div>
  );
});

export const ImUnreadButton = ({ count, className, icon, children, ...buttonProps }) => {
  const { unread } = useIm();
  const badgeCount = count === undefined ? unread : count;
  return (
    <Badge count={badgeCount} size="small" className={style['chat-badge']}>
      <Button className={className} icon={icon} {...buttonProps}>
        {children}
      </Button>
    </Badge>
  );
};

export const ImConnection = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset']
})(withLocale(({ remoteModules, sessionUrl, devApiHost, wsPath, apiBase, onNotify, showNotice = true, callUrl }) => {
  const [usePreset] = remoteModules;
  const { ajax } = usePreset();

  useEffect(() => retainIm(ajax, { sessionUrl, devApiHost, wsPath, apiBase }), [ajax, sessionUrl, devApiHost, wsPath, apiBase]);
  useEffect(() => {
    configureCall({ ajax, callUrl, send: sendImContent });
  }, [ajax, callUrl]);

  return (
    <>
      {showNotice ? <ImNotice onNotify={onNotify} /> : null}
      <CallOverlay placement="notice" />
    </>
  );
}));

const messageText = message => {
  const content = message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (content && typeof content.value === 'string') {
    return content.value;
  }
  return '';
};

const messageAttachment = message => {
  const content = message?.content;
  const value = content && typeof content === 'object' ? content.value : null;
  if (!value || typeof value !== 'object' || !value.id) {
    return null;
  }
  const type = message?.type || content?.type;
  if (type === 'img' || type === 'image' || type === 'file') {
    const mime = typeof value.mime === 'string' ? value.mime : '';
    return {
      ...value,
      kind: type === 'img' || type === 'image' || mime.startsWith('image/') ? 'image' : 'file'
    };
  }
  return null;
};

const Im = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset', 'components-core:FilePreview', 'components-core:Modal@useModal']
})(withLocale(({
  remoteModules,
  className,
  avatarShape = 'circle',
  sessionUrl,
  devApiHost,
  wsPath,
  apiBase,
  uploadUrl = '/api/v1/static/upload',
  showPhrases = true,
  showEmoji = true,
  showImage = true,
  showFile = true,
  showRaiseHand = true,
  showVoiceCall = false,
  showVideoCall = false,
  features,
  callUrl,
  phrases,
  data,
  conversations,
  contacts,
  activeConversationId,
  onConversationSelect,
  onContactSelect
}) => {
  const [usePreset, FilePreview, useModal] = remoteModules;
  const { ajax } = usePreset();
  const { message } = App.useApp();
  const modal = useModal();
  const isMobile = useIsMobile();
  const rootRef = useRef(null);
  const [rootWidth, setRootWidth] = useState(0);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const imageRef = useRef(null);
  const { formatMessage, locale } = useIntl();
  const live = useIm();
  const preview = !!(data && Array.isArray(data.messages));
  const [previewMessages, setPreviewMessages] = useState(() => (preview ? data.messages : []));
  const propConversations = Array.isArray(conversations) ? conversations : null;
  const [openedConversations, setOpenedConversations] = useState([]);
  const conversationItems = useMemo(() => {
    if (!propConversations && openedConversations.length === 0) {
      return null;
    }
    const base = propConversations || [];
    const extras = openedConversations.filter(
      item =>
        !base.some(
          current =>
            String(current.id) === String(item.id) ||
            (item.contactId != null && current.contactId != null && String(current.contactId) === String(item.contactId))
        )
    );
    return [...extras, ...base];
  }, [propConversations, openedConversations]);
  const userMode = !preview && live.userMode;
  const directoryConversations = useMemo(() => {
    if (!conversationItems || !userMode) {
      return conversationItems;
    }
    return conversationItems
      .map(item => {
        const id = String(item.id);
        const last = live.lastMessages[id];
        const next = { ...item };
        if (live.conversationUnread[id] != null) {
          next.unread = live.conversationUnread[id];
        }
        if (last) {
          next.preview = Number(last.status) === 1 ? formatMessage({ id: 'MessageRecalled' }) : noticePreview(last, formatMessage);
          next.time = formatChatTime(last.createdAt || last.sentAt, formatMessage, locale);
        }
        return { item: next, stamp: messageStamp(last) };
      })
      .sort((a, b) => b.stamp - a.stamp)
      .map(entry => entry.item);
  }, [conversationItems, userMode, live.lastMessages, live.conversationUnread, formatMessage, locale]);
  const contactItems = Array.isArray(contacts) ? contacts : null;
  const showDirectory = !!(conversationItems || contactItems);
  const [directoryTab, setDirectoryTab] = useState(conversationItems ? 'conversations' : 'contacts');
  const [pickedId, setPickedId] = useState(() => activeConversationId ?? conversationItems?.[0]?.id ?? null);
  const [pickedContactId, setPickedContactId] = useState(null);
  const [contactKeyword, setContactKeyword] = useState('');
  const [mobileChat, setMobileChat] = useState(false);
  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const update = () => setRootWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const activeId = activeConversationId != null && activeConversationId !== '' ? activeConversationId : pickedId;
  const messages = preview ? previewMessages : live.messages;
  const memberId = preview ? data.memberId : live.memberId;
  const peerReadSeq = preview ? data.peerReadSeq : live.peerReadSeq;
  const ready = preview ? true : live.ready;
  const historyLoaded = preview ? true : live.historyLoaded;
  const connectError = preview ? '' : live.connectError;
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const call = useCall();
  const customPhrases = Array.isArray(phrases) && phrases.length > 0 ? phrases : null;
  const featureOn = (key, fallback) => (features && Object.prototype.hasOwnProperty.call(features, key) ? !!features[key] : fallback);
  const phrasesOn = featureOn('phrases', showPhrases);
  const emojiOn = featureOn('emoji', showEmoji);
  const imageOn = featureOn('image', showImage);
  const fileOn = featureOn('file', showFile);
  const handOn = featureOn('raiseHand', showRaiseHand);
  const voiceOn = featureOn('voiceCall', showVoiceCall);
  const videoOn = featureOn('videoCall', showVideoCall);
  const selfIds = new Set();
  if (memberId) {
    selfIds.add(String(memberId));
    selfIds.add(`guest_${memberId}`);
  }
  if (userMode && live.userId) {
    selfIds.add(String(live.userId));
  }
  const onlineIdSet = new Set((live.onlineUsers || []).map(user => String(user?.userId || '')).filter(id => id && !selfIds.has(id)));
  // 用户级连接的在线列表跨会话合并，判断对端在线只能看该会话的成员
  const conversationPeerOnline = id => {
    const target = (live.conversations || []).find(item => String(item.id) === String(id));
    return !!target && (target.members || []).some(member => !selfIds.has(String(member.userId)) && (onlineIdSet.has(String(member.userId)) || onlineIdSet.has(`guest_${member.id}`)));
  };
  const peerOnline = preview || (userMode ? conversationPeerOnline(live.conversationId) : onlineIdSet.size > 0);
  const personOnline = (item, conversation) => {
    if (!item) {
      return false;
    }
    if (typeof item.online === 'boolean') {
      return item.online;
    }
    if (conversation && userMode && conversationPeerOnline(item.id)) {
      return true;
    }
    if (conversation && String(item.id) === String(activeId) && peerOnline) {
      return true;
    }
    const ids = conversation ? [item.userId, item.contactId, item.memberId] : [item.userId, item.contactId, item.memberId, item.id];
    return ids.some(id => id != null && id !== '' && onlineIdSet.has(String(id)));
  };
  const callTitle = kind => formatMessage({ id: ready && !peerOnline ? 'CallPeerOffline' : kind });

  useEffect(() => {
    if (!preview) {
      return;
    }
    setPreviewMessages(Array.isArray(data.messages) ? data.messages : []);
  }, [preview, data]);
  useEffect(() => {
    if (preview) {
      return undefined;
    }
    return retainIm(ajax, { sessionUrl, devApiHost, wsPath, apiBase });
  }, [preview, ajax, sessionUrl, devApiHost, wsPath, apiBase]);
  useEffect(() => {
    if (preview) {
      return undefined;
    }
    setImChatOpen(true);
    return () => setImChatOpen(false);
  }, [preview]);
  useEffect(() => {
    if (!preview) {
      setImConversation(activeId ?? '');
    }
  }, [preview, activeId]);
  const followRef = useRef(null);
  followRef.current = { activeId, conversationItems, onConversationSelect };
  useEffect(() => {
    const { activeId: current, conversationItems: items, onConversationSelect: onSelect } = followRef.current;
    if (!userMode || !live.conversationId || String(live.conversationId) === String(current ?? '')) {
      return;
    }
    // 来电会把连接切到来电会话，列表选中跟随
    setPickedId(live.conversationId);
    const target = (items || []).find(item => String(item.id) === String(live.conversationId));
    if (target && onSelect) {
      onSelect(target);
    }
  }, [userMode, live.conversationId]);
  useEffect(() => {
    const next = { ajax, callUrl, send: sendImContent };
    if (preview) {
      next.preview = true;
      next.onRecord = content => {
        setPreviewMessages(current => [
          ...current,
          {
            id: `mock-${Date.now()}`,
            seq: Date.now(),
            senderId: data.memberId,
            sender: { nickname: data.memberName || '' },
            type: 'custom',
            content,
            status: 0,
            createdAt: new Date().toISOString()
          }
        ]);
      };
    }
    configureCall(next);
    const epoch = next.previewEpoch;
    return () => {
      if (!preview) {
        return;
      }
      endPreviewCall();
      configureCall({ preview: false, onRecord: null, previewEpoch: epoch });
    };
  }, [ajax, callUrl, preview, data]);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const displayItems = useMemo(() => {
    const items = [];
    let previousStamp = 0;
    messages.forEach(item => {
      if (isCallSignal(item)) {
        return;
      }
      const stamp = messageStamp(item);
      if (!previousStamp || (stamp && stamp - previousStamp >= TIME_GAP_MS)) {
        const label = formatChatTime(stamp || item.createdAt, formatMessage, locale);
        if (label) {
          items.push({ kind: 'time', key: `time-${item.id}`, label });
        }
      }
      if (stamp) {
        previousStamp = stamp;
      }
      const mine = String(item.senderId) === String(memberId || '');
      const senderName = item.senderInfo?.name || item.sender?.nickname || '';
      if (Number(item.status) === 1) {
        items.push({
          kind: 'recall',
          key: `recall-${item.id}`,
          label: mine ? formatMessage({ id: 'RecalledMine' }) : formatMessage({ id: 'RecalledOther' }, { name: senderName || formatMessage({ id: 'NewMessage' }) })
        });
        return;
      }
      const attachment = messageAttachment(item);
      const hand = raiseHandValue(item);
      const record = item?.type === 'custom' && item?.content?.value?.kind === 'call' ? item.content.value : null;
      let content = messageText(item);
      if (record) {
        const text = callRecordText(record, mine, formatMessage);
        content = (
          <div className={classnames(style['call-record'], mine && style['is-mine'])}>
            {record.media === 'video' ? <VideoCameraOutlined /> : <PhoneOutlined className={style['phone-call']} />}
            <span>{text}</span>
          </div>
        );
      } else if (hand) {
        content = <div className={style['hand-message']}>{formatMessage({ id: hand.raised ? 'HandRaised' : 'HandLowered' })}</div>;
      } else if (attachment) {
        content = <ChatAttachment FilePreview={FilePreview} modal={modal} isMobile={isMobile} attachment={attachment} />;
      } else {
        content = <div className={style['text']}>{content}</div>;
      }
      items.push({
        kind: 'message',
        key: item.id,
        id: item.id,
        mine,
        name: senderName,
        initial: (senderName || '?').slice(0, 1),
        avatar: item.senderInfo?.avatar || item.sender?.avatar || '',
        content,
        hand: !!hand,
        unread: mine && Number(item.seq || 0) > Number(peerReadSeq || 0)
      });
    });
    return items;
  }, [messages, memberId, peerReadSeq, FilePreview, modal, isMobile, formatMessage, locale]);

  const handRaised = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const item = messages[index];
      if (String(item.senderId) !== String(memberId || '') || Number(item.status) === 1) {
        continue;
      }
      const hand = raiseHandValue(item);
      if (hand) {
        return !!hand.raised;
      }
    }
    return false;
  }, [messages, memberId]);

  const sendContent = (type, content) => {
    if (preview) {
      setPreviewMessages(current => [
        ...current,
        {
          id: `mock-${Date.now()}`,
          seq: Date.now(),
          senderId: data.memberId,
          sender: { nickname: data.memberName || '' },
          type,
          content,
          status: 0,
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }
    const sent = sendImContent(type, content);
    if (!sent) {
      message.error(formatMessage({ id: 'ConnectFailed' }));
      throw new Error('socket');
    }
  };

  const sendText = value => {
    const text = String(value || '').trim();
    if (!text) {
      return;
    }
    sendContent('text', { type: 'text', value: text });
  };

  const uploadFile = async (file, asImage) => {
    if (!file) {
      return;
    }
    const mime = file.type || '';
    if (asImage && mime && !mime.startsWith('image/')) {
      message.error(formatMessage({ id: 'ImageOnly' }));
      return;
    }
    setUploading(true);
    try {
      const { data: body } = await ajax.postForm({
        url: uploadUrl,
        data: { file }
      });
      const record = body?.data;
      if (!body || body.code !== 0 || !record?.id) {
        message.error(body?.msg || formatMessage({ id: 'UploadFailed' }));
        return;
      }
      const recordMime = record.mimetype || mime;
      const isImage = asImage || recordMime.startsWith('image/');
      sendContent(isImage ? 'img' : 'file', {
        type: isImage ? 'img' : 'file',
        value: {
          id: record.id,
          name: record.filename || file.name,
          mime: recordMime
        }
      });
    } catch (error) {
      if (error?.message !== 'socket') {
        message.error(formatMessage({ id: 'UploadFailed' }));
      }
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
      if (imageRef.current) {
        imageRef.current.value = '';
      }
    }
  };

  const phraseItems = customPhrases
    ? customPhrases.map(text => ({ key: text, label: text }))
    : PHRASE_IDS.map(id => ({ key: id, label: formatMessage({ id }) }));

  const toolbarItems = [
    phrasesOn
      ? {
          key: 'phrases',
          render: () => (
            <Dropdown
              disabled={!ready || uploading}
              trigger={['click']}
              menu={{
                items: phraseItems,
                onClick: ({ key }) => sendText(customPhrases ? key : formatMessage({ id: key }))
              }}
            >
              <Tooltip title={formatMessage({ id: 'Phrases' })}>
                <Button type="text" size="small" icon={<CommentOutlined />} disabled={!ready || uploading} />
              </Tooltip>
            </Dropdown>
          )
        }
      : null,
    emojiOn
      ? {
          key: 'emoji',
          render: () => (
            <Popover
              open={emojiOpen}
              onOpenChange={setEmojiOpen}
              trigger="click"
              placement="topLeft"
              content={
                <div className={style['emoji-panel']}>
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={style['emoji-item']}
                      disabled={!ready}
                      onClick={() => {
                        sendText(emoji);
                        setEmojiOpen(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              }
            >
              <Tooltip title={formatMessage({ id: 'Emoji' })}>
                <Button type="text" size="small" icon={<SmileOutlined />} disabled={!ready || uploading} />
              </Tooltip>
            </Popover>
          )
        }
      : null,
    handOn
      ? {
          key: 'hand',
          render: () => (
            <Tooltip title={formatMessage({ id: handRaised ? 'LowerHand' : 'RaiseHand' })}>
              <Button
                type="text"
                size="small"
                className={handRaised ? style['hand-active'] : undefined}
                icon={<RaiseHandIcon />}
                disabled={!ready}
                onClick={() =>
                  sendContent('custom', {
                    type: 'custom',
                    value: { kind: 'raiseHand', raised: !handRaised }
                  })
                }
              />
            </Tooltip>
          )
        }
      : null,
    imageOn
      ? {
          key: 'image',
          title: formatMessage({ id: 'SendImage' }),
          icon: <PictureOutlined />,
          disabled: !ready || uploading,
          onClick: () => imageRef.current && imageRef.current.click()
        }
      : null,
    fileOn
      ? {
          key: 'file',
          title: formatMessage({ id: 'SendFile' }),
          icon: <PaperClipOutlined />,
          disabled: !ready || uploading,
          onClick: () => fileRef.current && fileRef.current.click()
        }
      : null,
    voiceOn
      ? {
          key: 'voice',
          title: callTitle('VoiceCall'),
          icon: <PhoneOutlined className={style['phone-call']} />,
          disabled: !ready || !peerOnline || call.phase !== 'idle',
          onClick: async () => {
            const ok = await startCall({ media: 'voice' });
            if (!ok) {
              message.error(formatMessage({ id: 'CallFailed' }));
            }
          }
        }
      : null,
    videoOn
      ? {
          key: 'video',
          title: callTitle('VideoCall'),
          icon: <VideoCameraOutlined />,
          disabled: !ready || !peerOnline || call.phase !== 'idle',
          onClick: async () => {
            const ok = await startCall({ media: 'video' });
            if (!ok) {
              message.error(formatMessage({ id: 'CallFailed' }));
            }
          }
        }
      : null
  ].filter(Boolean);

  const selectConversation = item => {
    setPickedId(item.id);
    setDirectoryTab('conversations');
    setMobileChat(true);
    if (onConversationSelect) {
      onConversationSelect(item);
    }
  };
  const selectContact = item => {
    setPickedContactId(item.id);
    setMobileChat(true);
  };
  const messageContact = item => {
    const matched = conversationItems && conversationItems.find(conversation => String(conversation.id) === String(item.id) || String(conversation.contactId) === String(item.id));
    const result = onContactSelect ? onContactSelect(item) : null;
    if (matched) {
      selectConversation(matched);
      return;
    }
    if (result && typeof result.then === 'function') {
      result.then(
        conversation => {
          if (!conversation || conversation.id == null) {
            return;
          }
          setOpenedConversations(current => [conversation, ...current.filter(entry => String(entry.id) !== String(conversation.id))]);
          selectConversation(conversation);
        },
        () => {}
      );
      return;
    }
    const created = {
      id: item.id,
      contactId: item.id,
      name: item.name,
      avatar: item.avatar,
      preview: ''
    };
    setOpenedConversations(current => [created, ...current.filter(conversation => String(conversation.contactId) !== String(item.id))]);
    selectConversation(created);
  };
  const directoryTabOn = conversationItems && contactItems ? directoryTab : conversationItems ? 'conversations' : 'contacts';
  const selectedContact = contactItems && contactItems.find(item => String(item.id) === String(pickedContactId));
  const showContactPane = showDirectory && directoryTabOn === 'contacts';
  const contactKeywordText = contactKeyword.trim().toLowerCase();
  const visibleContacts = useMemo(() => {
    if (!contactItems) {
      return [];
    }
    if (!contactKeywordText) {
      return contactItems;
    }
    return contactItems.filter(item => {
      const name = String(item.name || '').toLowerCase();
      const remark = String(item.remark || '').toLowerCase();
      return name.includes(contactKeywordText) || remark.includes(contactKeywordText);
    });
  }, [contactItems, contactKeywordText]);
  const directoryRows = directoryTabOn === 'contacts' ? visibleContacts : directoryConversations || [];
  const activeConversation = (conversationItems || []).find(item => String(item.id) === String(activeId));
  const stacked = showDirectory && (isMobile || (rootWidth > 0 && rootWidth < DIRECTORY_WIDTH + CHAT_MIN_WIDTH));
  const hideDirectory = stacked && mobileChat;
  const hideChat = stacked && !mobileChat;

  return (
    <div
      ref={rootRef}
      className={classnames(style['root'], avatarShape === 'rounded' && style['is-avatar-rounded'], className)}
      style={{ '--im-directory-width': `${DIRECTORY_WIDTH}px`, '--im-chat-min': `${CHAT_MIN_WIDTH}px` }}
    >
      {showDirectory ? (
        <aside className={classnames(style['directory'], stacked && style['is-fill'], hideDirectory && style['is-hidden'])}>
          {conversationItems && contactItems ? (
            <div className={style['directory-tabs']}>
              <button type="button" className={classnames(directoryTabOn === 'conversations' && style['is-active'])} onClick={() => setDirectoryTab('conversations')}>
                {formatMessage({ id: 'Conversations' })}
              </button>
              <button type="button" className={classnames(directoryTabOn === 'contacts' && style['is-active'])} onClick={() => setDirectoryTab('contacts')}>
                {formatMessage({ id: 'Contacts' })}
              </button>
            </div>
          ) : (
            <div className={style['directory-title']}>{formatMessage({ id: directoryTabOn === 'contacts' ? 'Contacts' : 'Conversations' })}</div>
          )}
          {directoryTabOn === 'contacts' ? (
            <div className={style['directory-search']}>
              <Input
                allowClear
                size="small"
                prefix={<SearchOutlined />}
                value={contactKeyword}
                placeholder={formatMessage({ id: 'SearchContacts' })}
                onChange={event => setContactKeyword(event.target.value)}
              />
            </div>
          ) : null}
          <div className={style['directory-list']}>
            {directoryRows.length === 0 ? (
              <div className={style['directory-empty']}>
                {formatMessage({ id: directoryTabOn === 'contacts' ? (contactKeywordText ? 'NoContactMatch' : 'NoContacts') : 'NoConversations' })}
              </div>
            ) : null}
            {directoryRows.map(item => {
              const active = directoryTabOn === 'contacts' ? String(item.id) === String(pickedContactId) : String(item.id) === String(activeId);
              return (
                <button key={item.id} type="button" className={classnames(style['directory-item'], active && style['is-active'])} onClick={() => (directoryTabOn === 'contacts' ? selectContact(item) : selectConversation(item))}>
                  <span className={style['directory-avatar']}>{item.avatar ? <img src={item.avatar} alt="" /> : (item.name || '?').slice(0, 1)}</span>
                  <span className={style['directory-body']}>
                    <span className={style['directory-line']}>
                      <span className={style['directory-name']}>{item.name}</span>
                      <span className={classnames(style['presence'], personOnline(item, directoryTabOn === 'conversations') ? style['is-online'] : style['is-offline'])}>
                        <i className={style['presence-dot']} aria-hidden />
                        {formatMessage({ id: personOnline(item, directoryTabOn === 'conversations') ? 'Online' : 'Offline' })}
                      </span>
                      {directoryTabOn === 'conversations' && item.time ? <span className={style['directory-time']}>{item.time}</span> : null}
                    </span>
                    {directoryTabOn === 'conversations' ? (
                      <span className={style['directory-line']}>
                        <span className={style['directory-preview']}>{item.preview || item.remark || ''}</span>
                        {item.unread > 0 ? <span className={style['directory-unread']}>{item.unread > 99 ? '99+' : item.unread}</span> : null}
                      </span>
                    ) : item.remark ? (
                      <span className={style['directory-preview']}>{item.remark}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      ) : null}
      <div className={classnames(style['chat'], !stacked && showDirectory && style['is-split'], stacked && style['is-fill'], hideChat && style['is-hidden'])}>
      {stacked ? (
        <div className={style['chat-back-bar']}>
          <button type="button" className={style['chat-back']} aria-label={formatMessage({ id: 'Back' })} onClick={() => setMobileChat(false)}>
            <LeftOutlined className={style['chat-back-icon']} />
            <span>{formatMessage({ id: 'Back' })}</span>
          </button>
          {showContactPane && selectedContact ? (
            <span className={classnames(style['presence'], personOnline(selectedContact) ? style['is-online'] : style['is-offline'])}>
              <i className={style['presence-dot']} aria-hidden />
              {formatMessage({ id: personOnline(selectedContact) ? 'Online' : 'Offline' })}
            </span>
          ) : null}
          {!showContactPane && activeConversation ? (
            <span className={classnames(style['presence'], personOnline(activeConversation, true) ? style['is-online'] : style['is-offline'])}>
              <i className={style['presence-dot']} aria-hidden />
              {formatMessage({ id: personOnline(activeConversation, true) ? 'Online' : 'Offline' })}
            </span>
          ) : null}
        </div>
      ) : null}
      <CallOverlay placement="panel" />
      {showContactPane ? (
        <div className={style['contact-card']}>
          {selectedContact ? (
            <>
              <div className={style['contact-avatar']}>{selectedContact.avatar ? <img src={selectedContact.avatar} alt="" /> : (selectedContact.name || '?').slice(0, 1)}</div>
              <div className={style['contact-name']}>{selectedContact.name}</div>
              <span className={classnames(style['presence'], personOnline(selectedContact) ? style['is-online'] : style['is-offline'])}>
                <i className={style['presence-dot']} aria-hidden />
                {formatMessage({ id: personOnline(selectedContact) ? 'Online' : 'Offline' })}
              </span>
              {selectedContact.remark ? <div className={style['contact-remark']}>{selectedContact.remark}</div> : null}
              <Button type="primary" className={style['contact-message']} onClick={() => messageContact(selectedContact)}>
                {formatMessage({ id: 'SendMessage' })}
              </Button>
            </>
          ) : (
            <div className={style['contact-empty']}>{formatMessage({ id: 'PickContact' })}</div>
          )}
        </div>
      ) : null}
      {!showContactPane && !ready ? (
        <div className={style['status']}>
          {connectError && connectError !== 'failed' ? connectError : connectError ? formatMessage({ id: 'ConnectFailed' }) : formatMessage({ id: 'Connecting' })}
        </div>
      ) : null}
      <div className={style['list']} ref={listRef}>
        {userMode && !activeId ? (
          <div className={style['empty']}>{formatMessage({ id: 'PickConversation' })}</div>
        ) : ready && historyLoaded && messages.length === 0 ? (
          <div className={style['empty']}>{formatMessage({ id: 'Empty' })}</div>
        ) : null}
        {displayItems.map(item => {
          if (item.kind === 'time') {
            return (
              <div key={item.key} className={style['time']}>
                {item.label}
              </div>
            );
          }
          if (item.kind === 'recall') {
            return (
              <div key={item.key} className={style['recall']}>
                {item.label}
              </div>
            );
          }
          return (
            <div key={item.key} className={classnames(style['message'], item.mine && style['is-mine'], isMobile && style['is-touch'])}>
              <div className={style['avatar']}>{item.avatar ? <img src={item.avatar} alt="" /> : item.initial}</div>
              <div className={style['main']}>
                {item.name ? <div className={style['name']}>{item.name}</div> : null}
                <div className={style['bubble-line']}>
                  {item.unread ? (
                    <div className={style['meta']}>
                      <button
                        type="button"
                        className={style['revoke-btn']}
                        onClick={() => {
                          if (preview) {
                            setPreviewMessages(current => current.map(messageItem => (String(messageItem.id) === String(item.id) ? { ...messageItem, status: 1 } : messageItem)));
                            return;
                          }
                          if (!revokeImMessage(item.id)) {
                            message.error(formatMessage({ id: 'ConnectFailed' }));
                          }
                        }}
                      >
                        {formatMessage({ id: 'Recall' })}
                      </button>
                      <span className={style['unread-dot']} />
                    </div>
                  ) : null}
                  <div className={classnames(style['bubble'], item.hand && style['hand-bubble'])}>{item.content}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {imageOn ? (
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          hidden
          onChange={event => {
            uploadFile(event.target.files && event.target.files[0], true);
          }}
        />
      ) : null}
      {fileOn ? (
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={event => {
            uploadFile(event.target.files && event.target.files[0], false);
          }}
        />
      ) : null}
      <div className={style['composer']}>
        <MessageInput
          showVoice={false}
          borderType="default"
          placeholder={formatMessage({ id: 'Placeholder' })}
          disabled={!ready || (userMode && !activeId)}
          loading={uploading}
          toolbarItems={toolbarItems}
          onSend={sendText}
        />
      </div>
      </div>
    </div>
  );
}));

export default Im;
