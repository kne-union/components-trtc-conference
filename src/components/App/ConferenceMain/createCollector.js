const createCollector = (callback, options) => {
  options = Object.assign(
    {},
    {
      maxLength: 10,
      flushInterval: 10000
    },
    options
  );

  let messages = [];
  let destroyed = false;
  let flushTimer = null;

  const flush = async () => {
    if (messages.length === 0) {
      return;
    }
    const targetMessages = messages;
    messages = [];
    try {
      await callback(targetMessages);
    } catch (e) {
      messages = targetMessages.concat(messages);
      console.error(e);
    }
  };

  if (options.flushInterval > 0) {
    flushTimer = setInterval(() => {
      flush();
    }, options.flushInterval);
  }

  const collect = async data => {
    if (destroyed) {
      return;
    }
    messages.push(data);
    if (messages.length >= options.maxLength) {
      await flush();
    }
  };

  collect.flush = flush;
  collect.destroy = () => {
    destroyed = true;
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  };

  return collect;
};

export default createCollector;
