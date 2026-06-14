import axiosInstance from "./authService";

export const getCompanies = async (params = {}) => {
  const response = await axiosInstance.get("/inventory/company", {
    params,
  });

  return response.data;
};

export const createCompany = async (payload) => {
  const response = await axiosInstance.post("/inventory/company", payload);

  return response.data;
};

export const updateCompany = async (id, payload) => {
  const response = await axiosInstance.put(`/inventory/company/${id}`, payload);

  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await axiosInstance.delete(`/inventory/company/${id}`);

  return response.data;
};

export const updateWarehouseReceipt = async (receiptId, payload) => {
  const response = await axiosInstance.put(
    `/inventory/warehouse-receipts/${receiptId}`,
    payload
  );

  return response.data;
};

export const createCompanyBankAccount = async (companyId, payload) => {
  const response = await axiosInstance.post(
    `/inventory/company/${companyId}/bank-accounts`,
    payload
  );

  return response.data;
};

export default {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  createCompanyBankAccount,
};