import axiosInstance from "./authService";

const BASE_URL = "/inventory/reports/receipt";

/**
 * Báo cáo nhập kho chi tiết theo từng dòng vật tư.
 *
 * GET /api/inventory/reports/receipt/pageable
 *
 * Params optional:
 * - company_id
 * - start_date
 * - end_date
 * - search
 * - page
 * - page_size
 */
export const getWarehouseReceiptDetailReport = async (params = {}) => {
  const response = await axiosInstance.get(
    `${BASE_URL}/pageable`,
    {
      params,
    }
  );

  return response.data;
};

export default {
  getWarehouseReceiptDetailReport,
};