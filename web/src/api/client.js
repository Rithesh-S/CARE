import axios from 'axios';

export const API_BASE_URL = 'https://care-backend-gc1x.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

// Attach Bearer token from localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('spillit_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle response errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('spillit_admin_token');
      localStorage.removeItem('spillit_admin_user');
      // If unauthorized on protected admin route
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

export default client;
