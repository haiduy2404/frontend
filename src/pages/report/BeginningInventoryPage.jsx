import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiSearchLine,
} from "react-icons/ri";

import "../../styles/BeginningInventoryPage.css";

import { getWarehouses } from "../../services/warehouseService";

import {
  getBeginningInventories,
  captureBeginningInventory,
} from "../../services/openingStockService";

const WAREHOUSE_PAGE_SIZE = 10;

const unwrapPayload = (response) =>
  response?.data?.data ?? response?.data ?? response;

const extractResults = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getPayloadTotal = (payload, results) =>
  Number(
    payload?.total ??
      payload?.count ??
      payload?.total_count ??
      results.length
  );

const buildPeriodMonthParam = (months) => {
  if (!Array.isArray(months) || months.length === 0) {
    return undefined;
  }

  return months
    .filter(Boolean)
    .map((month) => `${month}-01`)
    .join(",");
};

const formatPeriodMonth = (value) => {
  if (!value) return "-";

  const text = String(value);
  const [year, month] = text.slice(0, 7).split("-");

  if (!year || !month) return text;

  return `${month}/${year}`;
};

const parseLocaleNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return NaN;
  }

  if (typeof value === "number") {
    return value;
  }

  const text = String(value).trim();

  if (!text) return NaN;

  if (text.includes(",")) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  return Number(text);
};

