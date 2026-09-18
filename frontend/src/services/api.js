/**
 * AEROTWIN AI - Frontend Axios Client
 */

import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') && !window.location.hostname.includes('backend')) {
    return 'https://aerotwin-backend.onrender.com/api';
  }
  return '/api';
};

const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aerotwin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
