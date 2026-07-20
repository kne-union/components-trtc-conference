import { createWithRemoteLoader } from '@kne/remote-loader';
import { Flex, Button } from 'antd';
import CountDown, { Timer } from '@kne/count-down';
import Signal from './Signal';
import { useContext } from '../context';
import LayoutType from './LayoutType';
import style from './style.module.scss';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useIsMobile } from '@kne/responsive-utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const Layout = createWithRemoteLoader({
  modules: [
    'components-core:Icon',
    'components-core:ConfirmButton',
    'components-core:Icon@FontLoader',
    'components-iconfont:FontAi@path',
    'components-core:Modal@useModal'
  ]
})(withLocale(({ className, remoteModules, name, signalLevel, startTime, duration, toolbar, children, isMobile: isMobileProp, headerExtra }) => {
  const [Icon, ConfirmButton, FontLoader, fontAIPath, useModal] = remoteModules;
  const modal = useModal();
  const contextIsMobile = useIsMobile();
  const isMobile = typeof isMobileProp === 'boolean' ? isMobileProp : contextIsMobile;
  const { isMaster, actions, setting, setSetting } = useContext();
  const { formatMessage } = useIntl();
  const displayName = name || formatMessage({ id: 'OnlineMeeting' });
  const toolbarOuterRef = useRef(null);
  const toolbarInnerRef = useRef(null);
  const [toolbarScale, setToolbarScale] = useState(1);
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const remainingSeconds = useMemo(() => {
    if (!startTime || !duration) {
      return null;
    }
    return Math.max(0, dayjs(startTime).add(duration, 'second').diff(dayjs(), 'second'));
  }, [startTime, duration]);

  useEffect(() => {
    if (!startTime || !duration) {
      setIsTimeWarning(false);
      return;
    }
    const endAt = dayjs(startTime).add(duration, 'second');
    const update = () => {
      const left = endAt.diff(dayjs(), 'second');
      setIsTimeWarning(left > 0 && left <= 15 * 60);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startTime, duration]);
  const renderLeaveButton = ({ mobile = false } = {}) =>
    isMaster ? (
      <ConfirmButton
        type="primary"
        danger
        size={mobile ? 'small' : undefined}
        okText={formatMessage({ id: 'End' })}
        message={formatMessage({ id: 'EndMeetingConfirm' })}
        icon={<Icon type="icon-tuichuhuiyi" fontClassName="iconfont-ai" />}
        onClick={actions.end}
      >
        {formatMessage({ id: 'EndMeeting' })}
      </ConfirmButton>
    ) : (
      <Button
        type="primary"
        danger
        size={mobile ? 'small' : undefined}
        icon={<Icon type="icon-tuichuhuiyi" fontClassName="iconfont-ai" />}
        onClick={actions.leave}
      >
        {formatMessage({ id: 'LeaveMeeting' })}
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
      <Flex vertical className={classnames(style['layout'], className, { [style['layout-mobile']]: isMobile })}>
        <Flex className={style['header']} justify="space-between" align="center">
          <Flex align="center" justify="space-between" gap={8} className={style['mobile-title-row']}>
            <Flex align="center" gap={8} className={style['mobile-name-wrap']}>
              <div className={style['mobile-name']}>{displayName}</div>
              {headerExtra ? <div className={style['header-extra-mobile']}>{headerExtra}</div> : null}
            </Flex>
            <div className={style['mobile-leave-action']}>{renderLeaveButton({ mobile: true })}</div>
          </Flex>
          <Flex gap={8} align="center" className={style['header-info']}>
            <div className={style['name']}>{displayName}</div>
            <div className={classnames(style['timer'], { [style['timer-warning']]: isTimeWarning })}>
              {remainingSeconds != null ? (
                <>
                  <span className={style['timer-label']}>{formatMessage({ id: 'RemainingTime' })}</span>
                  <span className={style['timer-value']}>
                    <CountDown key={`${startTime}-${duration}`} duration={remainingSeconds} format="HH:mm:ss" />
                  </span>
                </>
              ) : (
                <span className={style['timer-value']}>
                  <Timer start={dayjs().diff(dayjs(startTime), 'second')} format="HH:mm:ss" />
                </span>
              )}
            </div>
            {headerExtra ? <div className={style['header-extra']}>{headerExtra}</div> : null}
            <div>{Number.isInteger(signalLevel) && <Signal level={signalLevel} />}</div>
          </Flex>
          <Flex gap={4} align="center" className={style['header-actions']}>
            <Button
              type="text"
              size="small"
              icon={<Icon type="icon-chuangkoubinglie" fontClassName="iconfont-ai" />}
              onClick={() => {
                modal({
                  title: formatMessage({ id: 'SwitchLayout' }),
                  children: ({ childrenRef }) => (
                    <LayoutType ref={childrenRef} defaultValue={setting.layoutType} isMobile={isMobile} />
                  ),
                  onConfirm: (e, { childrenRef }) => {
                    setSetting(setting => {
                      return {
                        ...setting,
                        layoutType: childrenRef.current?.value
                      };
                    });
                  }
                });
              }}
            >
              {formatMessage({ id: 'Layout' })}
            </Button>
            <Button type="text" size="small" icon={<Icon type="icon-setting" fontClassName="iconfont-ai" />}>
              {formatMessage({ id: 'Settings' })}
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
}));

export default Layout;
export { LayoutType };
