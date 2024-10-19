import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Ensure this is also set in your .env file
});

api.interceptors.request.use(
  async (config) => {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
