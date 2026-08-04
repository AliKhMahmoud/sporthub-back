const cacheStore = {};

const set = (key, value, ttl = 60) => {
  cacheStore[key] = {
    value,
    expiresAt: Date.now() + ttl * 1000
  };
};

const get = (key) => {
  const cached = cacheStore[key];
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    delete cacheStore[key];
    return null;
  }

  return cached.value;
};

const clear = (key) => {
  delete cacheStore[key];
};

module.exports = {
  set,
  get,
  clear
};
