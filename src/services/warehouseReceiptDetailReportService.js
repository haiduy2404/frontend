import axiosInstance from "./authService";

export const getWarehouseReceiptDetailReport = async (payload = {}) => {
  const response = await axiosInstance.post(
    "/inventory/reports/receipt/pageable",
    payload
  );

  return response.data;
};

/**
 * Tổng của TOÀN BỘ kết quả lọc (mọi trang): số dòng, số phiếu, số công ty, số
 * mã vật tư, tiền trước VAT, tiền VAT, tổng tiền. Body giống hệt /pageable —
 * page/page_size bị bỏ qua.
 *
 * POST /inventory/reports/receipt/summary
 */
export const getWarehouseReceiptDetailReportSummary = async (payload = {}) => {
  const response = await axiosInstance.post(
    "/inventory/reports/receipt/summary",
    payload
  );

  return response.data;
};

export default {
  getWarehouseReceiptDetailReport,
  getWarehouseReceiptDetailReportSummary,
};