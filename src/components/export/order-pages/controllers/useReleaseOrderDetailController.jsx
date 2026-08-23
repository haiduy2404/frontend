import { useMemo, useState } from "react";

import { getReleaseOrderByCode } from "../../../../services/releaseOrderService";

function useReleaseOrderDetailController() {
  const [detailRows, setDetailRows] = useState([]);
  const [selectedReleaseDetail, setSelectedReleaseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSearch, setDetailSearch] = useState("");

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const text = String(value).trim();

    if (!text) return 0;

    let normalized = text;

    if (text.includes(",") && text.includes(".")) {
      normalized = text.replace(/\./g, "").replace(",", ".");
    } else if (text.includes(",")) {
      normalized = text.replace(",", ".");
    } else if ((text.match(/\./g) || []).length > 1) {
      normalized = text.replace(/\./g, "");
    }

    const number = Number(normalized);

    return Number.isNaN(number) ? 0 : number;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const filteredDetailRows = useMemo(() => {
    const keyword = detailSearch.trim().toLowerCase();

    if (!keyword) return detailRows;

    return detailRows.filter((item) => {
      const searchableText = [
        item.goods_code,
        item.goods_name,
        item.goods_unit_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [detailRows, detailSearch]);

  const clearReleaseOrderDetail = () => {
    setDetailRows([]);
    setSelectedReleaseDetail(null);
  };

  const fetchReleaseOrderDetail = async (code) => {
    if (!code) {
      clearReleaseOrderDetail();
      return;
    }

    try {
      setDetailLoading(true);

      const response = await getReleaseOrderByCode(code);
      const data = response?.data || response;

      setSelectedReleaseDetail(data);
      setDetailRows(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error(
        "LOAD RELEASE ORDER DETAIL ERROR:",
        error.response?.data || error
      );
      setSelectedReleaseDetail(null);
      setDetailRows([]);
      alert("Không tải được chi tiết hàng hóa xuất kho");
    } finally {
      setDetailLoading(false);
    }
  };

  return {
    detailRows,
    selectedReleaseDetail,
    detailLoading,
    detailSearch,
    setDetailSearch,
    filteredDetailRows,
    fetchReleaseOrderDetail,
    clearReleaseOrderDetail,
    parseNumber,
    formatViNumber,
  };
}

export default useReleaseOrderDetailController;
