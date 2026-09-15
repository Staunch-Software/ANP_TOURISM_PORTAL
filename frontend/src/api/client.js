import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject Bearer Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('aniidco_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Catch RFP 7.1.12 Concurrency Eviction
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const detail = error.response.data?.detail || '';
      if (detail.includes('7.1.12') || detail.includes('Session Expired')) {
        alert('⚠️ SESSION TERMINATED: You have logged in from another device/browser. (RFP 7.1.12 Single-Session Rule)');
        localStorage.removeItem('aniidco_token');
        localStorage.removeItem('aniidco_user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default API;
