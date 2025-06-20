const createCollector = (callback, options) => {
  options = Object.assign(
    {},
    {
      maxLength: 10
    },
    options
  );

  let messages = [];

  return async data => {
    messages.push(data);
    if (messages.length >= options.maxLength) {
      try {
        await callback(messages);
        messages = [];
      } catch (e) {
        console.error(e);
      }
    }
  };
};

export default createCollector;
