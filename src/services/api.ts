import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const getBaseUrl = () => {
  // If running in Expo Go on a physical device, scriptURL holds the dev machine's local IP (e.g. 192.168.0.110)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1];
    const host = address ? address.split(':')[0] : null;
    // Ensure we don't map to localhost in case of emulator, but use IP for physical phone
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api`;
    }
  }
  // Use the local laptop IP directly for physical phone connections
  return 'http://10.12.64.175:3000/api';
};

const baseUrl = getBaseUrl();
console.log('[API] Resolved Base URL:', baseUrl);

const api = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Callback hook to logout user on 401 Unauthorized
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Response Interceptor: Catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (logoutCallback) {
        logoutCallback();
      } else {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
