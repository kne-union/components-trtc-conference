const isHttpUrl = value => /^https?:\/\//i.test(value);

const resolveAvatarProps = avatar => {
  if (!avatar) {
    return {};
  }
  if (isHttpUrl(avatar)) {
    return { src: avatar };
  }
  return { id: avatar };
};

export default resolveAvatarProps;
