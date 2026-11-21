import storage from './storage';

export const API_BASE_URL = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = await storage.getItem('meditrace_access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to Meditrace server. Please check your connection.');
  }

  // Handle Token Refresh on 401
  if (response.status === 401 && !options._retry && !endpoint.includes('/auth/')) {
    options._retry = true;
    const refreshToken = await storage.getItem('meditrace_refresh_token');

    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData.data?.accessToken) {
          await storage.setItem('meditrace_access_token', refreshData.data.accessToken);
          if (refreshData.data.refreshToken) {
            await storage.setItem('meditrace_refresh_token', refreshData.data.refreshToken);
          }
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          return fetch(url, { ...options, headers }).then(r => r.json());
        }
      } catch (_e) {
        // Refresh failed, clean up
        await storage.removeItem('meditrace_access_token');
        await storage.removeItem('meditrace_refresh_token');
        await storage.removeItem('meditrace_user');
      }
    }
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = json;
    throw error;
  }

  return json;
}

export const mobileClient = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

export default mobileClient;
