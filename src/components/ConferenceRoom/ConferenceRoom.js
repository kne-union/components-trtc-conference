import Layout from './Layout';
import Toolbar from './Toolbar';
import { Provider } from './context';
import Window from './Window';
import useControlValue from '@kne/use-control-value';

const ConferenceRoom = ({
  className,
  conference,
  list = [],
  document,
  isMaster,
  isInvitationAllowed,
  defaultValue = {
    layoutType: 1,
    mainIndex: 0,
    microphoneOpen: true,
    cameraOpen: true,
    documentInside: true
  },
  signalLevel = 3,
  actions,
  ...props
}) => {
  const [setting, setSetting] = useControlValue({ ...props, defaultValue });
  return (
    <Provider
      value={{
        isInvitationAllowed,
        isMaster,
        actions,
        conference,
        setting,
        setSetting
      }}
    >
      <Layout
        toolbar={<Toolbar />}
        signalLevel={signalLevel}
        className={className}
        name={conference.name}
        startTime={conference.startTime}
        duration={conference.duration}
      >
        <Window list={list} document={document} layoutType={setting.layoutType} documentInside={setting.documentInside} />
      </Layout>
    </Provider>
  );
};

export default ConferenceRoom;