const formatViNumber = (value, fractionDigits = 3) => {
  const number = parseLocaleNumber(value);

  if (Number.isNaN(number)) return "-";

  return number.toLocaleString("vi-VN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("vi-VN");
};

function BeginningInventoryPage() {
  const warehouseRequestIdRef = useRef(0);
  const inventoryRequestIdRef = useRef(0);

  // =========================================================
  // DANH SÁCH TỒN KHO ĐẦU KỲ
  // =========================================================

  const [beginningInventories, setBeginningInventories] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [inventorySearch, setInventorySearch] = useState("");
  const [debouncedInventorySearch, setDebouncedInventorySearch] =
    useState("");

  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(30);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);

  const [filterWarehouses, setFilterWarehouses] = useState([]);
  const [selectedFilterWarehouse, setSelectedFilterWarehouse] =
    useState("");

  const [periodMonthInput, setPeriodMonthInput] = useState("");
  const [selectedPeriodMonths, setSelectedPeriodMonths] = useState([]);

  // =========================================================
  // MODAL TRÍCH XUẤT
  // =========================================================

  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [debouncedWarehouseSearch, setDebouncedWarehouseSearch] =
    useState("");

  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseTotal, setWarehouseTotal] = useState(0);
  const [warehouseTotalPages, setWarehouseTotalPages] = useState(1);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const [selectedWarehouses, setSelectedWarehouses] = useState({});

  const [captureLoading, setCaptureLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // HÀM ĐỌC DỮ LIỆU KHO
  // =========================================================

  const getWarehouseId = (warehouse) =>
    warehouse?.id ?? warehouse?.warehouse_id;

  const getWarehouseCode = (warehouse) =>
    warehouse?.code ?? warehouse?.warehouse_code ?? "";

  const getWarehouseName = (warehouse) =>
    warehouse?.name ?? warehouse?.warehouse_name ?? "";

  const selectedWarehouseList = useMemo(
    () => Object.values(selectedWarehouses),
    [selectedWarehouses]
  );

  const selectedWarehouseIds = useMemo(
    () =>
      selectedWarehouseList
        .map((warehouse) => getWarehouseId(warehouse))
        .filter(
          (warehouseId) =>
            warehouseId !== null &&
            warehouseId !== undefined &&
            warehouseId !== ""
        ),
    [selectedWarehouseList]
  );

  const allCurrentPageSelected =
    warehouses.length > 0 &&
    warehouses.every((warehouse) => {
      const warehouseId = getWarehouseId(warehouse);

      return Boolean(
        selectedWarehouses[String(warehouseId)]
      );
    });

  // =========================================================
  // DEBOUNCE TÌM TỒN KHO ĐẦU KỲ
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInventorySearch(inventorySearch.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [inventorySearch]);

  // =========================================================
  // DEBOUNCE TÌM KHO TRONG MODAL
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWarehouseSearch(warehouseSearch.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [warehouseSearch]);

  // =========================================================
  // TẢI DANH SÁCH KHO CHO FILTER CHÍNH
  // =========================================================

  useEffect(() => {
    const fetchFilterWarehouses = async () => {
      try {
        const response = await getWarehouses({
          page: 1,
          page_size: 500,
        });

        const payload = unwrapPayload(response);
        const results = extractResults(payload);

        setFilterWarehouses(results);
      } catch (error) {
        console.error(
          "GET FILTER WAREHOUSES ERROR:",
          error.response?.data || error
        );

        setFilterWarehouses([]);
      }
    };

    fetchFilterWarehouses();
  }, []);

  // =========================================================
  // GET DANH SÁCH TỒN KHO ĐẦU KỲ
  // =========================================================

  const fetchBeginningInventoryList = useCallback(
    async (pageNumber = inventoryPage) => {
      const requestId = ++inventoryRequestIdRef.current;

      try {
        setInventoryLoading(true);

        const response = await getBeginningInventories({
          search: debouncedInventorySearch || undefined,

          warehouse_id:
            selectedFilterWarehouse || undefined,

          list_period_month:
            buildPeriodMonthParam(selectedPeriodMonths),

          page: pageNumber,
          page_size: inventoryPageSize,
        });

        if (requestId !== inventoryRequestIdRef.current) {
          return;
        }

        const payload = unwrapPayload(response);
        const results = extractResults(payload);
        const total = getPayloadTotal(payload, results);

        const totalPages = Math.max(
          1,
          Number(payload?.total_pages) ||
            Math.ceil(total / inventoryPageSize) ||
            1
        );

        setBeginningInventories(results);
        setInventoryTotal(total);
        setInventoryTotalPages(totalPages);
      } catch (error) {
        if (requestId !== inventoryRequestIdRef.current) {
          return;
        }

        console.error(
          "GET BEGINNING INVENTORY ERROR:",
          error.response?.data || error
        );

        setBeginningInventories([]);
        setInventoryTotal(0);
        setInventoryTotalPages(1);

        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "Không tải được danh sách tồn kho đầu kỳ"
        );

        setShowErrorModal(true);
      } finally {
        if (requestId === inventoryRequestIdRef.current) {
          setInventoryLoading(false);
        }
      }
    },
    [
      debouncedInventorySearch,
      inventoryPage,
      inventoryPageSize,
      selectedFilterWarehouse,
      selectedPeriodMonths,
    ]
  );

  useEffect(() => {
    fetchBeginningInventoryList(inventoryPage);
  }, [fetchBeginningInventoryList, inventoryPage]);

  // =========================================================
  // CHỌN NHIỀU KỲ
  // =========================================================

  const handleAddPeriodMonth = () => {
    if (!periodMonthInput) return;

    setSelectedPeriodMonths((previous) => {
      if (previous.includes(periodMonthInput)) {
        return previous;
      }

      return [...previous, periodMonthInput].sort().reverse();
    });

    setPeriodMonthInput("");
    setInventoryPage(1);
  };

  const handleRemovePeriodMonth = (month) => {
    setSelectedPeriodMonths((previous) =>
      previous.filter((item) => item !== month)
    );

    setInventoryPage(1);
  };

  const handleClearFilters = () => {
    setInventorySearch("");
    setDebouncedInventorySearch("");
    setSelectedFilterWarehouse("");
    setSelectedPeriodMonths([]);
    setPeriodMonthInput("");
    setInventoryPage(1);
  };

  const hasActiveFilter =
    Boolean(inventorySearch) ||
    Boolean(selectedFilterWarehouse) ||
    selectedPeriodMonths.length > 0;

  // =========================================================
  // GET KHO PAGEABLE TRONG MODAL TRÍCH XUẤT
  // =========================================================

  useEffect(() => {
    if (!showCaptureModal) return;

    const fetchWarehouseList = async () => {
      const requestId = ++warehouseRequestIdRef.current;

      try {
        setWarehouseLoading(true);

        const response = await getWarehouses({
          search: debouncedWarehouseSearch || undefined,
          page: warehousePage,
          page_size: WAREHOUSE_PAGE_SIZE,
        });

        if (requestId !== warehouseRequestIdRef.current) {
          return;
        }

        const payload = unwrapPayload(response);
        const results = extractResults(payload);
        const total = getPayloadTotal(payload, results);

        const totalPages = Math.max(
          1,
          Number(payload?.total_pages) ||
            Math.ceil(total / WAREHOUSE_PAGE_SIZE) ||
            1
        );

        setWarehouses(results);
        setWarehouseTotal(total);
        setWarehouseTotalPages(totalPages);
      } catch (error) {
        if (requestId !== warehouseRequestIdRef.current) {
          return;
        }

        console.error(
          "GET CAPTURE WAREHOUSES ERROR:",
          error.response?.data || error
        );

        setWarehouses([]);
        setWarehouseTotal(0);
        setWarehouseTotalPages(1);

        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "Không tải được danh sách kho"
        );

        setShowErrorModal(true);
      } finally {
        if (requestId === warehouseRequestIdRef.current) {
          setWarehouseLoading(false);
        }
      }
    };

    fetchWarehouseList();
  }, [
    showCaptureModal,
    debouncedWarehouseSearch,
    warehousePage,
  ]);

  // =========================================================
  // TỰ ẨN THÔNG BÁO THÀNH CÔNG
  // =========================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // =========================================================
  // MỞ / ĐÓNG MODAL
  // =========================================================

  const openCaptureModal = () => {
    setWarehouseSearch("");
    setDebouncedWarehouseSearch("");
    setWarehousePage(1);
    setSelectedWarehouses({});
    setErrorMessage("");
    setShowCaptureModal(true);
  };

  const closeCaptureModal = () => {
    if (captureLoading) return;

    setShowCaptureModal(false);
    setShowConfirmModal(false);
    setWarehouseSearch("");
    setWarehousePage(1);
    setSelectedWarehouses({});
  };

  // =========================================================
  // CHỌN KHO
  // =========================================================

  const handleToggleWarehouse = (warehouse) => {
    const warehouseId = getWarehouseId(warehouse);

    if (
      warehouseId === null ||
      warehouseId === undefined ||
      warehouseId === ""
    ) {
      return;
    }

    const key = String(warehouseId);

    setSelectedWarehouses((previous) => {
      const next = { ...previous };

      if (next[key]) {
        delete next[key];
      } else {
        next[key] = warehouse;
      }

      return next;
    });
  };

  const handleToggleCurrentPage = () => {
    setSelectedWarehouses((previous) => {
      const next = { ...previous };

      if (allCurrentPageSelected) {
        warehouses.forEach((warehouse) => {
          const warehouseId = getWarehouseId(warehouse);

          delete next[String(warehouseId)];
        });
      } else {
        warehouses.forEach((warehouse) => {
          const warehouseId = getWarehouseId(warehouse);

          if (
            warehouseId !== null &&
            warehouseId !== undefined &&
            warehouseId !== ""
          ) {
            next[String(warehouseId)] = warehouse;
          }
        });
      }

      return next;
    });
  };

  const handleOpenConfirm = () => {
    if (selectedWarehouseIds.length === 0) {
      setErrorMessage(
        "Vui lòng chọn ít nhất một kho để trích xuất."
      );

      setShowErrorModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  // =========================================================
  // POST TRÍCH XUẤT TỒN KHO ĐẦU KỲ
  // =========================================================

  const handleCaptureBeginningInventory = async () => {
    if (
      captureLoading ||
      selectedWarehouseIds.length === 0
    ) {
      return;
    }

    const selectedCount = selectedWarehouseIds.length;

    try {
      setCaptureLoading(true);
      setErrorMessage("");

      await captureBeginningInventory(selectedWarehouseIds);

      setShowConfirmModal(false);
      setShowCaptureModal(false);
      setSelectedWarehouses({});
      setWarehouseSearch("");
      setWarehousePage(1);

      setSuccessMessage(
        `Trích xuất tồn kho đầu kỳ thành công cho ${selectedCount} kho.`
      );

      setInventoryPage(1);

      await fetchBeginningInventoryList(1);
    } catch (error) {
      console.error(
        "CAPTURE BEGINNING INVENTORY ERROR:",
        error.response?.data || error
      );

      const responseData = error.response?.data;

      setErrorMessage(
        responseData?.message ||
          responseData?.detail ||
          responseData?.error ||
          "Trích xuất tồn kho đầu kỳ thất bại"
      );

      setShowConfirmModal(false);
      setShowErrorModal(true);
    } finally {
      setCaptureLoading(false);
    }
  };

  // =========================================================
  // TỔNG TRÊN TRANG HIỆN TẠI
  // =========================================================

    const pageTotals = useMemo(() => {
    return beginningInventories.reduce(
        (total, item) => {
        const quantity = parseLocaleNumber(item.quantity);
        const totalPrice = parseLocaleNumber(item.total_price);

        total.quantity += Number.isNaN(quantity)
            ? 0
            : quantity;

        total.totalPrice += Number.isNaN(totalPrice)
            ? 0
            : totalPrice;

        return total;
        },
        {
        quantity: 0,
        totalPrice: 0,
        }
    );
    }, [beginningInventories]);

  return (
    <div className="beginning-inventory-page">
      {successMessage && (
        <div className="beginning-inventory-success">
          <RiCheckboxCircleLine />

          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
          >
            <RiCloseLine />
          </button>
        </div>
      )}

      <div className="beginning-inventory-header">
        <div>
          <h2>Tồn kho đầu kỳ</h2>

          <p>
            Dữ liệu tồn kho đầu kỳ đã trích xuất theo kho và kỳ.
          </p>
        </div>

        <button
          type="button"
          className="beginning-inventory-capture-btn"
          onClick={openCaptureModal}
        >
          Trích xuất tồn kho đầu kỳ
        </button>
      </div>

      <div className="beginning-inventory-content">
        {/* BỘ LỌC */}
        <div className="beginning-inventory-filter-row">
          <div className="beginning-inventory-search-box main-search">
            <RiSearchLine />

            <input
              value={inventorySearch}
              placeholder="Tìm mã hàng hoặc tên hàng"
              onChange={(event) => {
                setInventorySearch(event.target.value);
                setInventoryPage(1);
              }}
            />
          </div>

          <select
            className="beginning-inventory-filter-select"
            value={selectedFilterWarehouse}
            onChange={(event) => {
              setSelectedFilterWarehouse(event.target.value);
              setInventoryPage(1);
            }}
          >
            <option value="">Tất cả kho</option>

            {filterWarehouses.map((warehouse) => {
              const warehouseId = getWarehouseId(warehouse);

              return (
                <option
                  key={warehouseId}
                  value={warehouseId}
                >
                  {getWarehouseCode(warehouse)}
                  {" - "}
                  {getWarehouseName(warehouse)}
                </option>
              );
            })}
          </select>

          <div className="beginning-inventory-period-control">
            <input
              type="month"
              value={periodMonthInput}
              onChange={(event) =>
                setPeriodMonthInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddPeriodMonth();
                }
              }}
            />

            <button
              type="button"
              onClick={handleAddPeriodMonth}
              disabled={!periodMonthInput}
            >
              <RiAddLine />
              Thêm kỳ
            </button>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              className="beginning-inventory-clear-filter-btn"
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {selectedPeriodMonths.length > 0 && (
          <div className="beginning-inventory-period-chips">
            <span>Lọc theo kỳ:</span>

            {selectedPeriodMonths.map((month) => (
              <div
                key={month}
                className="beginning-inventory-period-chip"
              >
                <span>{formatPeriodMonth(month)}</span>

                <button
                  type="button"
                  onClick={() =>
                    handleRemovePeriodMonth(month)
                  }
                >
                  <RiCloseLine />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* BẢNG */}
        <div className="beginning-inventory-table-wrapper">
          <table className="beginning-inventory-table">
            <thead>
              <tr>
                <th>Kỳ</th>
                <th>Mã hàng</th>
                <th>Tên hàng</th>
                <th>ĐVT</th>
                <th>Kho</th>
                <th className="number-col">
                  Số lượng đầu kỳ
                </th>
                <th className="number-col">
                  Giá bình quân
                </th>
                <th className="number-col">
                  Giá trị tồn
                </th>
                <th>Thời gian trích xuất</th>
              </tr>
            </thead>

            <tbody>
              {inventoryLoading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="beginning-inventory-table-status">
                      <span className="beginning-inventory-spinner" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : beginningInventories.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="beginning-inventory-table-status">
                      Không có dữ liệu tồn kho đầu kỳ
                    </div>
                  </td>
                </tr>
              ) : (
                beginningInventories.map((item, index) => (
                <tr
                    key={`${item.goods_id}_${item.warehouse_id}_${item.period_month}_${index}`}
                >
                    <td>{item.period_month}</td>

                    <td>{item.goods_code}</td>

                    <td>{item.goods_name}</td>

                    <td>{item.default_unit_name}</td>

                    <td>
                    {item.warehouse_code} - {item.warehouse_name}
                    </td>

                    <td className="number-col">
                    {formatViNumber(item.quantity, 3)}
                    </td>

                    <td className="number-col">
                    {formatViNumber(item.weighted_avg_price, 3)}
                    </td>

                    <td className="number-col">
                    {formatViNumber(item.total_price, 3)}
                    </td>

                    <td>{item.created_at}</td>
                </tr>
                ))
              )}

              {!inventoryLoading &&
                beginningInventories.length > 0 && (
                  <tr className="beginning-inventory-total-row">
                    <td colSpan={5}>
                      Tổng trang hiện tại
                    </td>

                    <td className="number-col">
                      {formatViNumber(
                        pageTotals.quantity,
                        3
                      )}
                    </td>

                    <td></td>
                    <td className="number-col">
                      {formatViNumber(
                        pageTotals.totalPrice,
                        3
                      )}
                    </td>

                    <td></td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="beginning-inventory-table-pagination">
          <div>
            Tổng số: <strong>{inventoryTotal}</strong>
          </div>

          <div>
            <span>Số dòng/trang</span>

            <select
              value={inventoryPageSize}
              onChange={(event) => {
                setInventoryPageSize(
                  Number(event.target.value)
                );

                setInventoryPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span>
              {inventoryTotal === 0
                ? 0
                : (inventoryPage - 1) *
                    inventoryPageSize +
                  1}
              {" - "}
              {Math.min(
                inventoryPage * inventoryPageSize,
                inventoryTotal
              )}
            </span>

            <button
              type="button"
              disabled={
                inventoryLoading || inventoryPage <= 1
              }
              onClick={() =>
                setInventoryPage((previous) =>
                  Math.max(1, previous - 1)
                )
              }
            >
              ‹
            </button>

            <button
              type="button"
              disabled={
                inventoryLoading ||
                inventoryPage >= inventoryTotalPages
              }
              onClick={() =>
                setInventoryPage((previous) =>
                  Math.min(
                    inventoryTotalPages,
                    previous + 1
                  )
                )
              }
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHỌN NHIỀU KHO */}
      {showCaptureModal && (
        <div className="beginning-inventory-overlay">
          <div
            className="beginning-inventory-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="beginning-inventory-modal-header">
              <div>
                <h3>Trích xuất tồn kho đầu kỳ</h3>

                <p>
                  Tìm kiếm và chọn một hoặc nhiều kho cần
                  trích xuất.
                </p>
              </div>

              <button
                type="button"
                className="beginning-inventory-close-btn"
                onClick={closeCaptureModal}
                disabled={captureLoading}
              >
                <RiCloseLine />
              </button>
            </div>

            <div className="beginning-inventory-modal-body">
              <div className="beginning-inventory-search-box">
                <RiSearchLine />

                <input
                  value={warehouseSearch}
                  placeholder="Tìm theo mã kho hoặc tên kho"
                  disabled={captureLoading}
                  onChange={(event) => {
                    setWarehouseSearch(event.target.value);
                    setWarehousePage(1);
                  }}
                />
              </div>

              <div className="beginning-inventory-selection-summary">
                <label>
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    disabled={
                      warehouseLoading ||
                      captureLoading ||
                      warehouses.length === 0
                    }
                    onChange={handleToggleCurrentPage}
                  />

                  <span>Chọn tất cả kho ở trang này</span>
                </label>

                <strong>
                  Đã chọn: {selectedWarehouseIds.length} kho
                </strong>
              </div>

              <div className="beginning-inventory-warehouse-list">
                {warehouseLoading ? (
                  <div className="beginning-inventory-list-status">
                    <span className="beginning-inventory-spinner" />
                    Đang tải danh sách kho...
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="beginning-inventory-list-status">
                    Không tìm thấy kho phù hợp
                  </div>
                ) : (
                  warehouses.map((warehouse) => {
                    const warehouseId =
                      getWarehouseId(warehouse);

                    const checked = Boolean(
                      selectedWarehouses[
                        String(warehouseId)
                      ]
                    );

                    return (
                      <label
                        key={warehouseId}
                        className={`beginning-inventory-warehouse-item ${
                          checked ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={captureLoading}
                          onChange={() =>
                            handleToggleWarehouse(warehouse)
                          }
                        />

                        <span className="beginning-inventory-warehouse-code">
                          {getWarehouseCode(warehouse) || "-"}
                        </span>

                        <span className="beginning-inventory-warehouse-name">
                          {getWarehouseName(warehouse) || "-"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="beginning-inventory-pagination">
                <span>
                  Tổng số: <strong>{warehouseTotal}</strong>
                </span>

                <div>
                  <button
                    type="button"
                    disabled={
                      warehouseLoading ||
                      captureLoading ||
                      warehousePage <= 1
                    }
                    onClick={() =>
                      setWarehousePage((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                  >
                    ‹
                  </button>

                  <span>
                    Trang {warehousePage}/
                    {warehouseTotalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      warehouseLoading ||
                      captureLoading ||
                      warehousePage >=
                        warehouseTotalPages
                    }
                    onClick={() =>
                      setWarehousePage((previous) =>
                        Math.min(
                          warehouseTotalPages,
                          previous + 1
                        )
                      )
                    }
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            <div className="beginning-inventory-modal-footer">
              <button
                type="button"
                className="beginning-inventory-secondary-btn"
                onClick={closeCaptureModal}
                disabled={captureLoading}
              >
                Hủy
              </button>

              <button
                type="button"
                className="beginning-inventory-primary-btn"
                onClick={handleOpenConfirm}
                disabled={
                  captureLoading ||
                  selectedWarehouseIds.length === 0
                }
              >
                Xác nhận trích xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XÁC NHẬN LẦN CUỐI */}
      {showConfirmModal && (
        <div className="beginning-inventory-overlay beginning-inventory-confirm-overlay">
          <div className="beginning-inventory-confirm-modal">
            <div className="beginning-inventory-confirm-icon">
              !
            </div>

            <h3>Xác nhận trích xuất tồn kho đầu kỳ</h3>

            <p>
              Bạn đang chọn{" "}
              <strong>
                {selectedWarehouseIds.length}
              </strong>{" "}
              kho:
            </p>

            <div className="beginning-inventory-selected-list">
              {selectedWarehouseList
                .slice(0, 6)
                .map((warehouse) => (
                  <div key={getWarehouseId(warehouse)}>
                    {getWarehouseCode(warehouse)}
                    {getWarehouseCode(warehouse)
                      ? " - "
                      : ""}
                    {getWarehouseName(warehouse)}
                  </div>
                ))}

              {selectedWarehouseList.length > 6 && (
                <div>
                  Và {selectedWarehouseList.length - 6}{" "}
                  kho khác...
                </div>
              )}
            </div>

            <div className="beginning-inventory-warning">
              Hãy kiểm tra kỹ danh sách kho trước khi
              xác nhận. Dữ liệu tồn kho đầu kỳ sau khi
              trích xuất không thể thay đổi.
            </div>

            <div className="beginning-inventory-confirm-actions">
              <button
                type="button"
                className="beginning-inventory-secondary-btn"
                disabled={captureLoading}
                onClick={() =>
                  setShowConfirmModal(false)
                }
              >
                Quay lại
              </button>

              <button
                type="button"
                className="beginning-inventory-danger-btn"
                disabled={captureLoading}
                onClick={
                  handleCaptureBeginningInventory
                }
              >
                Tôi chắc chắn, trích xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING POST */}
      {captureLoading && (
        <div className="beginning-inventory-loading-overlay">
          <div className="beginning-inventory-loading-box">
            <span className="beginning-inventory-spinner large" />

            <strong>
              Đang trích xuất tồn kho đầu kỳ...
            </strong>

            <span>
              Vui lòng không đóng hoặc tải lại trang.
            </span>
          </div>
        </div>
      )}

      {/* MODAL LỖI */}
      {showErrorModal && (
        <div className="beginning-inventory-overlay beginning-inventory-error-overlay">
          <div className="beginning-inventory-error-modal">
            <div className="beginning-inventory-error-icon">
              ×
            </div>

            <h3>Không thể thực hiện</h3>

            <p>{errorMessage}</p>

            <button
              type="button"
              className="beginning-inventory-primary-btn"
              onClick={() => {
                setShowErrorModal(false);
                setErrorMessage("");
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BeginningInventoryPage;