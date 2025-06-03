import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button, Card } from 'antd';
import style from './style.module.scss';
import AddConference from './AddConference';
import { removeToken } from '@kne/token-storage';

const MenuBar = createWithRemoteLoader({
  modules: [
    'components-core:Global@usePreset',
    'components-core:Icon',
    'components-core:Image',
    'LoadingButton',
    'components-admin:Authenticate@SaveUserInfo',
    'components-core:Modal@useModal'
  ]
})(({ remoteModules, user, apis, reload, onDetailEnter }) => {
  const [usePreset, Icon, Image, LoadingButton, SaveUserInfo, useModal] = remoteModules;
  const { ajax } = usePreset();
  const modal = useModal();
  return (
    <Flex vertical gap={10} className={style['menu-bar']}>
      <Button
        className={style['menu-item']}
        type="primary"
        shape={'circle'}
        icon={<Image.Avatar id={user.value.avatar} size={40} />}
        onClick={() => {
          const modalApi = modal({
            title: '用户信息',
            size: 'small',
            footer: null,
            children: (
              <Card className={style['current-user']}>
                <Flex vertical gap={12} align="center">
                  <Image.Avatar size={100} id={user.value.avatar} />
                  <div>{user.value.email}</div>
                  <div>{user.value.nickname}</div>
                  <Button
                    onClick={() => {
                      removeToken('X-User-Code');
                      removeToken('X-User-Token');
                      window.location.reload();
                    }}
                  >
                    退出登录
                  </Button>
                </Flex>
                <SaveUserInfo>
                  {({ onClick }) => {
                    return (
                      <Button
                        onClick={() => {
                          modalApi.close();
                          onClick();
                        }}
                        className={style['current-user-edit']}
                        size="small"
                        type="text"
                        icon={<Icon type="icon-bianji" />}
                      />
                    );
                  }}
                </SaveUserInfo>
              </Card>
            )
          });
        }}
      />
      <AddConference apis={apis} onSuccess={reload}>
        {({ onClick }) => (
          <Button className={style['menu-item']} type="primary" onClick={onClick}>
            <Flex vertical justify="center" align="center" gap={8}>
              <Icon type="icon-tianjia" size={20} />
              <div className={style['menu-item-text']}>添加会议</div>
            </Flex>
          </Button>
        )}
      </AddConference>
      <LoadingButton
        className={style['menu-item']}
        type="primary"
        onClick={async () => {
          const { data: resData } = await ajax(
            Object.assign({}, apis.create, {
              data: {
                name: '快速会议',
                startTime: new Date(),
                duration: 60,
                isInvitationAllowed: true,
                includingMe: true
              }
            })
          );
          if (resData.code !== 0) {
            return;
          }
          reload && reload(resData.data);
          onDetailEnter(resData.data.members[0]);
        }}
      >
        <Flex vertical justify="center" align="center" gap={8}>
          <Icon type="icon-fasongduihua" size={20} />
          <div className={style['menu-item-text']}>快速会议</div>
        </Flex>
      </LoadingButton>
      {/*<Button className={style['menu-item']} type="primary">
        <Flex vertical justify="center" align="center" gap={8}>
          <Icon type="icon-shezhi" size={20} />
          <div className={style['menu-item-text']}>设置</div>
        </Flex>
      </Button>*/}
    </Flex>
  );
});

export default MenuBar;
