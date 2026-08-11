import axiosInstance from "./authService";
import { readBlobError, saveBlobFile } from "./theKhoService";

const BASE = "/inventory/reports";

export const REPORT_RECEIPT_SUMMARY = "receipt-company-summary";
export const REPORT_RELEASE = "release";

/**
 * Tạo job xuất Excel.
 *
 * filters chính là bộ lọc đang dùng ở API phân trang của báo cáo đó, nên file
 * xuất ra luôn khớp với những gì user đang xem trên màn hình.
 */
export const createReportExport = async (report, filters = {}) => {
  const response = await axiosInstance.post(
    `${BASE}/${report}/export`,
    filters
  );

  return response.data;
};

/**
 * Trạng thái + tiến độ của job.
 */
export const getReportExportStatus = async (jobId) => {
  if (!jobId) {
    throw new Error("Thiếu job_id xuất Excel");
  }

  const response = await axiosInstance.get(`${BASE}/exports/${jobId}`);

  return response.data;
};

const getDownloadFilename = (contentDisposition, fallback) => {
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const normalMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i
  );

  return normalMatch?.[1]?.trim() || fallback;
};

/**
 * Tải file .xlsx của job đã hoàn thành.
 */
export const downloadReportExport = async (
  jobId,
  fallbackName = "bao-cao.xlsx"
) => {
  if (!jobId) {
    throw new Error("Thiếu job_id xuất Excel");
  }

  const response = await axiosInstance.get(
    `${BASE}/exports/${jobId}/download`,
    { responseType: "blob" }
  );

  return {
    blob: response.data,
    filename: getDownloadFilename(
      response.headers?.["content-disposition"],
      fallbackName
    ),
  };
};

export { readBlobError, saveBlobFile };

export default {
  createReportExport,
  getReportExportStatus,
  downloadReportExport,
};
