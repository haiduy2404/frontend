import { useCallback, useEffect, useMemo, useState } from "react";
import { getWarehouseTransfersPageable } from "../../../../services/warehouseTransferService";
import { normalizeWarehouseTransferPage } from "../utils/warehouseTransferUtils";

export default function useWarehouseTransferListController() {
  const [transfers, setTransfers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [timeRange, setTimeRange] = useState("last_3_months");
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRow = useMemo(
    () =>
      transfers.find((item) => item.id === selectedTransferId) ||
      transfers[0] ||
      null,
    [transfers, selectedTransferId]
  );

  const handleSelectTransfer = (transferId) => {
    setSelectedTransferId(transferId);
  };

  const clearSelection = () => {
    setSelectedTransferId(null);
  };

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        search: keyword || undefined,
        status: status || undefined,
        page_size: pageSize,
      };

      if (timeRange === "last_3_months") {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        params.start_date = `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

        params.end_date = `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
      } else if (timeRange !== "all") {
        params.time_range = timeRange;
      }

      const response = await getWarehouseTransfersPageable(params);
      const { items, count } = normalizeWarehouseTransferPage(response);

      setTransfers(items);
      setTotalCount(count);

      setSelectedTransferId((currentId) => {
        if (currentId && items.some((item) => item.id === currentId)) {
          return currentId;
        }
        return items[0]?.id ?? null;
      });
    } catch (loadError) {
      console.error("Load warehouse transfers error:", loadError);
      setTransfers([]);
      setTotalCount(0);
      setSelectedTransferId(null);
      setError("Không thể tải danh sách phiếu điều chuyển");
    } finally {
      setLoading(false);
    }
  }, [keyword, status, timeRange, pageSize]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  return {
    transfers,
    totalCount,
    keyword,
    setKeyword,
    status,
    setStatus,
    timeRange,
    setTimeRange,
    pageSize,
    setPageSize,
    selectedTransferId,
    selectedRow,
    loading,
    error,
    handleSelectTransfer,
    clearSelection,
    loadTransfers,
  };
}
