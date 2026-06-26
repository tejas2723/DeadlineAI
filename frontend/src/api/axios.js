import axios from 'axios';
import toast from 'react-hot-toast';

// Create a custom Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

// Request Interceptor: Inject JWT token into headers if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('deadlineai_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally (auto-redirection on 401, error notifications)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const status = error.response?.status;

    if (status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      // Clear token on authorization failure
      localStorage.removeItem('deadlineai_token');
      window.location.href = '/login';
    } else if (status !== 401) {
      // Notify user of errors (except 401 which redirects)
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
