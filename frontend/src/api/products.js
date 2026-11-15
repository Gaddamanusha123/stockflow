import axiosClient from './axiosClient';

export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await axiosClient.get('/products/', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axiosClient.get(`/products/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await axiosClient.post('/products/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await axiosClient.put(`/products/${id}/`, data);
    return response.data;
  },
  patch: async (id, data) => {
    const response = await axiosClient.patch(`/products/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await axiosClient.delete(`/products/${id}/`);
    return response.data;
  },
  adjustStock: async (id, payload) => {
    const response = await axiosClient.post(`/products/${id}/adjust-stock/`, payload);
    return response.data;
  }
};

