import axiosInstance from "./authService";

export const getWarehouseReceiptDetailReport = async (payload = {}) => {
  const response = await axiosInstance.post(
    "/inventory/reports/receipt/pageable",
    payload
  );

  return response.data;
};

export default {
  getWarehouseReceiptDetailReport,
};