import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button, App, Dropdown } from 'antd';
import { CaretDownFilled } from '@ant-design/icons';
import { useContext as useRoomContext } from '../context';
import style from './style.module.scss';

const Toolbar = createWithRemoteLoader({
  modules: ['components-core:Icon', 'components-core:LoadingButton']
})(({ remoteModules }) => {
  const [Icon, LoadingButton] = remoteModules;
  const { isInvitationAllowed, actions, setting, setSetting, devices } = useRoomContext();
  const { message } = App.useApp();

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
          onClick={() => {
            setSetting(setting => {
              return Object.assign({}, setting, { microphoneOpen: !setting.microphoneOpen });
            });
          }}
        >
          <Flex vertical align="center" justify="center">
            <Icon type={setting.microphoneOpen ? 'icon-maikefengyikaiqi' : 'icon-maikefengyiguanbi'} fontClassName="iconfont-ai" size={28} />
            <div className={style['item-text']}>麦克风</div>
          </Flex>
        </LoadingButton>
        {microphoneList.length > 0 && (
          <Dropdown
            menu={{
              items: microphoneMenuItems,
              selectedKeys: [setting.microphoneId],
              onClick: ({ key }) => {
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
            setSetting(setting => {
              return Object.assign({}, setting, { cameraOpen: !setting.cameraOpen });
            });
          }}
        >
          <Flex vertical align="center" justify="center">
            <Icon type={setting.cameraOpen ? 'icon-shexiangtouyikaiqi' : 'icon-shexiangtouyiguanbi'} fontClassName="iconfont-ai" size={28} />
            <div className={style['item-text']}>摄像头</div>
          </Flex>
        </LoadingButton>
        {cameraList.length > 0 && (
          <Dropdown
            menu={{
              items: cameraMenuItems,
              selectedKeys: [setting.cameraId],
              onClick: ({ key }) => {
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
      <LoadingButton
        className={style['toolbar-item']}
        type="text"
        onClick={async () => {
          await actions.shareScreen();
        }}
      >
        <Flex vertical align="center" justify="center">
          <Icon type="icon-share-screen" fontClassName="iconfont-ai" size={28} />
          <div className={style['item-text']}>{setting.shareScreenOpen ? '停止分享' : '分享屏幕'}</div>
        </Flex>
      </LoadingButton>
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
            <div className={style['item-text']}>邀请</div>
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
          <div className={style['item-text']}>重连</div>
        </Flex>
      </Button>
      <Button
        className={style['toolbar-item']}
        type="text"
        onClick={() => {
          message.warning('功能开发中，敬请期待');
        }}
      >
        <Flex vertical align="center" justify="center">
          <Icon type="icon-liaotian" fontClassName="iconfont-ai" size={28} />
          <div className={style['item-text']}>聊天</div>
        </Flex>
      </Button>
    </>
  );
});

export default Toolbar;
