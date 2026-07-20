import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button, App, Dropdown } from 'antd';
import { CaretDownFilled } from '@ant-design/icons';
import { useIsMobile } from '@kne/responsive-utils';
import { useContext as useRoomContext } from '../context';
import style from './style.module.scss';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const Toolbar = createWithRemoteLoader({
  modules: ['components-core:Icon', 'components-core:LoadingButton']
})(withLocale(({ remoteModules }) => {
  const [Icon, LoadingButton] = remoteModules;
  const { isInvitationAllowed, actions, setting, setSetting, devices } = useRoomContext();
  const { message } = App.useApp();
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();

  const cameraList = devices?.cameras || [];
  const microphoneList = devices?.microphones || [];

  const cameraMenuItems = cameraList.map(device => ({
    key: device.deviceId,
    label: device.label || device.deviceId
  }));

  const microphoneMenuItems = microphoneList.map(device => ({
    key: device.deviceId,
    label: device.label || device.deviceId
  }));

  return (
    <>
      <div className={style['toolbar-item-wrapper']}>
        <LoadingButton
          className={style['toolbar-item']}
          type="text"
          onClick={async () => {
            const nextOpen = !setting.microphoneOpen;
            if (actions.setMicrophoneOpen) {
              await actions.setMicrophoneOpen(nextOpen);
              return;
            }
            setSetting(setting => Object.assign({}, setting, { microphoneOpen: nextOpen }));
          }}
        >
          <Flex vertical align="center" justify="center">
            <Icon type={setting.microphoneOpen ? 'icon-maikefengyikaiqi' : 'icon-maikefengyiguanbi'} fontClassName="iconfont-ai" size={28} />
            <div className={style['item-text']}>{formatMessage({ id: 'Microphone' })}</div>
          </Flex>
        </LoadingButton>
        {microphoneList.length > 0 && (
          <Dropdown
            menu={{
              items: microphoneMenuItems,
              selectedKeys: [setting.microphoneId],
              onClick: async ({ key }) => {
                if (actions.setMicrophoneId) {
                  await actions.setMicrophoneId(key);
                  return;
                }
                setSetting(setting => Object.assign({}, setting, { microphoneId: key }));
              }
            }}
            trigger={['click']}
          >
            <Button
              className={style['dropdown-arrow']}
              type="text"
              onClick={e => e.stopPropagation()}
            >
              <CaretDownFilled />
            </Button>
          </Dropdown>
        )}
      </div>
      <div className={style['toolbar-item-wrapper']}>
        <LoadingButton
          className={style['toolbar-item']}
          type="text"
          onClick={async () => {
            const nextOpen = !setting.cameraOpen;
            if (actions.setCameraOpen) {
              await actions.setCameraOpen(nextOpen);
              return;
            }
            setSetting(setting => Object.assign({}, setting, { cameraOpen: nextOpen }));
          }}
        >
          <Flex vertical align="center" justify="center">
            <Icon type={setting.cameraOpen ? 'icon-shexiangtouyikaiqi' : 'icon-shexiangtouyiguanbi'} fontClassName="iconfont-ai" size={28} />
            <div className={style['item-text']}>{formatMessage({ id: 'Camera' })}</div>
          </Flex>
        </LoadingButton>
        {cameraList.length > 0 && (
          <Dropdown
            menu={{
              items: cameraMenuItems,
              selectedKeys: [setting.cameraId],
              onClick: async ({ key }) => {
                if (actions.setCameraId) {
                  await actions.setCameraId(key);
                  return;
                }
                setSetting(setting => Object.assign({}, setting, { cameraId: key }));
              }
            }}
            trigger={['click']}
          >
            <Button
              className={style['dropdown-arrow']}
              type="text"
              onClick={e => e.stopPropagation()}
            >
              <CaretDownFilled />
            </Button>
          </Dropdown>
        )}
      </div>
      {!isMobile && (
        <LoadingButton
          className={style['toolbar-item']}
          type="text"
          onClick={async () => {
            await actions.shareScreen();
          }}
        >
          <Flex vertical align="center" justify="center">
            <Icon type="icon-share-screen" fontClassName="iconfont-ai" size={28} />
            <div className={style['item-text']}>{setting.shareScreenOpen ? formatMessage({ id: 'StopShare' }) : formatMessage({ id: 'ShareScreen' })}</div>
          </Flex>
        </LoadingButton>
      )}
      {isInvitationAllowed && (
        <LoadingButton
          className={style['toolbar-item']}
          type="text"
          onClick={async () => {
            await actions.invite();
          }}
        >
          <Flex vertical align="center" justify="center">
            <Icon type="icon-huiyichengyuan" fontClassName="iconfont-ai" size={28} />
            <div className={style['item-text']}>{formatMessage({ id: 'Invite' })}</div>
          </Flex>
        </LoadingButton>
      )}
      <Button
        className={style['toolbar-item']}
        type="text"
        onClick={() => {
          window.location.reload();
        }}
      >
        <Flex vertical align="center" justify="center">
          <Icon type="icon-zhonglian" fontClassName="iconfont-ai" size={28} />
          <div className={style['item-text']}>{formatMessage({ id: 'Reconnect' })}</div>
        </Flex>
      </Button>
      <Button
        className={style['toolbar-item']}
        type="text"
        onClick={() => {
          message.warning(formatMessage({ id: 'FeatureInDevelopment' }));
        }}
      >
        <Flex vertical align="center" justify="center">
          <Icon type="icon-liaotian" fontClassName="iconfont-ai" size={28} />
          <div className={style['item-text']}>{formatMessage({ id: 'Chat' })}</div>
        </Flex>
      </Button>
    </>
  );
}));

export default Toolbar;
