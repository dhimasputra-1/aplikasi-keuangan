import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddress } from '../../Api/IpPublic';

const API_BASE_URL = ipAddress || 'https://api.example.com'; // prefer value from Api/IpPublic

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('authToken');
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  error => {
    console.error('API error full:', error);
    if (!error.response) {
      // Network/CORS/DNS errors
      return Promise.reject(new Error('Network request failed: periksa koneksi dan API_BASE_URL'));
    }
    return Promise.reject(error);
  }
);

export default api;
