export const getDefaultImportOrderFilters = () => ({
  time_type: "last_3_months",
  start_date: "",
  end_date: "",
  status: "",
});

const pad2 = (value) => String(value).padStart(2, "0");

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());

  return `${year}-${month}-${day}`;
};

export const getLast3MonthsDateRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const startDate = new Date(year, month - 2, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
};

export const getQuarterDateRange = (
  quarter,
  year = new Date().getFullYear()
) => {
  switch (quarter) {
    case "quarter_1":
      return {
        start_date: `${year}-01-01`,
        end_date: `${year}-03-31`,
      };

    case "quarter_2":
      return {
        start_date: `${year}-04-01`,
        end_date: `${year}-06-30`,
      };

    case "quarter_3":
      return {
        start_date: `${year}-07-01`,
        end_date: `${year}-09-30`,
      };

    case "quarter_4":
      return {
        start_date: `${year}-10-01`,
        end_date: `${year}-12-31`,
      };

    default:
      return {
        start_date: "",
        end_date: "",
      };
  }
};

export const buildImportOrderFilterParams = (filters = {}) => {
  const dateParams =
    filters.time_type === "last_3_months"
      ? getLast3MonthsDateRange()
      : filters.time_type === "custom"
      ? {
          ...(filters.start_date ? { start_date: filters.start_date } : {}),
          ...(filters.end_date ? { end_date: filters.end_date } : {}),
        }
      : getQuarterDateRange(filters.time_type);

  return {
    ...dateParams,
    ...(filters.status ? { status: filters.status } : {}),
  };
};

export const validateImportOrderDateFilter = (filters = {}) => {
  if (filters.time_type !== "custom") {
    return "";
  }

  if (!filters.start_date || !filters.end_date) {
    return "Vui lòng chọn đầy đủ từ ngày và đến ngày";
  }

  if (new Date(filters.start_date) > new Date(filters.end_date)) {
    return "Ngày bắt đầu không được lớn hơn ngày kết thúc";
  }

  return "";
};