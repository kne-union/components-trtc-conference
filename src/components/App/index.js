import { Routes, Route } from 'react-router-dom';
import { Provider } from './context';
import pages from './pages';

const { Home, Detail, Conference } = pages;

const App = ({ baseUrl, userInfo, headerName = 'x-trtc-conference-code', name = 'conference' }) => {
  return (
    <Provider value={{ baseUrl, headerName, name, userInfo }}>
      <Routes>
        <Route path={baseUrl}>
          <Route index element={<Home />} />
          <Route path="detail" element={<Detail />} />
          <Route path="conference" element={<Conference />} />
        </Route>
      </Routes>
    </Provider>
  );
};

export default App;
