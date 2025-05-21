import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button, App } from 'antd';
import { useContext } from '../context';
import style from './style.module.scss';

const Toolbar = createWithRemoteLoader({
  modules: ['components-core:Icon', 'components-core:LoadingButton']
})(({ remoteModules }) => {
  const [Icon, LoadingButton] = remoteModules;
  const { isInvitationAllowed, actions, setting, setSetting } = useContext();
  const { message } = App.useApp();
  return (
    <>
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
          <Icon type={setting.microphoneOpen ? 'icon-maikefengyikaiqi' : 'icon-maikefengyiguanbi'} className="iconfont-ai" size={28} />
          <div className={style['item-text']}>麦克风</div>
        </Flex>
      </LoadingButton>
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
          <Icon type={setting.cameraOpen ? 'icon-shexiangtouyikaiqi' : 'icon-shexiangtouyiguanbi'} className="iconfont-ai" size={28} />
          <div className={style['item-text']}>摄像头</div>
        </Flex>
      </LoadingButton>
      <LoadingButton
        className={style['toolbar-item']}
        type="text"
        onClick={async () => {
          await actions.shareScreen();
        }}
      >
        <Flex vertical align="center" justify="center">
          <Icon type="icon-share-screen" className="iconfont-ai" size={28} />
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
            <Icon type="icon-huiyichengyuan" className="iconfont-ai" size={28} />
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
          <Icon type="icon-zhonglian" className="iconfont-ai" size={28} />
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
          <Icon type="icon-liaotian" className="iconfont-ai" size={28} />
          <div className={style['item-text']}>聊天</div>
        </Flex>
      </Button>
    </>
  );
});

export default Toolbar;
