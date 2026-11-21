// Lightweight cross-platform storage adapter for Mobile (Expo/React Native)
const memoryStore = new Map();

export const storage = {
  getItem: async (key) => {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (_e) {
        // Fallback to memory
      }
    }
    return memoryStore.get(key) || null;
  },

  setItem: async (key, value) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (_e) {
        // Fallback to memory
      }
    }
    memoryStore.set(key, value);
  },

  removeItem: async (key) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (_e) {
        // Fallback
      }
    }
    memoryStore.delete(key);
  },

  clear: async () => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch (_e) {
        // Fallback
      }
    }
    memoryStore.clear();
  }
};

export default storage;
