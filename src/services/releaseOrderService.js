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
};