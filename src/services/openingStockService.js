import axiosInstance from "./authService";

export const getOpeningStocks = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/stock-balance", {
    params,
  });

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

export const importStockBalanceExcel = async (formData, onUploadProgress) => {
  const response = await axiosInstance.post(
    "/inventory/stock-balance/import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    }
  );

  return response.data;
};