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

export default {
  getReleaseReportPageable,
};