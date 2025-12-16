import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for HttpOnly cookies in production
});

// Queue for failed requests during token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh Logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token - if refresh endpoint doesn't exist, redirect to login
        try {
          const refreshResponse = await api.post('/auth/refresh');
          const newToken = refreshResponse.data.access_token || refreshResponse.data.token;

          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, redirect to login
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/#/login-register';
          return Promise.reject(refreshError);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // If refresh fails, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/#/login-register'; // Hash router redirect
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;