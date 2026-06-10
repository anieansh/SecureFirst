import axios from 'axios';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { storage } from './storage';
import { API_BASE_URL, API_KEY } from '../constants/api';

let logoutCallback: (() => Promise<void> | void) | null = null;
let isAlertShowing = false;

export const setLogoutCallback = (callback: () => Promise<void> | void) => {
  logoutCallback = callback;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY, // Still sending API Key for backend hardening
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Session Expired
      console.log('[API] 401 Unauthorized - Session Expired');
      
      if (!isAlertShowing) {
        isAlertShowing = true;

        // Perform logout and session cleanup
        if (logoutCallback) {
          try {
            await logoutCallback();
          } catch (logoutErr) {
            console.error('Error during logout callback:', logoutErr);
          }
        } else {
          await storage.clearAll();
          router.replace('/');
        }

        // Show popup
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                isAlertShowing = false;
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
