import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

api.interceptors.request.use(
  async (config) => {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      delete config.headers['X-Forwarded-For'];
      delete config.headers['X-Real-IP'];
    }
    console.log('Outgoing request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.data?.data?.thumbnail_url || response.data?.data?.video_url) {
      console.log('Media URLs in response:', {
        thumbnail: response.data.data.thumbnail_url,
        video: response.data.data.video_url,
        isStorj: {
          thumbnail: response.data.data.thumbnail_url?.includes('storjshare.io'),
          video: response.data.data.video_url?.includes('storjshare.io')
        }
      });
    }
    return response;
  },
  (error) => {
    const errorDetails = {
      status: error.response?.status,
      data: error.response?.data,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method,
      headers: {
        ...error.config?.headers,
        Authorization: 'Bearer [REDACTED]'
      }
    };
    console.error('API Error:', errorDetails);
    return Promise.reject(error);
  }
);

export default api;
