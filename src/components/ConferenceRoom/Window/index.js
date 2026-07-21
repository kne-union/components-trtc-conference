import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createWithRemoteLoader } from '@kne/remote-loader';
import { Splitter, Row, Col, Flex, Button } from 'antd';
import localStorage from '@kne/local-storage';
import classnames from 'classnames';
import { useIsMobile } from '@kne/responsive-utils';
import { useContext } from '../context';
import style from './style.module.scss';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES';
const LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES';
const LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES';
const LEAPIN_VIDEO_CONFERENCE_WINDOW_MOBILE_LIST_SIZE = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_MOBILE_LIST_SIZE_V3';
const MOBILE_MEMBER_PANEL_MARGIN = 16;
const MOBILE_MEMBER_CONTENT_PADDING_LEFT = 8;
const MOBILE_MEMBER_CONTENT_PADDING_RIGHT = 8;
const MOBILE_MEMBER_CONTENT_PADDING_VERTICAL = 16;
const MOBILE_MEMBER_SCROLL_EDGE_TOLERANCE = 4;

const getMobileListPlacement = layoutType => {
  return layoutType === 2 ? 'top' : 'bottom';
};

const clampMobileListSize = size => {
  return Math.max(72, Math.min(size, Math.floor((typeof window === 'undefined' ? 640 : window.innerHeight) * 0.45)));
};

const getDefaultMobileListSize = containerWidth => {
  if (typeof window === 'undefined') {
    return 128;
  }
  const outerWidth = containerWidth || window.innerWidth;
  const availableItemWidth = Math.max(
    outerWidth - MOBILE_MEMBER_PANEL_MARGIN - MOBILE_MEMBER_CONTENT_PADDING_LEFT - MOBILE_MEMBER_CONTENT_PADDING_RIGHT,
    120
  );
  return Math.max(72, Math.ceil((availableItemWidth * 9) / 16 + MOBILE_MEMBER_CONTENT_PADDING_VERTICAL));
};

