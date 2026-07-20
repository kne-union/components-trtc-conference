import AppChildrenRouter from '@kne/app-children-router';
import { createWithRemoteLoader } from '@kne/remote-loader';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Provider } from './context';

const LOCALE_MAP = {
  en: 'en-US',
  'en-US': 'en-US',
  zh: 'zh-CN',
  'zh-CN': 'zh-CN'
};

const LocaleFromUrl = createWithRemoteLoader({
  modules: ['components-core:Global@useGlobalContext']
})(({ remoteModules }) => {
  const [useGlobalContext] = remoteModules;
  const { global, setGlobalValue } = useGlobalContext();
  const [searchParams] = useSearchParams();
  const language = searchParams.get('language') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('language') : null);

  useEffect(() => {
    const locale = LOCALE_MAP[language];
    if (!locale || global?.locale === locale) {
      return;
    }
    setGlobalValue('locale', locale);
  }, [language, global?.locale, setGlobalValue]);

  return null;
});

const App = ({ baseUrl, userInfo, headerName = 'x-trtc-conference-code', name = 'conference' }) => {
  return (
    <Provider value={{ baseUrl, headerName, name, userInfo }}>
      <LocaleFromUrl />
      <AppChildrenRouter
        baseUrl={baseUrl}
        list={[
          {
            index: true,
            loader: () => import('./pages/Home')
          },
          {
            path: 'invite',
            loader: () => import('./pages/Invite')
          },
          {
            path: 'detail',
            loader: () => import('./pages/Detail')
          },
          {
            path: 'conference',
            loader: () => import('./pages/Conference')
          }
        ]}
      />
    </Provider>
  );
};

export default App;
