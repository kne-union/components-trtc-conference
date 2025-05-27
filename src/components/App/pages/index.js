import loadable from '@loadable/component';
import { Spin } from 'antd';

const loadableWithProps = func =>
  loadable(func, {
    fallback: <Spin style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
  });

const pages = {
  Home: loadableWithProps(() => import('./Home')),
  Detail: loadableWithProps(() => import('./Detail')),
  Invite: loadableWithProps(() => import('./Invite')),
  Conference: loadableWithProps(() => import('./Conference'))
};

export default pages;
