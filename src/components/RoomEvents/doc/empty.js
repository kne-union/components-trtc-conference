const { default: RoomEvents } = _RoomEvents;
const { default: preset, mockConferenceList } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;

const conference = mockConferenceList.pageData[0];

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <div style={{ width: 860, maxWidth: '100%', margin: '0 auto', padding: 16 }}>
        <RoomEvents id={conference.id} name={conference.name} status={1} members={conference.members} events={[]} />
      </div>
    </PureGlobal>
  );
});

render(<BaseExample />);
