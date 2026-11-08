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

/**
 * Trích xuất tồn kho ĐẦU KỲ của tháng periodMonth ("YYYY-MM") cho các kho đã chọn.
 * periodMonth là bắt buộc: thao tác này ghi đè dữ liệu nên BE không có mặc định.
 */
export const captureBeginningInventory = async (warehouseIds, periodMonth) => {
  const response = await axiosInstance.post(
    "/inventory/beginning-inventory/capture",
    {
      warehouse_ids: warehouseIds,
      period_month: periodMonth,
    }
  );

  return response.data;
};

/**
 * Các kỳ được phép trích xuất, mới nhất trước.
 *
 * Truyền warehouseIds thì mỗi kỳ kèm: kho nào thiếu mốc kỳ trước (selectable =
 * false, có reason), kho nào đã có dữ liệu kỳ đó (trích xuất lại sẽ ghi đè).
 */
export const getCapturePeriods = async (warehouseIds = []) => {
  const response = await axiosInstance.get(
    "/inventory/beginning-inventory/capture/periods",
    {
      params: warehouseIds.length
        ? { warehouse_ids: warehouseIds.join(",") }
        : {},
    }
  );

  return response.data;
};

/**
 * Chạy mọi chốt chặn của lệnh trích xuất mà KHÔNG ghi gì.
 *
 * Trả { period, negative_stock_lines, negative_summary, can_capture } để trang
 * hiện cảnh báo ở bước xác nhận, thay vì để user bấm "chắc chắn" rồi mới lỗi.
 */
export const checkBeginningInventoryCapture = async (warehouseIds, periodMonth) => {
  const response = await axiosInstance.get(
    "/inventory/beginning-inventory/capture/check",
    {
      params: {
        period_month: periodMonth,
        warehouse_ids: warehouseIds.join(","),
      },
    }
  );

  return response.data;
};

export const getBeginningInventories = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/beginning-inventory/pageable",
    {
      params,
    }
  );

  return response.data;
};