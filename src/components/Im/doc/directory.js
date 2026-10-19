const { default: Im } = _Im;
const { default: preset, mockIm } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { useState } = React;

const threads = {
  group: mockIm,
  li: {
    memberId: mockIm.memberId,
    memberName: mockIm.memberName,
    peerReadSeq: 1,
    messages: [
      {
        id: 'li-1',
        seq: 1,
        senderId: 'im-member-li',
        sender: { nickname: '李明辉' },
        type: 'text',
        content: { type: 'text', value: '方案我发你了，看完回我。' },
        status: 0,
        createdAt: new Date().toISOString()
      }
    ]
  }
};

const conversations = [
  { id: 'group', name: '产品需求评审', preview: '收到，我先看一下方案。', time: '10:24' },
  { id: 'li', name: '李明辉', preview: '方案我发你了，看完回我。', time: '09:12', unread: 2, contactId: 'im-member-li' }
];

const contacts = [
  { id: 'im-member-li', name: '李明辉', remark: '产品' },
  { id: 'im-member-wang', name: '王芳', remark: '设计' }
];

const emptyThread = () => ({
  memberId: mockIm.memberId,
  memberName: mockIm.memberName,
  peerReadSeq: 0,
  messages: []
});

const DirectoryExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [threadMap, setThreadMap] = useState(threads);
  const [activeId, setActiveId] = useState('group');
  const openConversation = item => {
    setThreadMap(current => {
      if (current[item.id]) {
        return current;
      }
      const next = Object.assign({}, current);
      next[item.id] = emptyThread();
      return next;
    });
    setActiveId(item.id);
  };
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 760, height: 560, maxWidth: '100%', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <Im
          data={threadMap[activeId]}
          conversations={conversations}
          contacts={contacts}
          activeConversationId={activeId}
          onConversationSelect={openConversation}
        />
      </div>
    </PureGlobal>
  );
});

render(<DirectoryExample />);
