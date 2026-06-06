import axiosInstance from "./authService";

export const lookupCompanyByTaxCode = async (taxCode) => {
  const response = await axiosInstance.get(`/external/company/tax-code/${taxCode}`);
  return response.data;
};

export default {
  lookupCompanyByTaxCode,
};
