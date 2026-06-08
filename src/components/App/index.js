import AppChildrenRouter from '@kne/app-children-router';
import { Provider } from './context';

const App = ({ baseUrl, userInfo, headerName = 'x-trtc-conference-code', name = 'conference' }) => {
  return (
    <Provider value={{ baseUrl, headerName, name, userInfo }}>
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
