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
      const targetMessages = messages;
      messages = [];
      try {
        await callback(targetMessages);
      } catch (e) {
        messages = targetMessages.concat(messages);
        console.error(e);
      }
    }
  };
};

export default createCollector;
