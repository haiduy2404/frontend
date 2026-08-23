import { useEffect, useState } from "react";

import { getReleaseOrdersPageable } from "../../../../services/releaseOrderService";
import {
  getDefaultWarehouseReleaseFilters,
  buildWarehouseReleaseFilterParams,
} from "../../release-pages/utils/warehouseReleaseFilterUtils";
import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../../../utils/listPageStateStorage";

const LIST_PAGE_STATE_KEY = "release-order-page-state";

function useReleaseOrderListController({
  onLoadDetail,
  onClearDetail,
} = {}) {
  const [selectedId, setSelectedId] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.selectedId || null;
  });
  const [selectedIds, setSelectedIds] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return Array.isArray(stored.selectedIds) ? stored.selectedIds : [];
  });
  const [releaseOrders, setReleaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.search || "";
  });
  const [debouncedSearch, setDebouncedSearch] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.debouncedSearch || "";
  });
  const [page, setPage] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    const parsedPage = Number(stored.page);
    return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    const parsedPageSize = Number(stored.pageSize);
    return Number.isFinite(parsedPageSize) && parsedPageSize > 0
      ? parsedPageSize
      : 30;
  });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.filters || getDefaultWarehouseReleaseFilters();
  });

  const unwrapData = (response) => response?.data || response;

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
  }, [debouncedSearch, filters, page, pageSize, search, selectedId, selectedIds]);

  const selectedRow = releaseOrders.find((item) => item.id === selectedId);

  const getReleaseStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "Nháp";
      case "WAIT_TO_APPROVE":
        return "Đã duyệt";
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return "-";
    }
  };

  const fetchReleaseOrders = async (
    customParams = {},
    currentFilters = filters
  ) => {
    try {
      setLoading(true);

      const filterParams = buildWarehouseReleaseFilterParams(currentFilters);

      const response = await getReleaseOrdersPageable({
        search,
        page,
        page_size: pageSize,
        ...filterParams,
        ...customParams,
      });

      const data = unwrapData(response);
      const results = Array.isArray(data?.results) ? data.results : [];

      setReleaseOrders(results);
      const activeSelectedIds = (selectedIds || []).filter((id) =>
        results.some((row) => row.id === id)
      );
      setSelectedIds(activeSelectedIds);
      setTotal(data?.total || data?.count || results.length);

      if (results.length > 0) {
        const matchedSelectedRow = results.find((row) => row.id === selectedId);

        if (matchedSelectedRow) {
          setSelectedId(matchedSelectedRow.id);
          onLoadDetail?.(
            matchedSelectedRow.code || matchedSelectedRow.release_code
          );
        } else {
          const firstRow = results[0];
          setSelectedId(firstRow.id);
          onLoadDetail?.(firstRow.code || firstRow.release_code);
        }
      } else {
        setSelectedId(null);
        onClearDetail?.();
      }
    } catch (error) {
      console.error("LOAD RELEASE ORDERS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách phiếu xuất kho");
      setReleaseOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    const nextFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(nextFilters);
    setPage(1);

    if (nextFilters.time_type === "custom") {
      if (!nextFilters.start_date || !nextFilters.end_date) return;
    }

    fetchReleaseOrders(
      {
        page: 1,
        ...buildWarehouseReleaseFilterParams(nextFilters),
      },
      nextFilters
    );
  };

  const handleTimeTypeChange = (event) => {
    const value = event.target.value;

    const nextFilters = {
      ...filters,
      time_type: value,
      start_date: value === "custom" ? filters.start_date : "",
      end_date: value === "custom" ? filters.end_date : "",
    };

    setFilters(nextFilters);
    setPage(1);

    if (value === "custom") return;

    fetchReleaseOrders(
      {
        page: 1,
        ...buildWarehouseReleaseFilterParams(nextFilters),
      },
      nextFilters
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchReleaseOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch]);

  const isAllChecked =
    releaseOrders.length > 0 &&
    releaseOrders.every((row) => selectedIds.includes(row.id));

  const handleSearchChange = (value) => {
    setSearch(value);
    setSelectedIds([]);
  };

  const handleSelectRow = (row) => {
    setSelectedId(row.id);
    onLoadDetail?.(row.code || row.release_code);
  };

  const handleToggleAll = (event) => {
    const checked = event.target.checked;

    if (checked) {
      setSelectedIds(releaseOrders.map((row) => row.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (event, rowId) => {
    event.stopPropagation();

    setSelectedIds((previous) => {
      if (previous.includes(rowId)) {
        return previous.filter((id) => id !== rowId);
      }

      return [...previous, rowId];
    });
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setPage(1);
  };

  return {
    releaseOrders,
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
    getReleaseStatusText,
    setSelectedId,
    setSelectedIds,
    setPage,
    fetchReleaseOrders,
    handleSearchChange,
    handleSelectRow,
    handleToggleAll,
    handleToggleOne,
    handleFilterChange,
    handleTimeTypeChange,
    handlePageSizeChange,
    handlePreviousPage: () => setPage((previous) => previous - 1),
    handleNextPage: () => setPage((previous) => previous + 1),
  };
}

export default useReleaseOrderListController;
