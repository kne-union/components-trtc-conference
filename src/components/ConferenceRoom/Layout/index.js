import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button } from 'antd';
import { Timer } from '@kne/count-down';
import Signal from './Signal';
import { useContext } from '../context';
import LayoutType from './LayoutType';
import style from './style.module.scss';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useEffect, useRef, useState } from 'react';

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
  const toolbarOuterRef = useRef(null);
  const toolbarInnerRef = useRef(null);
  const [toolbarScale, setToolbarScale] = useState(1);
  const renderLeaveButton = ({ mobile = false } = {}) =>
    isMaster ? (
      <ConfirmButton
        type="primary"
        danger
        size={mobile ? 'small' : undefined}
        okText="结束"
        message="结束会议后，其他人也将退出会议，如果只需要自己退出会议关掉页面即可"
        icon={<Icon type="icon-tuichuhuiyi" fontClassName="iconfont-ai" />}
        onClick={actions.end}
      >
        结束会议
      </ConfirmButton>
    ) : (
      <Button
        type="primary"
        danger
        size={mobile ? 'small' : undefined}
        icon={<Icon type="icon-tuichuhuiyi" fontClassName="iconfont-ai" />}
        onClick={actions.leave}
      >
        退出会议
      </Button>
    );

  useEffect(() => {
    const updateToolbarScale = () => {
      const outer = toolbarOuterRef.current;
      const inner = toolbarInnerRef.current;
      if (!outer || !inner || !window.matchMedia('(max-width: 768px)').matches) {
        setToolbarScale(1);
        return;
      }
      const outerWidth = outer.clientWidth;
      const innerWidth = inner.scrollWidth;
      setToolbarScale(innerWidth > outerWidth ? outerWidth / innerWidth : 1);
    };
    updateToolbarScale();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateToolbarScale) : null;
    toolbarOuterRef.current && resizeObserver?.observe(toolbarOuterRef.current);
    toolbarInnerRef.current && resizeObserver?.observe(toolbarInnerRef.current);
    window.addEventListener('resize', updateToolbarScale);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateToolbarScale);
    };
  }, [toolbar]);

  return (
    <>
      <Flex vertical className={classnames(style['layout'], className)}>
        <Flex className={style['header']} justify="space-between" align="center">
          <Flex align="center" justify="space-between" gap={8} className={style['mobile-title-row']}>
            <div className={style['mobile-name']}>{name}</div>
            <div className={style['mobile-leave-action']}>{renderLeaveButton({ mobile: true })}</div>
          </Flex>
          <Flex gap={8} align="center" className={style['header-info']}>
            <div className={style['name']}>{name}</div>
            <div className={style['timer']}>
              <Timer start={dayjs().diff(dayjs(startTime), 'second')} format="HH:mm:ss" />
            </div>
            <div>{Number.isInteger(signalLevel) && <Signal level={signalLevel} />}</div>
          </Flex>
          <Flex gap={4} align="center" className={style['header-actions']}>
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
          <div ref={toolbarOuterRef} className={style['toolbar-content-outer']}>
            <div ref={toolbarInnerRef} className={style['toolbar-content']} style={{ '--toolbar-scale': toolbarScale }}>
              {toolbar}
            </div>
          </div>
          <div className={style['toolbar-leave-action']}>{renderLeaveButton()}</div>
        </Flex>
      </Flex>
      <FontLoader path={`${fontAIPath}/iconfont.css`} />
    </>
  );
});

export default Layout;
export { LayoutType };
