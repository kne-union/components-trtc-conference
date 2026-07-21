import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button, Card } from 'antd';
import classnames from 'classnames';
import style from './style.module.scss';
import AddConference from './AddConference';
import { removeToken } from '@kne/token-storage';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';
import resolveAvatarProps from './resolveAvatarProps';

const MenuBar = createWithRemoteLoader({
  modules: [
    'components-core:Global@usePreset',
    'components-core:Icon',
    'components-core:Image',
    'LoadingButton',
    'components-admin:Authenticate@SaveUserInfo',
    'components-core:Modal@useModal'
  ]
})(withLocale(({ remoteModules, user, apis, reload, onDetailEnter }) => {
  const [usePreset, Icon, Image, LoadingButton, SaveUserInfo, useModal] = remoteModules;
  const { ajax } = usePreset();
  const modal = useModal();
  const { formatMessage } = useIntl();
  return (
    <Flex vertical gap={10} className={style['menu-bar']}>
      <Button
        className={style['menu-item']}
        type="primary"
        shape={'circle'}
        icon={
          <span className={style['avatar-edit']}>
            <Image.Avatar size={40} {...resolveAvatarProps(user.value.avatar)} />
            <span className={classnames(style['avatar-edit-icon'], style['avatar-edit-icon-small'])}>
              <Icon type="icon-bianji" size={10} />
            </span>
          </span>
        }
        onClick={() => {
          const modalApi = modal({
            title: formatMessage({ id: 'UserInfo' }),
            size: 'small',
            footer: null,
            children: (
              <Card className={classnames(style['current-user'], style['user-info-card'])}>
                <Flex vertical gap={12} align="center">
                  <SaveUserInfo>
                    {({ onClick }) => {
                      return (
                        <div
                          className={style['avatar-edit']}
                          onClick={() => {
                            modalApi.close();
                            onClick();
                          }}
                        >
                          <Image.Avatar size={100} {...resolveAvatarProps(user.value.avatar)} />
                          <span className={style['avatar-edit-icon']}>
                            <Icon type="icon-bianji" size={10} />
                          </span>
                        </div>
                      );
                    }}
                  </SaveUserInfo>
                  <div>{user.value.email}</div>
                  <div>{user.value.nickname}</div>
                  <Button
                    onClick={() => {
                      removeToken('X-User-Code');
                      removeToken('X-User-Token');
                      window.location.reload();
                    }}
                  >
                    {formatMessage({ id: 'Logout' })}
                  </Button>
                </Flex>
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
              <div className={style['menu-item-text']}>{formatMessage({ id: 'AddMeeting' })}</div>
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
                name: formatMessage({ id: 'QuickMeeting' }),
                startTime: new Date(),
                duration: 60 * 60,
                isInvitationAllowed: true,
                includingMe: true,
                options: { allowExtend: true, attention: formatMessage({ id: 'AttentionDefault' }) }
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
          <div className={style['menu-item-text']}>{formatMessage({ id: 'QuickMeeting' })}</div>
        </Flex>
      </LoadingButton>
      {/*<Button className={style['menu-item']} type="primary">
        <Flex vertical justify="center" align="center" gap={8}>
          <Icon type="icon-shezhi" size={20} />
          <div className={style['menu-item-text']}>{formatMessage({ id: 'Settings' })}</div>
        </Flex>
      </Button>*/}
    </Flex>
  );
}));

export default MenuBar;
