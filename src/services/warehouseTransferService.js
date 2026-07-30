import axiosInstance from "./authService";

export const getWarehouseTransfersPageable = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/warehouse-transfers/pageable",
    { params }
  );

  return response.data;
};

export const getWarehouseTransferByCode = async (code) => {
  const response = await axiosInstance.get(
    `/inventory/warehouse-transfers/code/${code}`
  );

  return response.data;
};

export const createWarehouseTransfer = async (payload) => {
  const response = await axiosInstance.post(
    "/inventory/warehouse-transfers",
    payload
  );

  return response.data;
};

export const updateWarehouseTransfer = async (transferId, payload) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-transfers/${transferId}`,
    payload
  );

  return response.data;
};

export const completeWarehouseTransfer = async (transferId) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-transfers/${transferId}/status`,
    {
      action: "complete",
    }
  );

  return response.data;
};

export const cancelWarehouseTransfer = async (transferId) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-transfers/${transferId}/status`,
    {
      action: "cancel",
    }
  );

  return response.data;
};

export const updateWarehouseTransferStatus = (transferId, action) => {
  return axiosInstance.put(
    `/inventory/warehouse-transfers/${transferId}/status`,
    {
      action,
    }
  );
};

export const deleteWarehouseTransfer = async (transferId) => {
  const response = await axiosInstance.delete(
    `/inventory/warehouse-transfers/${transferId}`
  );

  return response.data;
};

export default {
  getWarehouseTransfersPageable,
  getWarehouseTransferByCode,
  createWarehouseTransfer,
  updateWarehouseTransfer,
  completeWarehouseTransfer,
  cancelWarehouseTransfer,
  updateWarehouseTransferStatus,
  deleteWarehouseTransfer,
};