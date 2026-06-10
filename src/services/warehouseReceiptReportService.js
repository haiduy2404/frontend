import axiosInstance from "./authService";

export const getWarehouseReceiptCompanySummary = async (payload = {}) => {
  const response = await axiosInstance.post(
    "/inventory/warehouse-receipts/company-summary",
    payload
  );

  return response.data;
};

export default {
  getWarehouseReceiptCompanySummary,
};
