import axios from 'axios';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { storage } from '@/utils/storage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 20000,
});
api.interceptors.request.use((config) => {
  const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // A late response from the old demo session must never clear a newly switched token.
    const current = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (
      error.response?.status === 401 &&
      current &&
      error.config?.headers?.Authorization === `Bearer ${current}` &&
      !error.config.url.includes('/auth/login')
    ) {
      storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      storage.remove(STORAGE_KEYS.USER_INFO);
      window.dispatchEvent(new Event('hotel:unauthorized'));
    }
    return Promise.reject(error);
  }
);
export default api;
