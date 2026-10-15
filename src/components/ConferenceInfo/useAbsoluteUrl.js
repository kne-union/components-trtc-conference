import { useCallback, useContext } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

/**
 * 生成可复制 / 新窗口打开的完整地址：带上宿主 Router 的 basename（如应用中心的 /app/{name}）。
 * 不在 Router 内渲染时 basename 为空，行为与直接拼 origin 一致。
 */
const useAbsoluteUrl = () => {
  const navigation = useContext(UNSAFE_NavigationContext);
  const basename = (navigation?.basename || '').replace(/\/+$/, '');
  return useCallback(
    url => {
      if (/^https?:\/\//i.test(url)) {
        return url;
      }
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${window.location.origin}${basename}${path}`;
    },
    [basename]
  );
};

export default useAbsoluteUrl;
