import axiosInstance from "./authService";

const EXPORT_ENDPOINT = "/inventory/the-kho/export";

/**
 * Tạo job xuất thẻ kho.
 *
 * payload:
 * {
 *   goods_ids: string[],
 *   period_month: string,
 *   formats: ["xlsx"] | ["pdf"] | ["xlsx", "pdf"]
 * }
 */
export const createTheKhoExport = async (payload) => {
  const response = await axiosInstance.post(EXPORT_ENDPOINT, payload);

  return response.data;
};

/**
 * Lấy trạng thái và tiến độ của job.
 */
export const getTheKhoExportStatus = async (jobId) => {
  if (!jobId) {
    throw new Error("Thiếu job_id xuất thẻ kho");
  }

  const response = await axiosInstance.get(
    `${EXPORT_ENDPOINT}/${jobId}`
  );

  return response.data;
};

/**
 * Lấy tên file từ header Content-Disposition.
 */
const getDownloadFilename = (contentDisposition) => {
  if (!contentDisposition) {
    return "the-kho.zip";
  }

  // Trường hợp:
  // filename*=UTF-8''the-kho-2026-07.zip
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

  // Trường hợp:
  // filename="the-kho-2026-07.zip"
  const normalMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i
  );

  return normalMatch?.[1]?.trim() || "the-kho.zip";
};

/**
 * Tải file ZIP kết quả xuất thẻ kho.
 *
 * Trả về:
 * {
 *   blob: Blob,
 *   filename: string
 * }
 */
export const downloadTheKhoExport = async (jobId) => {
  if (!jobId) {
    throw new Error("Thiếu job_id xuất thẻ kho");
  }

  const response = await axiosInstance.get(
    `${EXPORT_ENDPOINT}/${jobId}/download`,
    {
      responseType: "blob",
    }
  );

  return {
    blob: response.data,
    filename: getDownloadFilename(
      response.headers?.["content-disposition"]
    ),
  };
};

/**
 * Tạo link tạm để lưu Blob xuống máy.
 */
export const saveBlobFile = ({ blob, filename }) => {
  if (!(blob instanceof Blob)) {
    throw new Error("Dữ liệu file tải về không hợp lệ");
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename || "the-kho.zip";
  link.style.display = "none";

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
};

/**
 * Đọc nội dung lỗi khi request sử dụng responseType: "blob".
 *
 * Khi API trả lỗi 400/404, axios vẫn trả response.data dưới dạng Blob.
 */
export const readBlobError = async (
  error,
  fallbackMessage = "Có lỗi xảy ra"
) => {
  const data = error?.response?.data;

  if (!(data instanceof Blob)) {
    return (
      data?.message ||
      data?.detail ||
      data?.error ||
      error?.message ||
      fallbackMessage
    );
  }

  try {
    const text = await data.text();

    if (!text) {
      return fallbackMessage;
    }

    const parsed = JSON.parse(text);

    return (
      parsed?.message ||
      parsed?.detail ||
      parsed?.error ||
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
};