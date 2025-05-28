import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button } from 'antd';
import { Timer } from '@kne/count-down';
import Signal from './Signal';
import { useContext } from '../context';
import LayoutType from './LayoutType';
import style from './style.module.scss';
import dayjs from 'dayjs';

const Layout = createWithRemoteLoader({
  modules: [
    'components-core:Icon',
    'components-core:ConfirmButton',
    'components-core:Icon@FontLoader',
    'components-iconfont:FontAi@path',
    'components-core:Modal@useModal'
  ]
})(({ className, remoteModules, name = '在线会议', signalLevel, startTime, duration, toolbar, children }) => {
  const [Icon, ConfirmButton, FontLoader, fontAIPath, useModal] = remoteModules;
  const modal = useModal();
  const { isMaster, actions, setting, setSetting } = useContext();

  return (
    <>
      <Flex vertical className={className}>
        <Flex className={style['header']} justify="space-between">
          <Flex gap={8} align="center">
            <div className={style['name']}>{name}</div>
            <div className={style['timer']}>
              <Timer start={dayjs().diff(dayjs(startTime), 'second')} format="HH:mm:ss" />
            </div>
            <div>{Number.isInteger(signalLevel) && <Signal level={signalLevel} />}</div>
          </Flex>
          <Flex gap={4}>
            <Button
              type="text"
              size="small"
              icon={<Icon type="icon-chuangkoubinglie" fontClassName="iconfont-ai" />}
              onClick={() => {
                modal({
                  title: '切换布局',
                  children: ({ childrenRef }) => <LayoutType ref={childrenRef} defaultValue={setting.layoutType} />,
                  onConfirm: (e, { childrenRef }) => {
                    setSetting(setting => {
                      return {
                        ...setting,
                        layoutType: childrenRef.current.value
                      };
                    });
                  }
                });
              }}
            >
              布局
            </Button>
            <Button type="text" size="small" icon={<Icon type="icon-setting" fontClassName="iconfont-ai" />}>
              设置
            </Button>
          </Flex>
        </Flex>
        <div className={style['main']}>{children}</div>
        <Flex justify="space-between" align="center" className={style['toolbar']} gap={12}>
          <Flex justify="center" flex={1} gap={4}>
            {toolbar}
          </Flex>
          {isMaster ? (
            <ConfirmButton
              type="primary"
              danger
              okText="结束"
              message="结束会议后，其他人也将退出会议，如果只需要自己退出会议关掉页面即可"
              icon={<Icon type="icon-tuichuhuiyi" fontClassName="iconfont-ai" />}
              onClick={actions.end}
            >
              结束会议
            </ConfirmButton>
          ) : (
            <Button type="primary" danger icon={<Icon type="icon-tuichuhuiyi" fontClassName="iconfont-ai" />} onClick={actions.leave}>
              退出会议
            </Button>
          )}
        </Flex>
      </Flex>
      <FontLoader path={`${fontAIPath}/iconfont.css`} />
    </>
  );
});

export default Layout;
export { LayoutType };
