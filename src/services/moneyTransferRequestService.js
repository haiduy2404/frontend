import axiosInstance from "./authService";

export const getMoneyTransferRequests = async (params = {}) => {
  const response = await axiosInstance.get(
    "/inventory/money-transfer-requests/pageable",
    { params }
  );

  return response.data;
};

export const getMoneyTransferRequestById = async (requestId) => {
  const response = await axiosInstance.get(
    `/inventory/money-transfer-requests/${requestId}`
  );

  return response.data;
};

export const createMoneyTransferRequest = async (payload) => {
  const response = await axiosInstance.post(
    "/inventory/money-transfer-requests",
    payload
  );

  return response.data;
};

export const updateMoneyTransferRequest = async (requestId, payload) => {
  const response = await axiosInstance.put(
    `/inventory/money-transfer-requests/${requestId}`,
    payload
  );

  return response.data;
};

export const deleteMoneyTransferRequest = async (requestId) => {
  const response = await axiosInstance.delete(
    `/inventory/money-transfer-requests/${requestId}`
  );

  return response.data;
};
