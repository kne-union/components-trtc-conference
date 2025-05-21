const getConferenceSdk = async (type = 'trtc') => {
  if (type === 'trtc') {
    const { default: ConferenceSDK } = await import('./trtc');
    return (...args) => new ConferenceSDK(...args);
  }

  throw new Error('type is not supported');
};

export default getConferenceSdk;
