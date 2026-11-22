import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token and active profile context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('meditrace_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeProfileId = localStorage.getItem('meditrace_active_profile_id');
    if (activeProfileId) {
      config.headers['x-profile-id'] = activeProfileId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh or errors
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    // Support both res.data.users AND res.data.data.users seamlessly
    if (body && typeof body === 'object' && body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      if (!('data' in body.data)) {
        Object.defineProperty(body.data, 'data', {
          get() {
            return this;
          },
          configurable: true,
          enumerable: false
        });
      }
    }
    return body;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('meditrace_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          if (res.data?.success) {
            const { accessToken, refreshToken: newRefresh } = res.data.data;
            localStorage.setItem('meditrace_access_token', accessToken);
            if (newRefresh) localStorage.setItem('meditrace_refresh_token', newRefresh);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest).then(r => r.data);
          }
        } catch (_refreshErr) {
          localStorage.removeItem('meditrace_access_token');
          localStorage.removeItem('meditrace_refresh_token');
          localStorage.removeItem('meditrace_user');
          window.location.href = '/login';
        }
      }
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