const WindowItem = createWithRemoteLoader({
  modules: ['components-core:Icon']
})(({ remoteModules, className, children, base = 'width', isSingle, ratio = 9 / 16, onMainView }) => {
  const [Icon] = remoteModules;
  const itemRef = useRef(null);
  const [sizeStyle, setSizeStyle] = useState(() => {
    if (isSingle) {
      return {
        '--single-width': '100%',
        '--single-height': '100%'
      };
    }
    return {};
  });

  const updateSize = useCallback(
    dom => {
      if (!dom) {
        return;
      }
      const parent = dom.parentElement;
      if (!parent) {
        return;
      }

      // 多人网格：交由 CSS width:100% + aspect-ratio，避免 JS 固定高度偶发不更新
      if (!isSingle && base === 'width') {
        setSizeStyle(current => (Object.keys(current).length ? {} : current));
        return;
      }

      if (isSingle) {
        const containerWidth = parent.clientWidth;
        const containerHeight = parent.clientHeight;
        if (!containerWidth || !containerHeight) {
          return;
        }
        const nextHeight = Math.min(Math.ceil(containerWidth * ratio), containerHeight);
        const nextWidth = Math.min(containerWidth, Math.ceil(containerHeight / ratio));
        setSizeStyle(current => {
          const next = {
            '--single-width': `${nextWidth}px`,
            '--single-height': `${nextHeight}px`
          };
          return current['--single-width'] === next['--single-width'] && current['--single-height'] === next['--single-height'] ? current : next;
        });
        return;
      }

      const containerHeight = parent.clientHeight;
      if (!containerHeight) {
        return;
      }
      const nextWidth = `${Math.ceil(containerHeight / ratio)}px`;
      setSizeStyle(current => (current['--width'] === nextWidth ? current : { '--width': nextWidth }));
    },
    [base, isSingle, ratio]
  );

  const setItemRef = useCallback(
    dom => {
      itemRef.current = dom;
      if (dom) {
        updateSize(dom);
      }
    },
    [updateSize]
  );

  useLayoutEffect(() => {
    const dom = itemRef.current;
    if (!dom) {
      return;
    }

    const onResize = () => {
      updateSize(dom);
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    let current = dom.parentElement;
    let depth = 0;
    while (current && depth < 10) {
      resizeObserver?.observe(current);
      if (current.classList?.contains(style['window-outer']) || current.classList?.contains(style['list'])) {
        break;
      }
      current = current.parentElement;
      depth += 1;
    }

    window.addEventListener('resize', onResize);
    onResize();
    // 布局稳定后再量一次，覆盖 SimpleBar / Splitter 延迟撑开的情况
    const rafId = window.requestAnimationFrame(onResize);
    const timerId = window.setTimeout(onResize, 100);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [updateSize]);

  return (
    <div
      ref={setItemRef}
      className={classnames(style['window-item'], className, {
        [style['window-item-single']]: isSingle,
        [style['window-item-main']]: isSingle,
        [style['window-item-grid']]: !isSingle && base === 'width'
      })}
      style={sizeStyle}
    >
      {children}
      {onMainView && (
        <Flex gap={8} className={style['window-tools']}>
          <Button
            type="text"
            size="small"
            icon={<Icon type="icon-quanping" fontClassName="iconfont-ai" />}
            onClick={() => {
              onMainView();
            }}
          />
        </Flex>
      )}
    </div>
  );
});

const MainWindowItem = ({ children, className }) => {
  return (
    <div
      className={classnames(style['window-item'], style['window-item-main'], className)}
      style={{
        '--width': '100%',
        '--height': '100%'
      }}>
      {children}
    </div>
  );
};

const MobileMemberItem = withLocale(({ children, Icon, onMainView }) => {
  const { formatMessage } = useIntl();
  return (
    <div className={classnames(style['window-item'], style['mobile-member-item'], 'mobile-member-item')}>
      {children}
      <Flex gap={8} className={style['window-tools']}>
        <Button
          type="text"
          size="small"
          aria-label={formatMessage({ id: 'SwitchToMainWindow' })}
          icon={<Icon type="icon-quanping" fontClassName="iconfont-ai" />}
          onClick={() => {
            onMainView();
          }}
        />
      </Flex>
    </div>
  );
});

const MobileList = createWithRemoteLoader({
  modules: ['components-core:Common@SimpleBar', 'components-core:Icon']
})(withLocale(({ remoteModules, layoutType, list, onMainView }) => {
  const [SimpleBar, Icon] = remoteModules;
  const { formatMessage } = useIntl();
  const placement = getMobileListPlacement(layoutType);
  const childrenList = list.slice(1),
    mainItem = list[0];
  const mobileListRef = useRef(null);
  const memberSimpleBarRef = useRef(null);
  const memberContentRef = useRef(null);
  const listSizeRef = useRef(128);
  const hasStoredListSizeRef = useRef(false);
  const [listSize, setListSize] = useState(() => {
    const storageSize = Number(localStorage.getItem(LEAPIN_VIDEO_CONFERENCE_WINDOW_MOBILE_LIST_SIZE));
    hasStoredListSizeRef.current = Number.isFinite(storageSize) && storageSize > 0;
    return hasStoredListSizeRef.current ? clampMobileListSize(storageSize) : getDefaultMobileListSize();
  });
  const [collapsed, setCollapsed] = useState(false);
  const activeTimerRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const [scrollState, setScrollState] = useState({ canPrev: false, canNext: false });

  listSizeRef.current = listSize;

  const keepActive = useCallback(() => {
    setIsActive(true);
    if (activeTimerRef.current) {
      window.clearTimeout(activeTimerRef.current);
    }
    activeTimerRef.current = window.setTimeout(() => {
      setIsActive(false);
    }, 5000);
  }, []);

  const getMemberScrollElement = useCallback(() => {
    return memberSimpleBarRef.current;
  }, []);

  const getMemberItems = useCallback(() => {
    if (!memberContentRef.current) {
      return [];
    }
    return Array.from(memberContentRef.current.querySelectorAll('.mobile-member-item'));
  }, []);

  const updateScrollState = useCallback(() => {
    const scrollElement = getMemberScrollElement();
    if (!scrollElement || childrenList.length <= 1 || collapsed) {
      setScrollState({ canPrev: false, canNext: false });
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
    const maxScrollLeft = Math.max(scrollWidth - clientWidth, 0);
    setScrollState({
      canPrev: scrollLeft > MOBILE_MEMBER_SCROLL_EDGE_TOLERANCE,
      canNext: scrollLeft < maxScrollLeft - MOBILE_MEMBER_SCROLL_EDGE_TOLERANCE
    });
  }, [childrenList.length, collapsed, getMemberScrollElement]);

  useEffect(() => {
    if (hasStoredListSizeRef.current || !mobileListRef.current) {
      return;
    }
    const nextSize = getDefaultMobileListSize(mobileListRef.current.clientWidth);
    listSizeRef.current = nextSize;
    setListSize(nextSize);
  }, []);

  useEffect(() => {
    keepActive();
    document.addEventListener('click', keepActive);
    document.addEventListener('touchstart', keepActive, { passive: true });
    return () => {
      document.removeEventListener('click', keepActive);
      document.removeEventListener('touchstart', keepActive);
      if (activeTimerRef.current) {
        window.clearTimeout(activeTimerRef.current);
      }
    };
  }, [keepActive]);

  useEffect(() => {
    if (collapsed || childrenList.length <= 1) {
      setScrollState({ canPrev: false, canNext: false });
      return;
    }
    let scrollElement;
    let onScroll;
    const timer = window.setTimeout(() => {
      scrollElement = getMemberScrollElement();
      if (!scrollElement) {
        return;
      }
      updateScrollState();
      onScroll = () => {
        keepActive();
        updateScrollState();
      };
      scrollElement.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', updateScrollState);
    });
    return () => {
      window.clearTimeout(timer);
      scrollElement && onScroll && scrollElement.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [childrenList.length, collapsed, keepActive, listSize, getMemberScrollElement, updateScrollState]);

  const scrollToMember = useCallback(
    direction => {
      keepActive();
      const scrollElement = getMemberScrollElement();
      const items = getMemberItems();
      if (!scrollElement || items.length === 0) {
        return;
      }
      const scrollRect = scrollElement.getBoundingClientRect();
      const target =
        direction === 'next'
          ? items.find(item => item.getBoundingClientRect().right > scrollRect.right + MOBILE_MEMBER_SCROLL_EDGE_TOLERANCE)
          : items
              .slice()
              .reverse()
              .find(item => item.getBoundingClientRect().left < scrollRect.left - MOBILE_MEMBER_SCROLL_EDGE_TOLERANCE);
      if (!target) {
        return;
      }
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: direction === 'next' ? 'start' : 'end'
      });
      window.setTimeout(updateScrollState, 300);
    },
    [getMemberItems, getMemberScrollElement, keepActive, updateScrollState]
  );

  const onResizeStart = event => {
    event.preventDefault();
    keepActive();
    const startY = event.touches ? event.touches[0].clientY : event.clientY;
    const startSize = listSizeRef.current;
    const onResizeMove = moveEvent => {
      moveEvent.preventDefault();
      const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const distance = placement === 'top' ? currentY - startY : startY - currentY;
      const nextSize = clampMobileListSize(startSize + distance);
      listSizeRef.current = nextSize;
      setListSize(nextSize);
      localStorage.setItem(LEAPIN_VIDEO_CONFERENCE_WINDOW_MOBILE_LIST_SIZE, nextSize);
    };
    const onResizeEnd = () => {
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
      document.removeEventListener('touchmove', onResizeMove);
      document.removeEventListener('touchend', onResizeEnd);
    };

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchmove', onResizeMove, { passive: false });
    document.addEventListener('touchend', onResizeEnd);
  };

  if (!mainItem) {
    return null;
  }

  return (
    <div
      ref={mobileListRef}
      className={classnames(style['mobile-window-list'], style[`mobile-window-list-${placement}`], {
        [style['is-active']]: isActive
      })}
      onClick={keepActive}
      onTouchStart={keepActive}>
      <MainWindowItem key={mainItem.key} className={style['mobile-main-item']}>
        {mainItem.view}
      </MainWindowItem>
      {childrenList.length > 0 && (
        <div
          className={classnames(style['mobile-member-panel'], style[`mobile-member-panel-${placement}`], {
            [style['is-collapsed']]: collapsed
          })}
          style={{ '--mobile-member-list-size': collapsed ? '0px' : `${listSize}px` }}>
          {!collapsed && <button type="button" className={style['mobile-resize-handle']} onMouseDown={onResizeStart} onTouchStart={onResizeStart} />}
          <Button
            type="text"
            size="small"
            aria-label={collapsed ? formatMessage({ id: 'ExpandMemberList' }) : formatMessage({ id: 'CollapseMemberList' })}
            icon={<Icon type={collapsed ? 'icon-arrow-thin-up' : 'icon-arrow-thin-down'} />}
            className={style['mobile-collapse-btn']}
            onClick={() => {
              keepActive();
              setCollapsed(collapsed => !collapsed);
            }}
          />
          {!collapsed && (
            <>
              {scrollState.canPrev && (
                <Button
                  type="text"
                  size="small"
                  aria-label={formatMessage({ id: 'ViewPrevMemberWindow' })}
                  icon={<Icon type="icon-arrow-thin-left" />}
                  className={classnames(style['mobile-scroll-btn'], style['mobile-scroll-btn-prev'])}
                  onClick={() => scrollToMember('prev')}
                />
              )}
              <SimpleBar className={style['mobile-member-scroller']} scrollableNodeProps={{ ref: memberSimpleBarRef }}>
                <Flex
                  ref={memberContentRef}
                  gap={8}
                  className={classnames(style['mobile-member-content'], {
                    [style['has-scroll-end-padding']]: childrenList.length > 1
                  })}
                  style={{
                    '--mobile-member-list-height': `${listSize}px`
                  }}>
                  {childrenList.map(({ view, key }) => {
                    return (
                      <MobileMemberItem key={key} Icon={Icon} onMainView={() => onMainView(key)}>
                        {view}
                      </MobileMemberItem>
                    );
                  })}
                </Flex>
              </SimpleBar>
              {scrollState.canNext && (
                <Button
                  type="text"
                  size="small"
                  aria-label={formatMessage({ id: 'ViewNextMemberWindow' })}
                  icon={<Icon type="icon-arrow-thin-right" />}
                  className={classnames(style['mobile-scroll-btn'], style['mobile-scroll-btn-next'])}
                  onClick={() => scrollToMember('next')}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}));

const GridList = createWithRemoteLoader({
  modules: ['components-core:Common@SimpleBar']
})(({ remoteModules, list }) => {
  const [SimpleBar] = remoteModules;
  return (
    <SimpleBar
      className={classnames(style['list'], {
        [style['list-single']]: list.length === 1
      })}
    >
      <Flex align="center" justify="center" flex={1} className={style['list-inner']}>
        <Row wrap gutter={[12, 12]} className={style['list-row']}>
          {list.map(({ view, key }) => {
            return (
              <Col span={list.length >= 3 ? 8 : Math.round(24 / list.length)} key={key}>
                <WindowItem isSingle={list.length === 1}>{view}</WindowItem>
              </Col>
            );
          })}
        </Row>
      </Flex>
    </SimpleBar>
  );
});

const VerticalList = createWithRemoteLoader({
  modules: ['components-core:Common@SimpleBar']
})(({ remoteModules, type, list, onMainView }) => {
  const [sizes, setSizes] = useState(
    localStorage.getItem(`${LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES}_${type.toUpperCase()}`) ||
      (type === 'top' ? ['20%', '80%'] : ['80%', '20%'])
  );
  const [SimpleBar] = remoteModules;
  const childrenList = list.slice(1),
    mainItem = list[0];

  if (!mainItem) {
    return null;
  }

  const listPanel = (
    <Splitter.Panel collapsible size={sizes[type === 'top' ? 0 : 1]}>
      <SimpleBar className={style['vertical-scroller']}>
        <Flex gap={12} className={style['vertical-content']}>
          {childrenList.map(({ view, key }) => {
            return (
              <WindowItem isSingle={list.length === 1} key={key} base="height" onMainView={() => onMainView(key)}>
                {view}
              </WindowItem>
            );
          })}
        </Flex>
      </SimpleBar>
    </Splitter.Panel>
  );
  const mainPanel = (
    <Splitter.Panel size={sizes[type === 'top' ? 1 : 0]}>
      <MainWindowItem key={mainItem.key}>{mainItem.view}</MainWindowItem>
    </Splitter.Panel>
  );
  return (
    <Splitter
      layout="vertical"
      className={style['window-list']}
      onResize={sizes => {
        localStorage.setItem(`${LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES}_${type.toUpperCase()}`, sizes);
        setSizes(sizes);
      }}>
      {type === 'top' ? (
        <>
          {listPanel}
          {mainPanel}
        </>
      ) : (
        <>
          {mainPanel}
          {listPanel}
        </>
      )}
    </Splitter>
  );
});

const HorizontalList = createWithRemoteLoader({
  modules: ['components-core:Common@SimpleBar']
})(({ remoteModules, list, type, onMainView }) => {
  const [sizes, setSizes] = useState(
    localStorage.getItem(`${LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES}_${type.toUpperCase()}`) ||
      (type === 'left' ? ['20%', '80%'] : ['80%', '20%'])
  );
  const [SimpleBar] = remoteModules;
  const childrenList = list.slice(1),
    mainItem = list[0];

  if (!mainItem) {
    return null;
  }

  const listPanel = (
    <Splitter.Panel collapsible className={style['horizontal-scroller-outer']} size={sizes[type === 'left' ? 0 : 1]}>
      <div className={style['horizontal-scroller-inner']}>
        <SimpleBar className={style['horizontal-scroller']}>
          <Flex gap={12} vertical className={style['horizontal-content']}>
            {childrenList.map(({ view, key }) => {
              return (
                <WindowItem isSingle={list.length === 1} key={key} base="width" onMainView={() => onMainView(key)}>
                  {view}
                </WindowItem>
              );
            })}
          </Flex>
        </SimpleBar>
      </div>
    </Splitter.Panel>
  );

  const mainPanel = (
    <Splitter.Panel size={sizes[type === 'left' ? 1 : 0]}>
      <MainWindowItem key={mainItem.key}>{mainItem.view}</MainWindowItem>
    </Splitter.Panel>
  );

  return (
    <Splitter
      className={style['window-list']}
      onResize={sizes => {
        localStorage.setItem(`${LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES}_${type.toUpperCase()}`, sizes);
        setSizes(sizes);
      }}>
      {type === 'left' ? (
        <>
          {listPanel}
          {mainPanel}
        </>
      ) : (
        <>
          {mainPanel}
          {listPanel}
        </>
      )}
    </Splitter>
  );
});

const TopList = props => {
  return <VerticalList {...props} type="top" />;
};

/*const LeftList = props => {
  return <HorizontalList {...props} type="left" />;
};*/

const RightList = props => {
  return <HorizontalList {...props} type="right" />;
};

const BottomList = props => {
  return <VerticalList {...props} type="bottom" />;
};

const layoutTypeMap = {
  1: GridList,
  2: TopList,
  3: RightList,
  4: BottomList
};

const normalizeWindowItem = (item, index) => {
  if (item && Object.prototype.hasOwnProperty.call(item, 'view')) {
    return Object.assign({ index, key: item.key || `window-${index}` }, item);
  }
  return {
    index,
    key: `window-${index}`,
    view: item
  };
};

const buildWindowList = (list, document) => {
  const sourceList = document ? [{ key: '__document__', view: <div className={style['document-item']}>{document}</div> }, ...list] : list;
  return sourceList.map(normalizeWindowItem);
};

const WindowList = ({ layoutType, list, document, isMobile }) => {
  const { setting, setSetting } = useContext();
  const normalizedList = buildWindowList(list, document);
  const mainWindowKey = setting.mainWindowKey;
  let mainItemIndex = Math.min(setting.mainIndex || 0, Math.max(normalizedList.length - 1, 0));
  if (mainWindowKey) {
    const matchedIndex = normalizedList.findIndex(item => item.key === mainWindowKey);
    if (matchedIndex >= 0) {
      mainItemIndex = matchedIndex;
    }
  }
  const mainItem = normalizedList[mainItemIndex];
  const currentList = mainItem
    ? [Object.assign({}, mainItem, { index: mainItemIndex }), ...normalizedList.filter((_, index) => index !== mainItemIndex)]
    : normalizedList;

  useEffect(() => {
    if (!mainItem) {
      setSetting(setting => Object.assign({}, setting, { mainIndex: 0, mainWindowKey: null }));
    }
  }, [mainItem, setSetting]);

  // 移动端特殊布局 = MobileList（主画面全屏 + 顶/底可折叠成员条）
  const WindowInner = isMobile ? MobileList : currentList.length < 2 ? GridList : layoutTypeMap[layoutType] || GridList;
  return (
    <WindowInner
      layoutType={layoutType}
      list={currentList}
      onMainView={windowKey => {
        setSetting(setting => {
          return Object.assign({}, setting, { mainWindowKey: windowKey, mainIndex: normalizedList.findIndex(item => item.key === windowKey) });
        });
      }}
    />
  );
};

const Window = ({ layoutType, documentInside = true, document, list = [], isMobile: isMobileProp }) => {
  const contextIsMobile = useIsMobile();
  const isMobile = typeof isMobileProp === 'boolean' ? isMobileProp : contextIsMobile;
  const [sizes, setSizes] = useState(() => {
    const stored = localStorage.getItem(LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES);
    // 面板被折叠过会把 0 持久化，导致之后每次进会文档面板都不可见，此时丢弃存储值
    if (!Array.isArray(stored) || stored.length !== 2 || stored.some(size => !(parseFloat(size) > 0))) {
      return ['20%', '80%'];
    }
    return stored;
  });

  if (!document) {
    return (
      <div className={classnames(style['window-outer'], style['only-list'], { [style['window-outer-mobile']]: isMobile })}>
        <WindowList layoutType={layoutType} list={list} isMobile={isMobile} />
      </div>
    );
  }

  // 与原先一致：非网格 + documentInside 时，文档作为窗口项进入列表。
  // 移动端因此会进 MobileList：文档/视频可切主画面，成员条才能出现；切换上下布局才有可见差异。
  if (layoutType !== 1 && documentInside) {
    return (
      <div className={classnames(style['window-outer'], style['only-list'], { [style['window-outer-mobile']]: isMobile })}>
        <WindowList layoutType={layoutType} list={list} document={document} isMobile={isMobile} />
      </div>
    );
  }

  // 文档外置时：移动端上下分栏，桌面端 Splitter
  if (isMobile) {
    return (
      <div className={classnames(style['window-outer'], style['mobile-document-layout'], style['window-outer-mobile'])}>
        <div className={style['mobile-document-panel']}>
          <div className={style['document-item']}>{document}</div>
        </div>
        <div className={style['mobile-window-panel']}>
          <WindowList layoutType={layoutType} list={list} isMobile={isMobile} />
        </div>
      </div>
    );
  }

  return (
    <Splitter
      className={style['window-outer']}
      onResize={sizes => {
        localStorage.setItem(LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES, sizes);
        setSizes(sizes);
      }}>
      <Splitter.Panel size={sizes[0]} collapsible>
        <div className={style['document-item']}>{document}</div>
      </Splitter.Panel>
      <Splitter.Panel size={sizes[1]} collapsible>
        <WindowList layoutType={layoutType} list={list} isMobile={isMobile} />
      </Splitter.Panel>
    </Splitter>
  );
};

export default Window;
