import axiosClient from './axiosClient';

export const settingsAPI = {
  getSettings: async () => {
    const response = await axiosClient.get('/settings/');
    return response.data;
  },
  updateSettings: async (data) => {
    const response = await axiosClient.patch('/settings/', data);
    return response.data;
  }
};

