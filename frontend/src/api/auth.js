import axiosClient from './axiosClient';

export const authAPI = {
  signup: async (data) => {
    const response = await axiosClient.post('/auth/signup/', data);
    return response.data;
  },
  login: async (credentials) => {
    const response = await axiosClient.post('/auth/login/', credentials);
    return response.data;
  },
  logout: async (refreshToken) => {
    try {
      await axiosClient.post('/auth/logout/', { refresh: refreshToken });
    } catch (e) {
      // Ignore errors on logout
    }
  },
  getProfile: async () => {
    const response = await axiosClient.get('/auth/me/');
    return response.data;
  }
};

