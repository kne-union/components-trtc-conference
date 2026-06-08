import { Flex, Row, Col } from 'antd';
import useControlValue from '@kne/use-control-value';
import classnames from 'classnames';
import style from './style.module.scss';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import withLocale from '../../withLocale';
import { useIntl } from '@kne/react-intl';

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

const getIsMobile = () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = event => {
      setIsMobile(event.matches);
    };
    mediaQueryList.addEventListener('change', onChange);
    return () => {
      mediaQueryList.removeEventListener('change', onChange);
    };
  }, []);

  return isMobile;
};

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
      <Flex gap={2} vertical className={style['side-list']}>
        {Array.from({ length: 3 }).map((item, index) => {
          return <div key={index} className={style['type-item']} />;
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

const LayoutType = withLocale(forwardRef((props, ref) => {
  const isMobile = useIsMobile();
  const [value, onChange] = useControlValue(
    Object.assign(
      {},
      {
        defaultValue: 1
      },
      props
    )
  );
  const { formatMessage } = useIntl();
  const activeValue = isMobile && [2, 4].indexOf(value) === -1 ? 4 : value;
  const list = [
    {
      value: 1,
      label: formatMessage({ id: 'Grid' }),
      children: <GridType />,
      hiddenInMobile: true
    },
    {
      value: 2,
      label: formatMessage({ id: 'TopMemberList' }),
      children: <TopListType />
    },
    {
      value: 3,
      label: formatMessage({ id: 'LeftMemberList' }),
      children: <LeftListType />,
      hiddenInMobile: true
    },
    {
      value: 4,
      label: formatMessage({ id: 'BottomMemberList' }),
      children: <BottomListType />
    }
  ];

  useImperativeHandle(ref, () => {
    return { value: activeValue, onChange };
  }, [activeValue, onChange]);
  return (
    <Row wrap gutter={[12, 12]}>
      {list.map((item, index) => {
        return (
          <Col
            xs={12}
            sm={12}
            md={12}
            key={index}
            className={classnames(style['layout-item-outer'], {
              [style['hide-in-mobile']]: item.hiddenInMobile
            })}
            onClick={() => {
              onChange(item.value);
            }}
          >
            <Flex
              vertical
              className={classnames(style['layout-item'], {
                [style['is-active']]: activeValue === item.value
              })}
            >
              {item.children}
            </Flex>
            <Flex
              className={classnames(style['layout-label'], {
                [style['is-active']]: activeValue === item.value
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
}));

export default LayoutType;
