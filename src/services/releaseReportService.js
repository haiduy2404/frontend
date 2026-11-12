import axiosInstance from "./authService";

/**
 * Báo cáo xuất kho phân trang.
 *
 * POST /inventory/reports/release/pageable
 *
 * Tất cả filter đều optional.
 * page/page_size cũng gửi trong POST body.
 */
export const getReleaseReportPageable = async (payload = {}) => {
  const response = await axiosInstance.post(
    "/inventory/reports/release/pageable",
    payload
  );

  return response.data;
};

/**
 * Tổng của TOÀN BỘ kết quả lọc (mọi trang): số dòng, số lệnh, số mã vật tư,
 * tổng thành tiền. Body giống hệt /pageable — page/page_size bị bỏ qua.
 *
 * POST /inventory/reports/release/summary
 */
export const getReleaseReportSummary = async (payload = {}) => {
  const response = await axiosInstance.post(
    "/inventory/reports/release/summary",
    payload
  );

  return response.data;
};

export default {
  getReleaseReportPageable,
  getReleaseReportSummary,
};