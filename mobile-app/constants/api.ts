import axios from 'axios';

export const API_BASE = 'https://api.securefirst.co/api';
export const API_KEY = '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92';

// Shared axios instance with security headers
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 
    'X-API-Key': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000,
});

// Debug: Log requests to verify headers are being sent
api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`[API Headers]`, JSON.stringify(config.headers, null, 2));
  return config;
});

// Handle global errors (like 401 Authentication Required)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API Error] ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  AUTH: `${API_BASE}/mobile-auth`,
  POLICIES: `${API_BASE}/policy`,
  CONFIG: `${API_BASE}/config`,
  LEADS: `${API_BASE}/leads`,
};
