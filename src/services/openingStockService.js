import axiosInstance from "./authService";

export const getOpeningStocks = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/inventories", {
    params,
  });

  return response.data;
};

export const createOpeningStock = async (openingStockData) => {
  const response = await axiosInstance.post(
    "/inventory/inventories",
    openingStockData
  );

  return response.data;
};

export const updateOpeningStock = async (inventoryId, openingStockData) => {
  const response = await axiosInstance.put(
    `/inventory/inventories/${inventoryId}`,
    openingStockData
  );

  return response.data;
};

export const deleteOpeningStock = async (inventoryId) => {
  const response = await axiosInstance.delete(
    `/inventory/inventories/${inventoryId}`
  );

  return response.data;
};

export const importOpeningStockExcel = async (formData) => {
  const response = await axiosInstance.post(
    "/inventory/inventories/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

