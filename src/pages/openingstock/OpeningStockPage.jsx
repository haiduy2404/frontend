import { useEffect, useRef, useState } from "react";
import "../../styles/OpeningStockPage.css";
import {
  RiFileExcel2Line,
  RiSettings3Line,
  RiBox3Line,
} from "react-icons/ri";

import { NavLink } from "react-router-dom";

import { getOpeningStocks } from "../../services/openingStockService";
import { getWarehouses } from "../../services/warehouseService";
import StockBalanceImportModal from "../../components/StockBalanceImportModal";

import { useAuth } from "../../contexts/AuthContext";
import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../utils/listPageStateStorage";

function OpeningStockPage() {
  const { canDo, isWarehouseRestricted } = useAuth();
  const LIST_PAGE_STATE_KEY = "opening-stock-page-state";
  const getRowKey = (item) => `${item.goods_id}_${item.warehouse_id}`;
  const [openingStocks, setOpeningStocks] = useState([]);
  const resizingRef = useRef(null);
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
    return Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 30;
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.selectedWarehouse || null;
  });
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const warehouseBoxRef = useRef(null);

  const defaultColumns = [
    { key: "goods_code", label: "Mã hàng", visible: true, width: 120 },
    { key: "goods_name", label: "Tên hàng", visible: true, width: 240 },
    { key: "unit_name", label: "ĐVT", visible: true, width: 100 },
    { key: "warehouse_name", label: "Kho", visible: true, width: 180 },
    { key: "quantity", label: "Số lượng tồn", visible: true, width: 150 },
    { key: "weighted_avg_price", label: "Giá bình quân", visible: true, width: 150 },
    { key: "total_value", label: "Giá trị tồn", visible: true, width: 170 },
    { key: "updated_at", label: "Cập nhật", visible: true, width: 170 },
  ];

  const [showSettingModal, setShowSettingModal] = useState(false);

  useEffect(() => {
    saveStoredListPageState(LIST_PAGE_STATE_KEY, {
      search,
      debouncedSearch,
      page,
      pageSize,
      selectedWarehouse,
    });
  }, [debouncedSearch, page, pageSize, search, selectedWarehouse]);

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("openingStockColumns");
        return saved ? JSON.parse(saved) : defaultColumns;
  });

  useEffect(() => {
    localStorage.setItem("openingStockColumns", JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouses({ page: 1, page_size: 100 });
        const payload = data?.data || data;
        const results = Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload)
          ? payload
          : [];
        setWarehouses(results);
      } catch (error) {
        console.error("GET WAREHOUSES ERROR:", error.response?.data || error);
        setWarehouses([]);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (warehouseBoxRef.current && !warehouseBoxRef.current.contains(e.target)) {
        setWarehouseDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!canDo("view_opening_stock")) {
    return (
      <div className="no-permission-page">
        Tài khoản không được cấp quyền truy cập tồn kho đầu kì
      </div>
    );
  }
    const fetchOpeningStocks = async (
    keyword = search,
    pageNumber = page,
    size = pageSize,
    warehouseId = selectedWarehouse?.id
    ) => {
    try {
        const data = await getOpeningStocks({
        search: keyword,
        page: pageNumber,
        page_size: size,
        warehouse_id: warehouseId || undefined,
        });

        const payload = data?.data || data;

        const results = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : [];

        setOpeningStocks(results);
        setTotal(payload?.total || results.length);
        setTotalPages(payload?.total_pages || 1);
    } catch (error) {
        console.error("GET OPENING STOCK ERROR:", error.response?.data || error);
        alert("Không tải được danh sách tồn kho đầu kì");
    }
    };

    useEffect(() => {
      fetchOpeningStocks(debouncedSearch, page, pageSize, selectedWarehouse?.id);
    }, [debouncedSearch, page, pageSize, selectedWarehouse]);

    const normalizeVn = (text) =>
      (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");

    const filteredWarehouses = warehouses.filter((w) => {
      const term = normalizeVn(warehouseSearch.trim());
      if (!term) return true;
      return (
        normalizeVn(w.name).includes(term) || normalizeVn(w.code).includes(term)
      );
    });

    const handleSelectWarehouse = (warehouse) => {
      setSelectedWarehouse(warehouse);
      setWarehouseSearch("");
      setWarehouseDropdownOpen(false);
      setPage(1);
    };

    const parseLocaleNumber = (value) => {
      if (value === null || value === undefined || value === "") return NaN;

      if (typeof value === "number") return value;

      if (typeof value === "string") {
        const text = value.trim();

        // Nếu có dấu phẩy, coi là số kiểu Việt Nam: 1.234,56
        if (text.includes(",")) {
          return Number(text.replace(/\./g, "").replace(",", "."));
        }

        // Nếu không có dấu phẩy, coi là số backend trả về: 17.000 = 17
        return Number(text);
      }

      return Number(value);
    };

    const formatViNumber = (value, fractionDigits = 2) => {
    if (value === null || value === undefined || value === "") return "-";
    const number = parseLocaleNumber(value);
    if (Number.isNaN(number)) return "-";
      return number.toLocaleString("vi-VN", {
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
      });
    };

    const pageTotals = openingStocks.reduce(
      (acc, item) => {
        const quantity = parseLocaleNumber(item.quantity);
        const price = parseLocaleNumber(item.weighted_avg_price);

        acc.quantity += Number.isNaN(quantity) ? 0 : quantity;
        acc.total_value +=
          (Number.isNaN(quantity) ? 0 : quantity) *
          (Number.isNaN(price) ? 0 : price);

        return acc;
      },
      {
        quantity: 0,
        total_value: 0,
      }
    );

    const handleStartResize = (e, columnKey) => {
        e.preventDefault();
        e.stopPropagation();

      const column = columns.find((col) => col.key === columnKey);
            if (!column) return;

            resizingRef.current = {
              columnKey,
              startX: e.clientX,
              startWidth: column.width,
            };

            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            window.addEventListener("mousemove", handleResizing);
            window.addEventListener("mouseup", handleStopResize);
    };

    const handleResizing = (e) => {
      if (!resizingRef.current) return;

    const { columnKey, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    const nextWidth = Math.max(70, startWidth + diff);

      setColumns((prev) =>
        prev.map((col) =>
          col.key === columnKey
            ? {
                ...col,
                width: nextWidth,
              }
            : col
        )
      );
    };

    const handleStopResize = () => {
      resizingRef.current = null;

      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      window.removeEventListener("mousemove", handleResizing);
      window.removeEventListener("mouseup", handleStopResize);
    };

    return (
    <>
    <div className="opening-stock-page">
      <div className="opening-stock-toolbar">
            <div className="opening-stock-search-group">
            <input
                className="opening-stock-search"
                placeholder="🔍  Tìm kiếm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
            />

            <div className="warehouse-select" ref={warehouseBoxRef}>
              <input
                className="warehouse-select-input"
                placeholder="Tất cả kho"
                value={
                  warehouseDropdownOpen
                    ? warehouseSearch
                    : selectedWarehouse
                    ? `${selectedWarehouse.code} - ${selectedWarehouse.name}`
                    : ""
                }
                onFocus={() => {
                  setWarehouseDropdownOpen(true);
                  setWarehouseSearch("");
                }}
                onChange={(e) => {
                  setWarehouseSearch(e.target.value);
                  setWarehouseDropdownOpen(true);
                }}
              />

              {selectedWarehouse && !warehouseDropdownOpen && (
                <button
                  className="warehouse-select-clear"
                  title="Bỏ lọc kho"
                  onClick={() => handleSelectWarehouse(null)}
                >
                  ×
                </button>
              )}

              {warehouseDropdownOpen && (
                <div className="warehouse-select-dropdown">
                  <div
                    className="warehouse-select-option warehouse-select-all"
                    onMouseDown={() => handleSelectWarehouse(null)}
                  >
                    Tất cả kho
                  </div>
                  {filteredWarehouses.map((w) => (
                    <div
                      key={w.id}
                      className={`warehouse-select-option ${
                        selectedWarehouse?.id === w.id ? "selected" : ""
                      }`}
                      onMouseDown={() => handleSelectWarehouse(w)}
                    >
                      <span className="warehouse-option-code">{w.code}</span>
                      <span className="warehouse-option-name">{w.name}</span>
                    </div>
                  ))}
                  {filteredWarehouses.length === 0 && (
                    <div className="warehouse-select-empty">
                      Không tìm thấy kho phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

        <div className="opening-stock-actions">
        
          <NavLink
                to="/dashboard/stock-manager/goods-list"
                className="goods-list-link-btn"
            >
                <RiBox3Line />
                <span>Danh mục vật tư hàng hóa</span>
            </NavLink>

        <button
            className="icon-btn"
            title="Thiết lập"
            onClick={() => setShowSettingModal(true)}
        >
            <RiSettings3Line />
        </button>

        {/* Import tự tạo kho theo tên nên chỉ dành cho tài khoản quản lý tất cả kho */}
        {canDo("create_opening_stock") && !isWarehouseRestricted && (
          <button
            className="import-excel-btn"
            onClick={() => setShowImportModal(true)}
          >
            <RiFileExcel2Line />
            <span>Nhập từ Excel</span>
          </button>
        )}
        </div>
      </div>

      <div className="opening-stock-table-area">
  <div className="opening-stock-table-header">
    <table className="opening-stock-table">
      <thead>
        <tr>
          {columns
            .filter((col) => col.visible)
            .map((col) => (
              <th
                key={col.key}
                style={{
                  width: `${col.width}px`,
                  minWidth: `${col.width}px`,
                  maxWidth: `${col.width}px`,
                }}
                className={
                  [
                    "quantity",
                    "weighted_avg_price",
                    "total_value",
                  ].includes(col.key)
                    ? "number-col resizable-th"
                    : "resizable-th"
                }
              >
                <span>{col.label}</span>

                <span
                  className="column-resizer"
                  onMouseDown={(e) => handleStartResize(e, col.key)}
                />
              </th>
            ))}
        </tr>
      </thead>
    </table>
  </div>

  <div className="opening-stock-table-body">
    <table className="opening-stock-table">
      <tbody>
        {openingStocks.map((item) => (
            <tr key={getRowKey(item)} className="opening-stock-row">
                {columns
                .filter((col) => col.visible)
                .map((col) => (
                    <td
                    key={col.key}
                    style={{
                        width: `${col.width}px`,
                        minWidth: `${col.width}px`,
                        maxWidth: `${col.width}px`,
                    }}
                    className={
                        [
                          "quantity",
                          "weighted_avg_price",
                          "total_value",
                        ].includes(col.key)
                        ? "number-col"
                        : ""
                    }
                    >
                    {col.key === "quantity"
                        ? formatViNumber(item.quantity, 3)
                        : col.key === "weighted_avg_price"
                        ? formatViNumber(item.weighted_avg_price, 3)
                        : col.key === "total_value"
                        ? formatViNumber(
                            parseLocaleNumber(item.quantity || 0) *
                            parseLocaleNumber(item.weighted_avg_price || 0),
                            3
                          )
                        : item[col.key] || "-"}
                </td>
                ))}
          </tr>
        ))}
              {openingStocks.length > 0 && (
                <tr className="opening-stock-total-row">
                  {columns
                    .filter((col) => col.visible)
                    .map((col) => (
                      <td
                        key={col.key}
                        style={{
                          width: `${col.width}px`,
                          minWidth: `${col.width}px`,
                          maxWidth: `${col.width}px`,
                        }}
                        className={
                          [
                            "quantity",
                            "weighted_avg_price",
                            "total_value",
                          ].includes(col.key)
                            ? "number-col"
                            : ""
                        }
                      >
                        {col.key === "quantity"
                          ? formatViNumber(pageTotals.quantity, 3)
                          : col.key === "total_value"
                          ? formatViNumber(pageTotals.total_value, 3)
                          : ""}
                      </td>
                    ))}
                </tr>
              )}
      </tbody>
    </table>
  </div>
</div>
      <div className="opening-stock-pagination">
        <div className="pagination-left">
          Tổng số: <strong>{total}</strong>
        </div>

        <div className="pagination-right">
          <span>Số dòng/trang</span>

          <select
            value={pageSize}
            onChange={(e) => {
              const value = Number(e.target.value);
              setPageSize(value);
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <span>
            {total === 0 ? 0 : (page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, total)}
          </span>

          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ‹
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
      {showImportModal && (
        <StockBalanceImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() =>
            fetchOpeningStocks(debouncedSearch, page, pageSize, selectedWarehouse?.id)
          }
        />
      )}

      {showSettingModal && (
        <div className="setting-modal-overlay">
          <div className="setting-modal">
            <div className="setting-modal-header">
              <h3>Thiết lập cột</h3>

              <button onClick={() => setShowSettingModal(false)}>
                ×
              </button>
            </div>

            <div className="setting-modal-body">
              {columns.map((column, index) => (
                <div key={column.key} className="setting-row">
                  <div className="setting-left">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={(e) => {
                        const newColumns = [...columns];
                        newColumns[index].visible = e.target.checked;
                        setColumns(newColumns);
                      }}
                    />

                    <span>{column.label}</span>
                  </div>

                  <input
                    type="number"
                    min="60"
                    max="800"
                    value={column.width}
                    onChange={(e) => {
                      const newColumns = [...columns];
                      newColumns[index].width = Number(e.target.value);
                      setColumns(newColumns);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="setting-modal-footer">
              <button
                className="reset-btn"
                onClick={() => {
                  setColumns(defaultColumns);
                  localStorage.removeItem("openingStockColumns");
                }}
              >
                Đặt lại mặc định
              </button>

              <div className="setting-footer-right">
                <button
                  className="cancel-btn"
                  onClick={() => setShowSettingModal(false)}
                >
                  Hủy
                </button>

                <button
                  className="save-btn"
                  onClick={() => setShowSettingModal(false)}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default OpeningStockPage;