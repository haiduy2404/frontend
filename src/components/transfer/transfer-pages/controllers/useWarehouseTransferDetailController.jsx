import { useEffect, useMemo, useState } from "react";

import {
  buildWarehouseTransferDetailView,
  getTransferCode,
} from "../utils/warehouseTransferUtils";

import { getWarehouseTransferByCode } from "../../../../services/warehouseTransferService";

export default function useWarehouseTransferDetailController(
  selectedTransfer
) {
  const [transferDetail, setTransferDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const transferCode = getTransferCode(selectedTransfer);

  useEffect(() => {
    if (!transferCode) {
      setTransferDetail(null);
      setError("");
      return;
    }

    let cancelled = false;

    const loadTransferDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWarehouseTransferByCode(transferCode);

        console.log("WAREHOUSE TRANSFER DETAIL:", response);

        const data = response?.data ?? response;

        if (!cancelled) {
          setTransferDetail(data);
        }
      } catch (err) {
        console.error("LOAD WAREHOUSE TRANSFER DETAIL ERROR:", err);

        if (!cancelled) {
          setTransferDetail(null);
          setError("Không thể tải chi tiết phiếu điều chuyển.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTransferDetail();

    return () => {
      cancelled = true;
    };
  }, [transferCode]);

  const detail = useMemo(
    () => buildWarehouseTransferDetailView(transferDetail),
    [transferDetail]
  );

  return {
    detail,
    loading,
    error,
  };
}