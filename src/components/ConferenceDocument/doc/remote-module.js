const { default: ConferenceDocument } = _ConferenceDocument;
const { default: preset } = _mockPreset;
const { createWithRemoteLoader } = remoteLoader;
const { Flex } = antd;

const BaseExample = createWithRemoteLoader({
  modules: ['components-core:Global@PureGlobal']
})(({ remoteModules }) => {
  const [PureGlobal] = remoteModules;
  return (
    <PureGlobal preset={preset}>
      <Flex vertical gap={16}>
        <div style={{ color: '#999', fontSize: 12 }}>
          远程模块模式需要配置有效的远程模块路径，此示例展示组件的调用方式
        </div>
        <div style={{ height: 400 }}>
          <ConferenceDocument
            type="remote-module"
            module="components-example:CustomDocument"
            moduleProps={{
              conferenceStep: 'waiting',
              customProp: '示例数据'
            }}
            getSpeechInput={onSpeechInput => {
              console.log('已注册语音输入回调');
            }}
            onSpeechStart={() => console.log('语音识别开始')}
            onSpeechEnd={() => console.log('语音识别结束')}
            getEndConferenceCallback={callback => {
              console.log('已注册会议结束回调');
            }}
          />
        </div>
      </Flex>
    </PureGlobal>
  );
});

render(<BaseExample />);
