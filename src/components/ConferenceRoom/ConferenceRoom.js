import Layout from './Layout';
import Toolbar from './Toolbar';
import { Provider } from './context';
import Window from './Window';
import useControlValue from '@kne/use-control-value';
import { ResponsiveProvider, RESPONSIVE_CONTAINER_CLASS, useIsMobile } from '@kne/responsive-utils';
import get from 'lodash/get';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MOBILE_LAYOUT_TYPES = [2, 4];
const DEFAULT_MOBILE_LAYOUT_TYPE = 4;

const readContainerWidth = el => {
  if (!el || typeof el.clientWidth !== 'number') {
    return undefined;
  }
  const deviceScroll = el.closest('.example-driver-device-scroll');
  if (deviceScroll && deviceScroll.clientWidth > 0) {
    return deviceScroll.clientWidth;
  }
  const boundary = el.parentElement && el.parentElement.closest('.kne-responsive-boundary');
  if (boundary && boundary.clientWidth > 0) {
    return boundary.clientWidth;
  }
  return el.clientWidth;
};

const ConferenceRoomInner = ({
  className,
  conference,
  list = [],
  document,
  isMaster,
  isInvitationAllowed,
  devices,
  headerExtra,
  onBack,
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
  const isMobile = useIsMobile();
  const settingLayoutType = get(conference, 'options.setting.layoutType');
  const [setting, setSetting] = useControlValue({
    ...props,
    defaultValue: Object.assign(
      {},
      defaultValue,
      settingLayoutType && {
        layoutType: settingLayoutType
      }
    )
  });

  useEffect(() => {
    if (!isMobile || MOBILE_LAYOUT_TYPES.indexOf(setting.layoutType) !== -1) {
      return;
    }
    setSetting(current => Object.assign({}, current, { layoutType: DEFAULT_MOBILE_LAYOUT_TYPE }));
  }, [isMobile, setting.layoutType, setSetting]);

  return (
    <Provider
      value={{
        isInvitationAllowed,
        isMaster,
        actions,
        conference,
        devices,
        setting,
        setSetting,
        isMobile
      }}
    >
      <Layout
        toolbar={<Toolbar />}
        signalLevel={signalLevel}
        className={className}
        name={conference.name}
        startTime={conference.startTime}
        duration={conference.duration}
        isMobile={isMobile}
        headerExtra={headerExtra}
        onBack={onBack}
      >
        <Window list={list} document={document} layoutType={setting.layoutType} documentInside={setting.documentInside} isMobile={isMobile} />
      </Layout>
    </Provider>
  );
};

const ConferenceRoom = props => {
  const rootRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState();

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const update = () => {
      const width = readContainerWidth(el);
      if (typeof width === 'number' && width > 0) {
        setContainerWidth(width);
      }
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const deviceScroll = el.closest('.example-driver-device-scroll');
    if (deviceScroll) {
      resizeObserver.observe(deviceScroll);
    }
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={RESPONSIVE_CONTAINER_CLASS} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <ResponsiveProvider mode={typeof containerWidth === 'number' ? 'container' : 'viewport'} containerWidth={containerWidth}>
        <ConferenceRoomInner {...props} />
      </ResponsiveProvider>
    </div>
  );
};

export default ConferenceRoom;
