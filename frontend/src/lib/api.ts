import axios from 'axios';
import Cookies from 'js-cookie';

export const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return window.location.origin + '/api';
  }
  return envUrl || 'http://localhost:8000';
};

export const getWsUrl = (path: string) => {
  const baseUrl = getApiUrl().replace('http', 'ws');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      // Redirect to login if in browser
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
         window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);
