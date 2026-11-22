// Cross-platform in-memory storage adapter for React Native / Expo
// Works reliably on ALL Android & iOS devices without extra native bindings
const memoryStore = new Map();

export const storage = {
  getItem: async (key) => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (_e) {
      // Ignore
    }
    return memoryStore.get(key) || null;
  },

  setItem: async (key, value) => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem(key, value);
      }
    } catch (_e) {
      // Ignore
    }
    memoryStore.set(key, value);
  },

  removeItem: async (key) => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
        localStorage.removeItem(key);
      }
    } catch (_e) {
      // Ignore
    }
    memoryStore.delete(key);
  },

  clear: async () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.clear) {
        localStorage.clear();
      }
    } catch (_e) {
      // Ignore
    }
    memoryStore.clear();
  }
};

export default storage;
