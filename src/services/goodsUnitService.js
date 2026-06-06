import axiosInstance from "./authService";

export const getGoodsUnits = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/goods-units", { params });
  return response.data;
};

export const seedGoodsUnits = async () => {
  const response = await axiosInstance.post("/inventory/goods-units/seed");
  return response.data;
};

export const getGoodsUnit = async (id) => {
  const response = await axiosInstance.get(`/inventory/goods-units/${id}`);
  return response.data;
};

export const createGoodsUnit = async (payload) => {
  const response = await axiosInstance.post("/inventory/goods-units", payload);
  return response.data;
};

export const updateGoodsUnit = async (id, payload) => {
  const response = await axiosInstance.put(`/inventory/goods-units/${id}`, payload);
  return response.data;
};

export const deleteGoodsUnit = async (id) => {
  const response = await axiosInstance.delete(`/inventory/goods-units/${id}`);
  return response.data;
};

export default {
  getGoodsUnits,
  seedGoodsUnits,
  getGoodsUnit,
  createGoodsUnit,
  updateGoodsUnit,
  deleteGoodsUnit,
};
