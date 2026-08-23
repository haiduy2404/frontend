import {
  useEffect,
  useState,
} from "react";

import {
  getWarehouseReceiptsPageable,
} from "../../services/warehouseReceiptService";

import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../utils/listPageStateStorage";

import {
  unwrapData,
} from "../../utils/apiUtils";

import {
  getDefaultImportOrderFilters,
  buildImportOrderFilterParams,
} from "../../pages/activity/import/utils/importOrderFilterUtils";


const LIST_PAGE_STATE_KEY =
  "import-order-page-state";


function useImportOrderListController({
  onLoadDetail,
  onClearDetail,
}) {
  /* =========================================================
     RESTORE
     ========================================================= */

  const [
    selectedId,
    setSelectedId,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    return (
      stored.selectedId ||
      null
    );
  });


  const [
    selectedIds,
    setSelectedIds,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    return Array.isArray(
      stored.selectedIds
    )
      ? stored.selectedIds
      : [];
  });


  const [
    search,
    setSearch,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    return stored.search || "";
  });


  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    return (
      stored.debouncedSearch ||
      ""
    );
  });


  const [
    page,
    setPage,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    const parsedPage =
      Number(stored.page);

    return (
      Number.isFinite(
        parsedPage
      ) &&
      parsedPage > 0
        ? parsedPage
        : 1
    );
  });


  const [
    pageSize,
    setPageSize,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    const parsedPageSize =
      Number(
        stored.pageSize
      );

    return (
      Number.isFinite(
        parsedPageSize
      ) &&
      parsedPageSize > 0
        ? parsedPageSize
        : 30
    );
  });


  const [
    filters,
    setFilters,
  ] = useState(() => {
    const stored =
      getStoredListPageState(
        LIST_PAGE_STATE_KEY,
        {}
      );

    return (
      stored.filters ||
      getDefaultImportOrderFilters()
    );
  });


  /* =========================================================
     LIST
     ========================================================= */

  const [
    importOrders,
    setImportOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    total,
    setTotal,
  ] = useState(0);


  /* =========================================================
     SAVE PAGE STATE
     ========================================================= */

  useEffect(() => {
    saveStoredListPageState(
      LIST_PAGE_STATE_KEY,
      {
        search,
        debouncedSearch,
        page,
        pageSize,
        filters,
        selectedId,
        selectedIds,
      }
    );
  }, [
    search,
    debouncedSearch,
    page,
    pageSize,
    filters,
    selectedId,
    selectedIds,
  ]);


  /* =========================================================
     STATUS
     ========================================================= */

  const isWaitingDeliveryStatus =
    (status) =>
      status ===
        "WAITING_DELIVERY" ||
      status ===
        "CANCELLED";


  const getReceiptStatusText =
    (status) => {
      switch (status) {
        case "WAITING_DELIVERY":
          return "Chờ nhận hàng";

        case "RECEIVED":
          return "Đã nhận hàng";

        case "COMPLETED":
          return "Đã hoàn thành";

        case "CANCELLED":
          return "Chờ nhận hàng";

        default:
          return "-";
      }
    };


  /* =========================================================
     FETCH LIST
     ========================================================= */

  const fetchImportOrders =
    async (
      customParams = {}
    ) => {
      try {
        setLoading(true);

        const filterParams =
          buildImportOrderFilterParams(
            filters
          );

        const response =
          await getWarehouseReceiptsPageable(
            {
              search,
              page,

              page_size:
                pageSize,

              ...filterParams,
              ...customParams,
            }
          );

        const data =
          unwrapData(response);

        const results =
          Array.isArray(
            data?.results
          )
            ? data.results
            : [];

        setImportOrders(
          results
        );


        const activeSelectedIds =
          selectedIds.filter(
            (selectedRowId) =>
              results.some(
                (row) =>
                  row.id ===
                  selectedRowId
              )
          );

        setSelectedIds(
          activeSelectedIds
        );


        setTotal(
          data?.total ||
            results.length
        );


        if (
          results.length === 0
        ) {
          setSelectedId(null);

          onClearDetail?.();

          return;
        }


        const matchedSelectedRow =
          results.find(
            (row) =>
              row.id ===
              selectedId
          );


        if (
          matchedSelectedRow
        ) {
          setSelectedId(
            matchedSelectedRow.id
          );

          await onLoadDetail?.(
            matchedSelectedRow.code
          );

          return;
        }


        const firstRow =
          results[0];

        setSelectedId(
          firstRow.id
        );

        await onLoadDetail?.(
          firstRow.code
        );
      } catch (error) {
        console.error(
          "LOAD IMPORT ORDERS ERROR:",
          error.response?.data ||
            error
        );

        alert(
          "Không tải được danh sách phiếu nhập"
        );

        setImportOrders([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };


  /* =========================================================
     SEARCH
     ========================================================= */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        setPage(1);

        setDebouncedSearch(
          search
        );
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [search]);


  useEffect(() => {
    fetchImportOrders();
  }, [
    page,
    pageSize,
    debouncedSearch,
  ]);


  const handleSearchChange =
    (value) => {
      setSearch(value);

      setSelectedIds([]);
    };


  /* =========================================================
     ROW SELECT
     ========================================================= */

  const handleSelectRow =
    async (row) => {
      if (!row) {
        return;
      }

      setSelectedId(
        row.id
      );

      await onLoadDetail?.(
        row.code
      );
    };


  /* =========================================================
     CHECKBOX
     ========================================================= */

  const waitingDeliveryRows =
    importOrders.filter(
      (row) =>
        isWaitingDeliveryStatus(
          row.status
        )
    );


  const isAllChecked =
    waitingDeliveryRows.length >
      0 &&
    waitingDeliveryRows.every(
      (row) =>
        selectedIds.includes(
          row.id
        )
    );


  const handleToggleAll =
    (event) => {
      const checked =
        event.target.checked;

      if (!checked) {
        setSelectedIds([]);

        return;
      }

      if (
        waitingDeliveryRows.length ===
        0
      ) {
        alert(
          "Không có phiếu Chờ nhận hàng để trình duyệt"
        );

        return;
      }

      setSelectedIds(
        waitingDeliveryRows.map(
          (row) => row.id
        )
      );
    };


  const handleToggleOne =
    (
      event,
      row
    ) => {
      event.stopPropagation();

      if (
        !isWaitingDeliveryStatus(
          row.status
        )
      ) {
        return;
      }

      setSelectedIds(
        (previous) => {
          if (
            previous.includes(
              row.id
            )
          ) {
            return previous.filter(
              (selectedRowId) =>
                selectedRowId !==
                row.id
            );
          }

          return [
            ...previous,
            row.id,
          ];
        }
      );
    };


  /* =========================================================
     FILTER
     ========================================================= */

  const handleFilterChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      const nextFilters = {
        ...filters,
        [name]: value,
      };

      setFilters(
        nextFilters
      );


      if (
        nextFilters.time_type ===
        "custom"
      ) {
        if (
          !nextFilters.start_date ||
          !nextFilters.end_date
        ) {
          return;
        }

        if (
          new Date(
            nextFilters.start_date
          ) >
          new Date(
            nextFilters.end_date
          )
        ) {
          alert(
            "Ngày bắt đầu không được lớn hơn ngày kết thúc"
          );

          return;
        }
      }


      const filterParams =
        buildImportOrderFilterParams(
          nextFilters
        );

      setPage(1);

      fetchImportOrders({
        page: 1,
        ...filterParams,
      });
    };


  const handleTimeTypeChange =
    (event) => {
      const value =
        event.target.value;

      const nextFilters = {
        ...filters,

        time_type: value,

        start_date:
          value === "custom"
            ? filters.start_date
            : "",

        end_date:
          value === "custom"
            ? filters.end_date
            : "",
      };

      setFilters(
        nextFilters
      );

      setPage(1);


      if (
        value === "custom"
      ) {
        return;
      }


      const filterParams =
        buildImportOrderFilterParams(
          nextFilters
        );

      fetchImportOrders({
        page: 1,
        ...filterParams,
      });
    };


  /* =========================================================
     PAGINATION
     ========================================================= */

  const handlePageSizeChange =
    (value) => {
      setPageSize(value);
      setPage(1);
    };


  const handlePreviousPage =
    () => {
      setPage(
        (previous) =>
          previous - 1
      );
    };


  const handleNextPage =
    () => {
      setPage(
        (previous) =>
          previous + 1
      );
    };


  /* =========================================================
     SELECTED ROW
     ========================================================= */

  const selectedRow =
    importOrders.find(
      (row) =>
        row.id ===
        selectedId
    ) || null;


  return {
    importOrders,
    loading,
    total,

    search,
    filters,

    page,
    pageSize,

    selectedId,
    selectedIds,
    selectedRow,

    setSelectedId,
    setSelectedIds,
    setPage,

    waitingDeliveryRows,
    isAllChecked,

    isWaitingDeliveryStatus,
    getReceiptStatusText,

    fetchImportOrders,

    handleSearchChange,

    handleSelectRow,

    handleToggleAll,
    handleToggleOne,

    handleFilterChange,
    handleTimeTypeChange,

    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,
  };
}


export default useImportOrderListController;