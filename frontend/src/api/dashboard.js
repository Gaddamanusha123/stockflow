import axiosClient from './axiosClient';

export const dashboardAPI = {
  getSummary: async () => {
    const response = await axiosClient.get('/dashboard/');
    return response.data;
  }
};
