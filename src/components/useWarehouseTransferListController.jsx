export const unwrapWarehouseTransferList = (data) => {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.results)
    ? data.data.results
    : Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data?.items)
    ? data.data.items
    : [];
};

export const getTransferCode = (transfer) =>
  transfer?.code ||
  transfer?.transfer_code ||
  transfer?.warehouse_transfer_code ||
  "";

export const isPendingTransferStatus = (status) =>
  status === "PENDING" || status === "CANCELLED";

export const getTransferStatusText = (status) => {
  switch (status) {
    case "PENDING":
      return "Đang điều chuyển";

    case "COMPLETED":
      return "Đã hoàn thành";

    case "CANCELLED":
      return "Đang điều chuyển";

    default:
      return "-";
  }
};
