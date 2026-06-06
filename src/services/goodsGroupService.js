import axiosInstance from "./authService";

export const getGoodsGroups = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/goods-groups", { params });
  return response.data;
};

export const getGoodsGroup = async (id) => {
  const response = await axiosInstance.get(`/inventory/goods-groups/${id}`);
  return response.data;
};

export const createGoodsGroup = async (payload) => {
  const response = await axiosInstance.post("/inventory/goods-groups", payload);
  return response.data;
};

export const updateGoodsGroup = async (id, payload) => {
  const response = await axiosInstance.put(`/inventory/goods-groups/${id}`, payload);
  return response.data;
};

export const deleteGoodsGroup = async (id) => {
  const response = await axiosInstance.delete(`/inventory/goods-groups/${id}`);
  return response.data;
};

export default {
  getGoodsGroups,
  getGoodsGroup,
  createGoodsGroup,
  updateGoodsGroup,
  deleteGoodsGroup,
};
