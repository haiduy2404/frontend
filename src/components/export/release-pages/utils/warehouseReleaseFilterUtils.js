const getCurrentYear = () => new Date().getFullYear();

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const getDefaultWarehouseReleaseFilters = () => ({
  warehouse_id: "",
  status: "",
  time_type: "last_3_months",
  start_date: "",
  end_date: "",
});

const getLast3MonthsDateRange = (date = new Date()) => {
  const startDate = new Date(date.getFullYear(), date.getMonth() - 2, 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
};

export const buildWarehouseReleaseFilterParams = (filters) => {
  const params = {};

  if (filters.warehouse_id) {
    params.warehouse_id = filters.warehouse_id;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  const year = getCurrentYear();

  if (filters.time_type === "last_3_months") {
    const range = getLast3MonthsDateRange();
    params.start_date = range.start_date;
    params.end_date = range.end_date;
  }

  if (filters.time_type === "quarter_1") {
    params.start_date = `${year}-01-01`;
    params.end_date = `${year}-03-31`;
  }

  if (filters.time_type === "quarter_2") {
    params.start_date = `${year}-04-01`;
    params.end_date = `${year}-06-30`;
  }

  if (filters.time_type === "quarter_3") {
    params.start_date = `${year}-07-01`;
    params.end_date = `${year}-09-30`;
  }

  if (filters.time_type === "quarter_4") {
    params.start_date = `${year}-10-01`;
    params.end_date = `${year}-12-31`;
  }

  if (filters.time_type === "custom") {
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
  }

  return params;
};