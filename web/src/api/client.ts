import axios from 'axios';
import { getRefreshToken, setAccessToken, clearSession } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 — try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearSession();
        toast.error('Sesi habis. Silakan login kembali.');
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        const newToken = res.data.access;
        setAccessToken(newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (e) {
        clearSession();
        toast.error('Sesi habis. Silakan login kembali.');
        return Promise.reject(e);
      }
    }

    // Handle other errors — show toast
    if (!originalRequest._suppressToast) {
      const data = error.response?.data;
      let message = 'Terjadi kesalahan. Silakan coba lagi.';

      if (typeof data === 'string') {
        message = data;
      } else if (data?.detail) {
        message = data.detail;
      } else if (data?.message) {
        message = data.message;
      } else if (typeof data === 'object') {
        // DRF validation errors: { field: ["error1", "error2"] }
        const errors: string[] = [];
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            errors.push(`${key}: ${value.join(', ')}`);
          } else if (typeof value === 'string') {
            errors.push(`${key}: ${value}`);
          }
        }
        if (errors.length > 0) message = errors.join(' | ');
      }

      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
