import api from './index';

export const register = (name: string, email: string, password: string) =>
  api.post('/api/auth/register', { name, email, password });

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password });

export const getProfile = () => api.get('/api/auth/profile');