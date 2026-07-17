import axiosInstance from "./authService";

export const getGoods = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/goods/pageable", {
    params,
  });

  return response.data;
};

export const createGoods = async (payload) => {
  const response = await axiosInstance.post("/inventory/goods", payload);
  return response.data;
};

export const updateGoods = async (id, payload) => {
  const response = await axiosInstance.put(`/inventory/goods/${id}`, payload);
  return response.data;
};

export const deleteGoods = async (id) => {
  const response = await axiosInstance.delete(`/inventory/goods/${id}`);
  return response.data;
};

export const importGoodsExcel = async (formData, onUploadProgress) => {
  const response = await axiosInstance.post("/inventory/goods/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return response.data;
};