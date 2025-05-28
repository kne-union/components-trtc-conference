import { useEffect, useState } from 'react';
import { createWithRemoteLoader } from '@kne/remote-loader';
import { Splitter, Row, Col, Flex, Button } from 'antd';
import localStorage from '@kne/local-storage';
import classnames from 'classnames';
import { useContext } from '../context';
import style from './style.module.scss';

const LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES';
const LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES';
const LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES = 'LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES';

const WindowItem = createWithRemoteLoader({
  modules: ['components-core:Common@useResize', 'components-core:Icon']
})(({ remoteModules, className, children, base = 'width', isSingle, ratio = 9 / 16, onMainView }) => {
  const [useResize, Icon] = remoteModules;
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const ref = useResize(dom => {
    setHeight(Math.ceil(dom.clientWidth * ratio));
    setWidth(Math.ceil(dom.clientHeight / ratio));
  });
  return (
    <div
      ref={ref}
      className={classnames(style['window-item'], className, {
        [style['window-item-single']]: isSingle,
        [style['window-item-main']]: isSingle
      })}
      style={
        base === 'width'
          ? {
              '--height': height ? `${height}px` : 'auto'
            }
          : {
              '--width': width ? `${width}px` : 'auto'
            }
      }
    >
      {children}
      {onMainView && (
        <Flex gap={8} className={style['window-tools']}>
          <Button
            type="text"
            ghost
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

const GridList = createWithRemoteLoader({
  modules: ['components-core:Common@SimpleBar']
})(({ remoteModules, list }) => {
  const [SimpleBar] = remoteModules;
  return (
    <SimpleBar className={style['list']}>
      <Flex align="center" justify="center" flex={1}>
        <Row wrap gutter={[12, 12]} className={style['list-row']}>
          {list.map(({ view, index }) => {
            return (
              <Col span={list.length >= 3 ? 8 : Math.round(24 / list.length)} key={index}>
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

  const listPanel = (
    <Splitter.Panel collapsible size={sizes[type === 'top' ? 0 : 1]}>
      <SimpleBar className={style['vertical-scroller']}>
        <Flex gap={12} className={style['vertical-content']}>
          {childrenList.map(({ view, index }) => {
            return (
              <WindowItem isSingle={list.length === 1} key={index} base="height" onMainView={() => onMainView(index)}>
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
      <div
        className={classnames(style['window-item'], style['window-item-main'])}
        style={{
          '--width': '100%',
          '--height': '100%'
        }}
      >
        {mainItem.view}
      </div>
    </Splitter.Panel>
  );
  return (
    <Splitter
      layout="vertical"
      className={style['window-list']}
      onResize={sizes => {
        localStorage.setItem(`${LEAPIN_VIDEO_CONFERENCE_WINDOW_VERTICAL_SIZES}_${type.toUpperCase()}`, sizes);
        setSizes(sizes);
      }}
    >
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

  const listPanel = (
    <Splitter.Panel collapsible className={style['horizontal-scroller-outer']} size={sizes[type === 'left' ? 0 : 1]}>
      <div className={style['horizontal-scroller-inner']}>
        <SimpleBar className={style['horizontal-scroller']}>
          <Flex gap={12} vertical className={style['horizontal-content']}>
            {childrenList.map(({ view, index }) => {
              return (
                <WindowItem isSingle={list.length === 1} key={index} base="width" onMainView={() => onMainView(index)}>
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
      <div
        className={classnames(style['window-item'], style['window-item-main'])}
        style={{
          '--width': '100%',
          '--height': '100%'
        }}
      >
        {mainItem.view}
      </div>
    </Splitter.Panel>
  );

  return (
    <Splitter
      className={style['window-list']}
      onResize={sizes => {
        localStorage.setItem(`${LEAPIN_VIDEO_CONFERENCE_WINDOW_HORIZONTAL_SIZES}_${type.toUpperCase()}`, sizes);
        setSizes(sizes);
      }}
    >
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

const WindowList = ({ layoutType, list, document }) => {
  const { setting, setSetting } = useContext();
  const windowList = document ? [<div className={style['document-item']}>{document}</div>, ...list] : list;
  const newList = windowList.map((view, index) => {
    return {
      view,
      index
    };
  });

  const [mainItem] = newList.splice(setting.mainIndex, 1);
  const currentList = [Object.assign({}, { index: setting.mainIndex, view: null }, mainItem), ...newList];

  useEffect(() => {
    if (!mainItem) {
      setSetting(setting => Object.assign({}, setting, { mainIndex: 0 }));
    }
  }, [mainItem, setSetting]);

  const WindowInner = currentList.length < 2 ? GridList : layoutTypeMap[layoutType] || GridList;
  return (
    <WindowInner
      list={currentList}
      onMainView={index => {
        setSetting(setting => {
          return Object.assign({}, setting, { mainIndex: index });
        });
      }}
    />
  );
};

const Window = ({ layoutType, documentInside = true, document, list = [] }) => {
  const [sizes, setSizes] = useState(localStorage.getItem(LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES) || ['50%', '50%']);
  if (!document) {
    return (
      <div className={classnames(style['window-outer'], style['only-list'])}>
        <WindowList layoutType={layoutType} list={list} />
      </div>
    );
  }

  if (document && layoutType !== 1 && documentInside) {
    return (
      <div className={classnames(style['window-outer'], style['only-list'])}>
        <WindowList layoutType={layoutType} list={list} document={document} />
      </div>
    );
  }
  return (
    <Splitter
      className={style['window-outer']}
      onResize={sizes => {
        localStorage.setItem(LEAPIN_VIDEO_CONFERENCE_WINDOW_SIZES, sizes);
        setSizes(sizes);
      }}
    >
      <Splitter.Panel size={sizes[0]} collapsible>
        <div className={style['document-item']}>{document}</div>
      </Splitter.Panel>
      <Splitter.Panel size={sizes[1]} collapsible>
        <WindowList layoutType={layoutType} list={list} />
      </Splitter.Panel>
    </Splitter>
  );
};

export default Window;
