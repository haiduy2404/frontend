import axiosInstance from "./authService";

export const getReleaseOrdersPageable = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/warehouse-releases/pageable",
    { params }
  );
  return response.data;
};

export const getReleaseOrderByCode = async (code) => {
  const response = await axiosInstance.get(
    `/inventory/warehouse-releases/code/${code}`
  );
  return response.data;
};

export const getReleaseReferencesPageable = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/release-references",
    { params }
  );
  return response.data;
};

/**
 * Danh mục đơn vị lĩnh / đối tượng xuất kho, cho ô chọn CÓ TÌM KIẾM.
 *
 * params: { type, warehouse_id, start_date, end_date, search, limit }
 *   - start_date / end_date: chỉ lấy mục có trên lệnh xuất ĐÃ HOÀN THÀNH trong
 *     khoảng đó. Không truyền = mọi mục của kho (trang tạo lệnh xuất dùng kiểu
 *     này qua getReleaseReferencesPageable bên trên).
 *   - search: không phân biệt hoa thường và dấu.
 *
 * signal: AbortSignal để huỷ request cũ khi user gõ tiếp — chỉ kết quả của lần
 * gõ cuối mới có ý nghĩa.
 */
export const searchReleaseReferences = async (params = {}, { signal } = {}) => {
  const response = await axiosInstance.get("/inventory/release-references", {
    params,
    signal,
  });
  return response.data;
};

export const createReleaseOrder = async (payload) => {
  const response = await axiosInstance.post(
    "/inventory/warehouse-releases",
    payload
  );
  return response.data;
};

export const submitReleaseOrder = async (id) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-releases/${id}/status`,
    { action: "submit" }
  );
  return response.data;
};

export const deleteReleaseOrder = async (id) => {
  const response = await axiosInstance.delete(
    `/inventory/warehouse-releases/${id}`
  );
  return response.data;
};

export const updateReleaseOrder = async (id, payload) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-releases/${id}`,
    payload
  );
  return response.data;
};

export const completeReleaseOrder = async (id) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-releases/${id}/status`,
    { action: "complete" }
  );
  return response.data;
};

export const cancelReleaseOrder = async (id) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-releases/${id}/status`,
    { action: "cancel" }
  );
  return response.data;
};

export const updateWarehouseReleaseStatus = (releaseId, action) => {
  return axiosInstance.put(
    `/inventory/warehouse-releases/${releaseId}/status`,
    { action }
  );
};

export const updateReleasePrinted = async (
  releaseId,
  isPrinted = true
) => {
  const response = await axiosInstance.patch(
    `/inventory/warehouse-releases/${releaseId}/printed`,
    {
      is_printed: isPrinted,
    }
  );

  return response.data;
};

export const checkReleaseDuplicate = async (payload) => {
  const response = await axiosInstance.post(
    "/inventory/warehouse-releases/check-duplicate",
    payload
  );

  return response.data;
};

export default {
  getReleaseOrdersPageable,
  getReleaseOrderByCode,
  getReleaseReferencesPageable,
  createReleaseOrder,
  submitReleaseOrder,
  deleteReleaseOrder,
  updateReleaseOrder,
  completeReleaseOrder,
  cancelReleaseOrder,
  updateWarehouseReleaseStatus,
  updateReleasePrinted,
  checkReleaseDuplicate,
};