import { create } from 'zustand';
import api from '../api/client';

let storedUser = null;
try {
  const item = localStorage.getItem('meditrace_user');
  if (item) storedUser = JSON.parse(item);
} catch (_e) {
  storedUser = null;
}

export const useAuthStore = create((set, get) => ({
  user: storedUser,
  isAuthenticated: !!localStorage.getItem('meditrace_access_token'),
  loading: false,

  setUser: (user) => {
    localStorage.setItem('meditrace_user', JSON.stringify(user));
    set({ user });
  },

  updateUser: (updatedUser) => {
    localStorage.setItem('meditrace_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  fetchCurrentUser: async () => {
    try {
      const res = await api.get('/users/me');
      const user = res.data?.data?.user || res.data?.user;
      if (user) {
        localStorage.setItem('meditrace_user', JSON.stringify(user));
        set({ user });
      }
    } catch (_e) {
      // Token might be invalid
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data?.data || res.data;
      const { user, accessToken, refreshToken } = payload;
      localStorage.setItem('meditrace_access_token', accessToken);
      localStorage.setItem('meditrace_refresh_token', refreshToken);
      localStorage.setItem('meditrace_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', data);
      const payload = res.data?.data || res.data;
      const { user, accessToken, refreshToken } = payload;
      localStorage.setItem('meditrace_access_token', accessToken);
      localStorage.setItem('meditrace_refresh_token', refreshToken);
      localStorage.setItem('meditrace_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('meditrace_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (_e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('meditrace_access_token');
      localStorage.removeItem('meditrace_refresh_token');
      localStorage.removeItem('meditrace_user');
      set({ user: null, isAuthenticated: false });
    }
  }
}));

export default useAuthStore;
