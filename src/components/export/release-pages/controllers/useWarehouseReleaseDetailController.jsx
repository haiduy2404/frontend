import { useMemo, useState } from "react";
import { getReleaseOrderByCode } from "../../../../services/releaseOrderService";

const unwrapData = (response) => response?.data || response;

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : value;
  }

  const text = String(value).trim();
  if (!text) return 0;

  let normalized = text;

  if (text.includes(",")) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if ((text.match(/\./g) || []).length > 1) {
    normalized = text.replace(/\./g, "");
  }

  const number = Number(normalized);
  return Number.isNaN(number) ? 0 : number;
};

const formatViNumber = (value, fractionDigits = 2) =>
  parseNumber(value).toLocaleString("vi-VN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

function useWarehouseReleaseDetailController() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailSearch, setDetailSearch] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  const filteredDetailRows = useMemo(() => {
    const keyword = detailSearch.trim().toLowerCase();

    if (!keyword) return detailRows;

    return detailRows.filter((item) => {
      const searchableText = [
        item.goods_code,
        item.goods_name,
        item.unit_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [detailRows, detailSearch]);

  const clearReleaseOrderDetail = () => {
    setSelectedOrder(null);
    setDetailRows([]);
    setDetailSearch("");
  };

  const fetchReleaseOrderDetail = async (code) => {
    if (!code) return null;

    try {
      setDetailLoading(true);

      const response = await getReleaseOrderByCode(code);
      const data = unwrapData(response);

      const rows = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.inventory_lines)
        ? data.inventory_lines
        : Array.isArray(data?.release_inventory_lines)
        ? data.release_inventory_lines
        : Array.isArray(data?.details)
        ? data.details
        : [];

      const mappedRows = rows.map((item, index) => {
        const requestedQuantity = parseNumber(
          item.request_quantity ??
            item.requested_quantity ??
            item.original_quantity ??
            0
        );

        const actualQuantity = parseNumber(
          item.actual_quantity ??
            item.release_quantity ??
            item.exported_quantity ??
            0
        );

        const conversionRatio =
          parseNumber(
            item.conversion_ratio ??
              item.goods_conversion_ratio ??
              item.unit_conversion_ratio ??
              1
          ) || 1;

        return {
          id:
            item.item_id ||
            item.release_inventory_id ||
            item.inventory_id ||
            item.id ||
            index + 1,

          item_id:
            item.item_id ||
            item.release_inventory_id ||
            item.inventory_id ||
            item.id ||
            "",

          goods_id: item.goods_id || item.goods?.id || "",

          goods_code:
            item.goods_code || item.goods?.code || item.code || "",

          goods_name:
            item.goods_name || item.goods?.name || item.name || "",

          goods_unit_id:
            item.goods_unit_id ||
            item.unit_id ||
            item.goods_unit?.id ||
            "",

          unit_name:
            item.goods_unit_name ||
            item.unit_name ||
            item.goods_unit?.name ||
            "",

          conversion_ratio: conversionRatio,
          requested_quantity: formatViNumber(requestedQuantity, 2),
          actual_quantity:
            item.actual_quantity === null ||
            item.actual_quantity === undefined
              ? ""
              : formatViNumber(actualQuantity, 2),
        };
      });

      setSelectedOrder(data);
      setDetailRows(mappedRows);

      return data;
    } catch (error) {
      console.error(
        "LOAD RELEASE DETAIL ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Không tải được chi tiết lệnh xuất kho"
      );

      clearReleaseOrderDetail();
      return null;
    } finally {
      setDetailLoading(false);
    }
  };

  return {
    selectedOrder,
    detailRows,
    detailSearch,
    detailLoading,
    filteredDetailRows,

    setDetailSearch,

    fetchReleaseOrderDetail,
    clearReleaseOrderDetail,

    parseNumber,
    formatViNumber,
  };
}

export default useWarehouseReleaseDetailController;
