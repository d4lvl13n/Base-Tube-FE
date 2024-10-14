import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Ensure this is also set in .env
});

// Remove useAuth and interceptors that use hooks
export default api;