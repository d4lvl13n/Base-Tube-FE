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
    try {
      const authMethod = localStorage.getItem('auth_method');
      console.log('Request:', {
        url: config.url,
        method: config.method,
        authMethod,
        cookies: document.cookie // Log cookies being sent
      });

      if (authMethod !== 'web3') {
        // Clerk-based auth:
        const clerkToken = await window.Clerk?.session?.getToken();
        if (clerkToken) {
          config.headers.Authorization = `Bearer ${clerkToken}`;
        }
      }
      // For web3 auth, the cookie will be sent automatically
      // because withCredentials: true is set
    } catch (error) {
      console.warn('Failed to process auth in interceptor', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Example logging; optional
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
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        const authMethod = localStorage.getItem('auth_method');
        
        if (authMethod === 'web3') {
          // For web3 users, dispatch an event to trigger re-auth
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        // For Clerk users, let Clerk handle it
      }
      
      // Handle 429 Rate Limit errors
      if (error.response?.status === 429) {
        const errorCode = error.response?.data?.error?.code;
        const message = error.response?.data?.error?.message || 
                       error.response?.data?.message || 
                       'Too many requests. Please wait a moment and try again.';
        
        // Dispatch rate limit event for UI handling
        window.dispatchEvent(new CustomEvent('auth:rate-limited', { 
          detail: { errorCode, message } 
        }));
      }

      // Log error details (keep your existing logging)
      const errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.error?.message || error.response?.data?.message,
        errorCode: error.response?.data?.error?.code,
        url: error.config?.url,
        method: error.config?.method,
        authMethod: localStorage.getItem('auth_method'),
      };
      console.error('API Error:', errorDetails);
    }
    return Promise.reject(error);
  }
);

export default api;
