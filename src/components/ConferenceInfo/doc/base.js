const { default: ConferenceInfo } = _ConferenceInfo;
const { default: preset, mockConferenceList, mockUserInfo } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  const [current, setCurrent] = React.useState(1);

  return (
    <PureGlobal preset={preset}>
      <div style={{ '--box-width': '100%' }}>
        <ConferenceInfo
          user={mockUserInfo}
          current={current}
          pageSize={20}
          onPageChange={({ currentPage }) => setCurrent(currentPage)}
          getDetailUrl={item => `/conference/detail?id=${item.id}`}
          data={mockConferenceList}
          reload={() => {}}
          apis={preset.apis.conference}
          actions={{
            remove: ({ id }) => console.log('删除会议', id),
            getMemberShorten: item => Promise.resolve({ shorten: 'shorten-' + item.id })
          }}
        />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
