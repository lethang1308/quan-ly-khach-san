/**
 * Application global configuration
 */
const backendUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'EduMatch',
  apiBaseUrl: import.meta.env.VITE_API_URL
    ? backendUrl.endsWith('/api')
      ? backendUrl
      : `${backendUrl}/api`
    : import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ||
      (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'),
  version: '1.0.0',
};
