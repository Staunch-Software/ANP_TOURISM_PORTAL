import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8010/api/v1',
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

// The backend stores and sends timestamps in UTC but with no timezone marker
// ("2026-10-03T07:21:56" or "2026-10-03 07:21:56.123456"). new Date() reads
// such a string as the browser's LOCAL time, so every timestamp in the app
// showed 5h30m early in India. Tag them as UTC once here so every
// new Date(...) in the UI converts correctly. Only full date+time strings
// match: slot dates ("2026-10-03") and times ("09:00") are left alone.
const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$/;

function markUtcTimestamps(value) {
  if (typeof value === 'string') {
    return NAIVE_DATETIME.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  }
  if (Array.isArray(value)) return value.map(markUtcTimestamps);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, markUtcTimestamps(v)]));
  }
  return value; // Blob (xlsx/csv downloads), null, numbers, booleans
}

// Response Interceptor: Catch RFP 7.1.12 Concurrency Eviction
API.interceptors.response.use(
  (response) => {
    response.data = markUtcTimestamps(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('aniidco_token')) {
      localStorage.removeItem('aniidco_token');
      localStorage.removeItem('aniidco_user');
      window.dispatchEvent(new Event('aniidco:auth-expired'));
    }
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
