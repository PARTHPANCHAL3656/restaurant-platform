import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://spice-garden-ebon.vercel.app',
  timeout: 10000,
});

// Request interceptor to attach token dynamically
api.interceptors.request.use(
  (config) => {
    // 1. Staff Token from localStorage
    const staffToken = localStorage.getItem('staffToken');
    if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
      return config;
    }

    // 2. Customer Token from URL query params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const tableToken = urlToken || sessionStorage.getItem('tableToken');
    if (tableToken) {
      // Store in sessionStorage so it persists across page navigations
      if (urlToken) {
        sessionStorage.setItem('tableToken', urlToken);
      }
      config.headers.Authorization = `Bearer ${tableToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    
    if (error.response) {
      // Server responded with a status other than 2xx
      const status = error.response.status;
      const data = error.response.data;
      
      message = data?.error || data?.message || `Error ${status}: ${error.response.statusText}`;

      // JWT Expired / Unauthorized - Redirect staff to login
      if (status === 401 || status === 403) {
        if (localStorage.getItem('staffToken')) {
          localStorage.removeItem('staffToken');
          sessionStorage.removeItem('staffAuthenticated');
          window.location.href = '/staff/login';
        }
      }
    } else if (error.request) {
      // Request was made but no response was received
      message = 'Network error: No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
