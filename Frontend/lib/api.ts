import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Critical: Send cookies with every request
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const url = originalRequest?.url || '';

    // Don't intercept login endpoint - let it fail naturally
    // But allow refresh endpoint to be intercepted for token refresh attempts
    if (url.includes('/auth/login')) {
      return Promise.reject(error);
    }
    
    // If refresh endpoint fails with 401, it means tokens are invalid - redirect to login
    if (url.includes('/auth/refresh') && error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear cookies
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // If 401 and we haven't retried yet, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint (cookies are sent automatically)
        await api.post('/auth/refresh');

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - likely invalid tokens (signature mismatch, expired, etc.)
        // Clear cookies and redirect to login immediately
        if (typeof window !== 'undefined' && !url.includes('/auth/')) {
          // Clear cookies manually if backend doesn't
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
          document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
          // Redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;