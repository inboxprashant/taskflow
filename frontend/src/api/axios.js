import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Only redirect to login on 401 for non-auth endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const is401 = error.response?.status === 401;
    const isAuthCheck = url.includes('/auth/me');

    // Don't redirect if it's the /auth/me check — AuthContext handles that
    if (is401 && !isAuthCheck) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
