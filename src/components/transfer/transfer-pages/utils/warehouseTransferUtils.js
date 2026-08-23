export const normalizeWarehouseTransferPage = (data) => {
  const candidates = [
    data,
    data?.data?.results,
    data?.results,
    data?.data,
    data?.items,
    data?.data?.items,
  ];

  const items = candidates.find(Array.isArray) || [];

  const count =
    data?.data?.count ??
    data?.count ??
    data?.data?.total ??
    data?.total ??
    items.length;

  return {
    items,
    count: Number(count) || 0,
  };
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

export const getTransferStatusClass = (status) => {
  if (status === "COMPLETED") return "completed";
  if (isPendingTransferStatus(status)) return "pending";
  return "default";
};

export const getFromWarehouseName = (transfer) =>
  transfer?.from_warehouse_name ||
  transfer?.source_warehouse_name ||
  transfer?.from_warehouse?.name ||
  transfer?.from_warehouse?.warehouse_name ||
  "-";

export const getToWarehouseName = (transfer) =>
  transfer?.to_warehouse_name ||
  transfer?.destination_warehouse_name ||
  transfer?.to_warehouse?.name ||
  transfer?.to_warehouse?.warehouse_name ||
  "-";

export const getFromWarehouseAddress = (transfer) =>
  transfer?.from_warehouse_address ||
  transfer?.source_warehouse_address ||
  transfer?.from_warehouse?.address ||
  "-";

export const getToWarehouseAddress = (transfer) =>
  transfer?.to_warehouse_address ||
  transfer?.destination_warehouse_address ||
  transfer?.to_warehouse?.address ||
  "-";

const firstArray = (...values) => values.find(Array.isArray) || [];

export const getTransferItems = (transfer) =>
  firstArray(
    transfer?.items,
    transfer?.details,
    transfer?.transfer_details,
    transfer?.warehouse_transfer_details,
    transfer?.goods,
    transfer?.products,
    transfer?.lines
  );

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const getItemRequestedQuantity = (item) =>
  toNumber(
    item?.requested_quantity ??
      item?.request_quantity ??
      item?.quantity_requested ??
      item?.quantity ??
      item?.original_quantity
  );

export const getItemActualQuantity = (item) =>
  toNumber(
    item?.actual_quantity ??
      item?.transferred_quantity ??
      item?.completed_quantity ??
      item?.received_quantity ??
      item?.quantity ??
      item?.remaining_quantity
  );

export const getItemCode = (item) =>
  item?.material_code ||
  item?.item_code ||
  item?.goods_code ||
  item?.product_code ||
  item?.material?.code ||
  item?.item?.code ||
  item?.code ||
  "-";

export const getItemName = (item) =>
  item?.material_name ||
  item?.item_name ||
  item?.goods_name ||
  item?.product_name ||
  item?.material?.name ||
  item?.item?.name ||
  item?.name ||
  "-";

export const getItemUnit = (item) =>
  item?.goods_unit_name ||
  item?.unit_name ||
  item?.unit ||
  item?.uom_name ||
  item?.goods_unit?.name ||
  item?.material?.unit_name ||
  item?.item?.unit_name ||
  "-";

export const formatQuantity = (value) =>
  new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

export const formatDateTimeVi = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const buildWarehouseTransferDetailView = (transfer) => {
  if (!transfer) return null;

  const items = getTransferItems(transfer);
  const totalRequestedFromItems = items.reduce(
    (sum, item) =>
      sum + getItemTransferQuantity(item),
    0
  );

  const totalActualFromItems = items.reduce(
    (sum, item) =>
      sum + getItemMainQuantity(item),
    0
  );
  const totalItems =
    transfer?.total_items ??
    transfer?.item_count ??
    transfer?.total_goods ??
    items.length;

  const totalRequested =
    transfer?.total_requested_quantity ??
    transfer?.requested_quantity ??
    transfer?.total_quantity ??
    totalRequestedFromItems;

  const totalActual =
    transfer?.total_quantity_in_default_unit ??
    transfer?.quantity_in_default_unit ??
    transfer?.total_main_quantity ??
    totalActualFromItems;

  return {
    raw: transfer,
    id: transfer?.id,
    code: getTransferCode(transfer) || "-",
    status: transfer?.status,
    statusText: getTransferStatusText(transfer?.status),
    statusClass: getTransferStatusClass(transfer?.status),
    fromWarehouse: getFromWarehouseName(transfer),
    toWarehouse: getToWarehouseName(transfer),
    fromAddress: getFromWarehouseAddress(transfer),
    toAddress: getToWarehouseAddress(transfer),
    reason: transfer?.reason || "-",
    createdBy:
      transfer?.created_by_name ||
      transfer?.creator_name ||
      transfer?.created_by?.full_name ||
      transfer?.created_by?.username ||
      transfer?.created_by?.name ||
      transfer?.created_by ||
      "-",
    createdAt:
      transfer?.created_at || transfer?.created_date || transfer?.transfer_date,
    transferDate: transfer?.transfer_date || transfer?.date || transfer?.created_at,
    startedAt:
      transfer?.started_at || transfer?.updated_at || transfer?.transfer_date,
    completedAt:
      transfer?.completed_at ||
      transfer?.completion_date ||
      (transfer?.status === "COMPLETED" ? transfer?.updated_at : null),
    note: transfer?.note || transfer?.notes || transfer?.description || "",
    items,
    totalItems: toNumber(totalItems),
    totalRequested: toNumber(totalRequested),
    totalActual: toNumber(totalActual),
  };
};

export const getItemTransferQuantity = (item) =>
  toNumber(
    item?.quantity ??
      item?.transfer_quantity ??
      item?.requested_quantity ??
      0
  );

export const getItemMainQuantity = (item) =>
  toNumber(
    item?.quantity_in_default_unit ??
      item?.transfer_main_quantity ??
      item?.quantity_in_main_unit ??
      item?.quantity ??
      0
  );
