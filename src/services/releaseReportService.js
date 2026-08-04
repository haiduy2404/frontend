import axiosInstance from "./authService";

const RELEASE_REPORT_ENDPOINT =
  "/inventory/reports/release/pageable";

export const getReleaseReportPageable = async (params = {}) => {
  const page = Math.max(1, Number(params.page) || 1);

  const pageSize = Math.min(
    100,
    Math.max(1, Number(params.page_size) || 20)
  );

  const queryParams = {
    page,
    page_size: pageSize,
  };

  if (params.warehouse_id) {
    queryParams.warehouse_id = params.warehouse_id;
  }

  if (params.receiver_unit_id) {
    queryParams.receiver_unit_id = params.receiver_unit_id;
  }

  if (params.release_target_id) {
    queryParams.release_target_id = params.release_target_id;
  }

  if (params.start_date) {
    queryParams.start_date = params.start_date;
  }

  if (params.end_date) {
    queryParams.end_date = params.end_date;
  }

  if (typeof params.search === "string" && params.search.trim()) {
    queryParams.search = params.search.trim();
  }

  const response = await axiosInstance.get(
    RELEASE_REPORT_ENDPOINT,
    {
      params: queryParams,
    }
  );

  return response.data;
};

export default {
  getReleaseReportPageable,
};