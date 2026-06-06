import axiosInstance from "./authService";

export const getWarehouses = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/warehouses", { params });
  return response.data;
};

export const createWarehouse = async (warehouseData) => {
  const response = await axiosInstance.post(
    "/inventory/warehouses",
    warehouseData
  );
  return response.data;
};

export const updateWarehouse = async (warehouseId, warehouseData) => {
  const response = await axiosInstance.put(
    `/inventory/warehouses/${warehouseId}`,
    warehouseData
  );
  return response.data;
};

export const deleteWarehouse = async (warehouseId) => {
  const response = await axiosInstance.delete(
    `/inventory/warehouses/${warehouseId}`
  );
  return response.data;
};

export const importWarehouseExcel = async (formData) => {
  const response = await axiosInstance.post(
    "/inventory/warehouses/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};