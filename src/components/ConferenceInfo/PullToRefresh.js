import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import classnames from 'classnames';
import { useIntl } from '@kne/react-intl';
import style from './style.module.scss';

const PULL_THRESHOLD = 60;
const MAX_PULL_DISTANCE = 120;
const DAMPING = 0.4;

const PullToRefresh = ({ disabled, onRefresh, children }) => {
  const { formatMessage } = useIntl();
  const wrapperRef = useRef(null);
  const touchRef = useRef({ startY: 0, active: false });
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const [distance, setDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  onRefreshRef.current = onRefresh;
  distanceRef.current = distance;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (disabled || !wrapper) {
      return;
    }
    const touch = touchRef.current;
    const isScrollableContainer = node => {
      const { overflowY } = window.getComputedStyle(node);
      return (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
    };
    // 以最近的可滚动祖先为准（如手机预览的滚动容器），没有则回退到页面滚动根
    const isAtTop = () => {
      let node = wrapper;
      while (node && node !== document.body && node !== document.documentElement) {
        if (isScrollableContainer(node)) {
          return (node.scrollTop || 0) <= 0;
        }
        node = node.parentElement;
      }
      const scrollingElement = document.scrollingElement || document.documentElement;
      return (scrollingElement.scrollTop || 0) <= 0;
    };
    const handleTouchStart = e => {
      if (refreshingRef.current || !isAtTop()) {
        return;
      }
      touch.startY = e.touches[0].clientY;
      touch.active = true;
    };
    const handleTouchMove = e => {
      if (!touch.active || refreshingRef.current) {
        return;
      }
      const delta = e.touches[0].clientY - touch.startY;
      if (delta <= 0 || !isAtTop()) {
        setDistance(0);
        setPulling(false);
        return;
      }
      // 阻止页面原生滚动/回弹，让下拉距离完全由 transform 呈现
      if (e.cancelable) {
        e.preventDefault();
      }
      setPulling(true);
      setDistance(Math.min(delta * DAMPING, MAX_PULL_DISTANCE));
    };
    const handleTouchEnd = async () => {
      if (!touch.active) {
        return;
      }
      touch.active = false;
      setPulling(false);
      if (distanceRef.current >= PULL_THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setDistance(PULL_THRESHOLD);
        try {
          await onRefreshRef.current?.();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setDistance(0);
        }
      } else {
        setDistance(0);
      }
    };
    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd);
    wrapper.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
      wrapper.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled]);

  if (disabled) {
    return children;
  }

  return (
    <div ref={wrapperRef} className={style['pull-to-refresh']}>
      <div
        className={classnames(style['pull-to-refresh-inner'], { [style['is-resetting']]: !pulling })}
        style={{ transform: `translate3d(0, ${distance}px, 0)` }}
      >
        <div className={style['pull-to-refresh-indicator']}>
          {refreshing && <Spin size="small" />}
          <span>
            {formatMessage({
              id: refreshing ? 'PullToRefreshRefreshing' : distance >= PULL_THRESHOLD ? 'PullToRefreshRelease' : 'PullToRefreshPull'
            })}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
