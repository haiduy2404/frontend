import axiosInstance from "./authService";

export const getWarehouseReceiptsPageable = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/warehouse-receipts/pageable",
    { params }
  );
  return response.data;
};

export const createWarehouseReceipt = async (payload) => {
  const response = await axiosInstance.post(
    "/inventory/warehouse-receipts",
    payload
  );
  return response.data;
};

export const getWarehouseReceiptByCode = async (code) => {
  const response = await axiosInstance.get(
    `/inventory/warehouse-receipts/code/${code}`
  );
  return response.data;
};

export const updateWarehouseReceipt = async (id, payload) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-receipts/${id}`,
    payload
  );
  return response.data;
};

export const updateWarehouseReceiptStatus = async (id, statusPayload) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-receipts/${id}/status`,
    statusPayload
  );
  return response.data;
};

export const deleteWarehouseReceipt = async (id) => {
  const response = await axiosInstance.delete(
    `/inventory/warehouse-receipts/${id}`
  );
  return response.data;
};


export default {
  getWarehouseReceiptsPageable,
  createWarehouseReceipt,
  getWarehouseReceiptByCode,
  updateWarehouseReceipt,
  updateWarehouseReceiptStatus,
  deleteWarehouseReceipt,
};