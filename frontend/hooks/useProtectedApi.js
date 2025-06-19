import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const useProtectedApi = () => {
  const { user } = useAuth();

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  });

  // Handle token refresh / session expiry
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config.__isRetryRequest) {
        try {
          const refreshResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            token: localStorage.getItem('fippo_token'),
          });
          const newToken = refreshResponse.data.access_token;
          localStorage.setItem('fippo_token', newToken);
          // retry original request
          error.config.__isRetryRequest = true;
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return api(error.config);
        } catch (_) {
          // fallback to logout
        }
        // Auto logout on 401
        if (typeof window !== 'undefined') {
          const toast = (await import('react-hot-toast')).default;
          toast.error('Session expired, please sign in again');
        }
        localStorage.removeItem('fippo_token');
        // redirect
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export default useProtectedApi;
