import { useCallback, useEffect, useMemo, useState } from "react";
import { getReleaseOrdersPageable } from "../../../../services/releaseOrderService";
import { getWarehouses } from "../../../../services/warehouseService";
import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../../../utils/listPageStateStorage";
import {
  getDefaultWarehouseReleaseFilters,
  buildWarehouseReleaseFilterParams,
} from "../utils/warehouseReleaseFilterUtils";

const LIST_PAGE_STATE_KEY = "warehouse-release-page-state";

const unwrapData = (response) => response?.data || response;

const getRowCode = (row) => row?.code || row?.release_code || "";

const getWarehouseDisplayName = (warehouse) =>
  warehouse?.name ||
  warehouse?.warehouse_name ||
  warehouse?.code ||
  warehouse?.id ||
  "";

const getReleaseStatusText = (status) => {
  switch (status) {
    case "PENDING":
      return "Đang xuất kho";
    case "WAITING_RELEASE":
      return "Chờ xuất kho";
    case "RELEASED":
      return "Đã xuất kho";
    case "COMPLETED":
      return "Đã hoàn thành";
    case "WAIT_TO_APPROVE":
      return "Chờ duyệt";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status || "-";
  }
};

function useWarehouseReleaseListController({
  onLoadDetail,
  onClearDetail,
} = {}) {
  const storedState = getStoredListPageState(LIST_PAGE_STATE_KEY, {});

  const [releaseOrders, setReleaseOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [selectedId, setSelectedId] = useState(
    storedState.selectedId || null
  );

  const [selectedIds, setSelectedIds] = useState(
    Array.isArray(storedState.selectedIds) ? storedState.selectedIds : []
  );

  const [search, setSearch] = useState(storedState.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    storedState.debouncedSearch || ""
  );

  const [filters, setFilters] = useState(
    storedState.filters || getDefaultWarehouseReleaseFilters()
  );

  const [page, setPage] = useState(() => {
    const value = Number(storedState.page);
    return Number.isFinite(value) && value > 0 ? value : 1;
  });

  const [pageSize, setPageSize] = useState(() => {
    const value = Number(storedState.pageSize);
    return Number.isFinite(value) && value > 0 ? value : 30;
  });

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const selectedRow = useMemo(
    () => releaseOrders.find((row) => row.id === selectedId) || null,
    [releaseOrders, selectedId]
  );

  const isAllChecked =
    releaseOrders.length > 0 &&
    releaseOrders.every((row) => selectedIds.includes(row.id));

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await getWarehouses();
      const data = unwrapData(response);

      const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setWarehouses(results);
    } catch (error) {
      console.error(
        "LOAD WAREHOUSES ERROR:",
        error.response?.data || error
      );
      setWarehouses([]);
    }
  }, []);

  const fetchReleaseOrders = useCallback(
    async (customParams = {}, currentFilters = filters) => {
      try {
        setLoading(true);

        const filterParams =
          buildWarehouseReleaseFilterParams(currentFilters);

        const response = await getReleaseOrdersPageable({
          search: debouncedSearch,
          page,
          page_size: pageSize,
          ...filterParams,
          ...customParams,
          in_final_release_tab: 1,
        });

        const data = unwrapData(response);
        const results = Array.isArray(data?.results) ? data.results : [];

        setReleaseOrders(results);
        setSelectedIds([]);
        setTotal(data?.total || data?.count || results.length);

        if (results.length === 0) {
          setSelectedId(null);
          onClearDetail?.();
          return;
        }

        const currentStillExists =
          selectedId && results.some((row) => row.id === selectedId);

        if (currentStillExists) {
          const currentRow =
            results.find((row) => row.id === selectedId) || null;

          if (currentRow) {
            await onLoadDetail?.(getRowCode(currentRow));
          }

          return;
        }

        const firstRow = results[0];

        setSelectedId(firstRow.id);
        await onLoadDetail?.(getRowCode(firstRow));
      } catch (error) {
        console.error(
          "LOAD RELEASE ORDERS ERROR:",
          error.response?.data || error
        );

        alert(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "Không tải được danh sách lệnh xuất kho"
        );

        setReleaseOrders([]);
        setSelectedIds([]);
        setSelectedId(null);
        setTotal(0);
        onClearDetail?.();
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearch,
      filters,
      page,
      pageSize,
      selectedId,
      onLoadDetail,
      onClearDetail,
    ]
  );

  useEffect(() => {
    saveStoredListPageState(LIST_PAGE_STATE_KEY, {
      search,
      debouncedSearch,
      page,
      pageSize,
      filters,
      selectedId,
      selectedIds,
    });
  }, [
    search,
    debouncedSearch,
    page,
    pageSize,
    filters,
    selectedId,
    selectedIds,
  ]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchReleaseOrders();
  }, [page, pageSize, debouncedSearch]); // intentionally follows old trigger set

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSelectRow = async (row) => {
    setSelectedId(row.id);
    await onLoadDetail?.(getRowCode(row));
  };

  const handleToggleAll = (event) => {
    const checked = event.target.checked;
    setSelectedIds(checked ? releaseOrders.map((row) => row.id) : []);
  };

  const handleToggleOne = (event, rowId) => {
    event.stopPropagation();

    setSelectedIds((previous) =>
      previous.includes(rowId)
        ? previous.filter((id) => id !== rowId)
        : [...previous, rowId]
    );
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    const nextFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(nextFilters);
    setPage(1);

    if (
      nextFilters.time_type === "custom" &&
      (!nextFilters.start_date || !nextFilters.end_date)
    ) {
      return;
    }

    fetchReleaseOrders({ page: 1 }, nextFilters);
  };

  const handleTimeTypeChange = (event) => {
    const value = event.target.value;

    const nextFilters = {
      ...filters,
      time_type: value,
    };

    setFilters(nextFilters);
    setPage(1);

    if (value === "custom") return;

    fetchReleaseOrders({ page: 1 }, nextFilters);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  const handlePreviousPage = () => {
    setPage((previous) => Math.max(1, previous - 1));
  };

  const handleNextPage = () => {
    if (page * pageSize >= total) return;
    setPage((previous) => previous + 1);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectedId(null);
  };

  return {
    releaseOrders,
    warehouses,
    loading,
    total,

    search,
    filters,
    page,
    pageSize,

    selectedId,
    selectedIds,
    selectedRow,
    isAllChecked,

    setSelectedId,
    setSelectedIds,

    fetchReleaseOrders,
    clearSelection,

    handleSearchChange,
    handleSelectRow,
    handleToggleAll,
    handleToggleOne,
    handleFilterChange,
    handleTimeTypeChange,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,

    getReleaseStatusText,
    getWarehouseDisplayName,
    getRowCode,
  };
}

export default useWarehouseReleaseListController;
