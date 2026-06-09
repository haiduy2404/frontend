import axiosInstance from "./authService";

export const getWarehouseReceiptCompanySummary = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/warehouse-receipts/company-summary",
    { params }
  );

  return response.data;
};

export default {
  getWarehouseReceiptCompanySummary,
};