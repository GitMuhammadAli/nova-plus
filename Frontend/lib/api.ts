import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Critical: Send cookies with every request
});

// Flag to prevent multiple redirects
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

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

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Don't intercept auth endpoints (login, register, refresh)
    if (originalRequest?.url?.includes('/auth/login') || 
        originalRequest?.url?.includes('/auth/register') ||
        originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const errorMessage = error.response?.data?.message || '';
      
      // If invalid signature, don't try to refresh - just clear and redirect
      if (errorMessage.includes('invalid signature') || errorMessage.includes('Token signature invalid')) {
        if (typeof document !== 'undefined') {
          // Clear cookies immediately
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
          document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        }
        
        // Clear storage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('persist:root');
          localStorage.clear();
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }

        // Redirect to login immediately
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const refreshResponse = await api.post('/auth/refresh');
        
        // Wait a bit for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Process queued requests
        processQueue(null, null);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed - clear everything and redirect
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
          document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        }

        // Clear storage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('persist:root');
          localStorage.clear();
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }

        // Redirect to login (only if not already on auth pages)
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
