import { Flex, Row, Col } from 'antd';
import useControlValue from '@kne/use-control-value';
import classnames from 'classnames';
import style from './style.module.scss';
import { forwardRef, useImperativeHandle } from 'react';

const GridType = () => {
  return (
    <Row wrap gutter={[2, 2]} className={style['type-container']}>
      {Array.from({ length: 9 }).map((item, index) => {
        return (
          <Col key={index} span={8}>
            <div className={style['type-item']} />
          </Col>
        );
      })}
    </Row>
  );
};

const TopListType = () => {
  return (
    <Flex gap={2} vertical className={style['type-container']}>
      <div>
        <Row gutter={2}>
          {Array.from({ length: 3 }).map((item, index) => {
            return (
              <Col span={8} key={index}>
                <div className={style['type-item']} />
              </Col>
            );
          })}
        </Row>
      </div>
      <Flex flex={1}>
        <div className={style['type-item']} style={{ width: '100%', height: '100%' }} />
      </Flex>
    </Flex>
  );
};

const LeftListType = () => {
  return (
    <Flex gap={2} className={style['type-container']}>
      <Flex flex={1}>
        <div className={style['type-item']} style={{ width: '100%', height: '100%' }} />
      </Flex>
      <Flex gap={2} vertical>
        {Array.from({ length: 3 }).map((item, index) => {
          return <div key={index} className={style['type-item']} style={{ width: '100px' }} />;
        })}
      </Flex>
    </Flex>
  );
};

const BottomListType = () => {
  return (
    <Flex gap={2} vertical className={style['type-container']}>
      <Flex flex={1}>
        <div className={style['type-item']} style={{ width: '100%', height: '100%' }} />
      </Flex>
      <div>
        <Row gutter={2}>
          {Array.from({ length: 3 }).map((item, index) => {
            return (
              <Col span={8} key={index}>
                <div className={style['type-item']} />
              </Col>
            );
          })}
        </Row>
      </div>
    </Flex>
  );
};

const LayoutType = forwardRef((props, ref) => {
  const [value, onChange] = useControlValue(
    Object.assign(
      {},
      {
        defaultValue: 1
      },
      props
    )
  );
  const list = [
    {
      label: '网格',
      children: <GridType />
    },
    {
      label: '顶部成员列表',
      children: <TopListType />
    },
    {
      label: '左侧成员列表',
      children: <LeftListType />
    },
    {
      label: '底部成员列表',
      children: <BottomListType />
    }
  ];

  useImperativeHandle(ref, () => {
    return { value, onChange };
  });
  return (
    <Row wrap>
      {list.map((item, index) => {
        return (
          <Col
            span={8}
            key={index}
            className={style['layout-item-outer']}
            onClick={() => {
              onChange(index + 1);
            }}
          >
            <Flex
              vertical
              className={classnames(style['layout-item'], {
                [style['is-active']]: value === index + 1
              })}
            >
              {item.children}
            </Flex>
            <Flex
              className={classnames(style['layout-label'], {
                [style['is-active']]: value === index + 1
              })}
              justify="center"
            >
              {item.label}
            </Flex>
          </Col>
        );
      })}
    </Row>
  );
});

export default LayoutType;
