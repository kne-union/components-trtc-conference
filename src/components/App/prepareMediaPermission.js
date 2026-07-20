/**
 * iOS Safari / PWA 要求 getUserMedia 在用户手势链路内调用。
 * 进入会议前先预请求权限，后续 useEffect 里 startLocalVideo/Audio 才不会被静默拒绝。
 */
const prepareMediaPermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach(track => track.stop());
  } catch (e) {
    // 用户拒绝或不支持时仍允许进入会议，由房间内设备开关处理
  }
};

export default prepareMediaPermission;
