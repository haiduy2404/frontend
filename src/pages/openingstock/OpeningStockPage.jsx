import { getGoods } from "../../services/goodsService";
import { getWarehouses } from "../../services/warehouseService";
import { useEffect, useRef, useState } from "react";
import "../../styles/OpeningStockPage.css";
import {
  RiFileExcel2Line,
  RiSettings3Line,
  RiRefreshLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiBox3Line,
} from "react-icons/ri";

import { NavLink } from "react-router-dom";

import {
  getOpeningStocks,
  createOpeningStock,
  updateOpeningStock,
  deleteOpeningStock,
  importOpeningStockExcel,
} from "../../services/openingStockService";

function OpeningStockPage() {
  const [openingStocks, setOpeningStocks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [goodsList, setGoodsList] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const resizingRef = useRef(null);

  const [goodsSearch, setGoodsSearch] = useState("");
  const [goodsPage, setGoodsPage] = useState(1);
  const [goodsTotalPages, setGoodsTotalPages] = useState(1);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [showGoodsDropdown, setShowGoodsDropdown] = useState(false);
  const fetchFormOptions = async () => {
        try {
              const warehouseData = await getWarehouses({ page: 1, page_size: 100 });
              const warehousePayload = warehouseData?.data || warehouseData;
                setWarehouseList(
                Array.isArray(warehousePayload?.results)
                ? warehousePayload.results
                : Array.isArray(warehousePayload)
                ? warehousePayload
                : []
            );
        }  catch (error) {
            console.error("LOAD FORM OPTIONS ERROR:", error.response?.data || error);
            alert("Không tải được danh sách kho");
        }
        };

    const fetchGoodsDropdown = async ({
          keyword = "",
          pageNumber = 1,
          append = false,
        } = {}) => {
          if (goodsLoading) return;

          try {
            setGoodsLoading(true);

            const data = await getGoods({
              search: keyword,
              page: pageNumber,
              page_size: 30,
            });

            const payload = data?.data || data;

            const results = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.results)
              ? payload.results
              : [];

            setGoodsList((prev) => (append ? [...prev, ...results] : results));
            setGoodsPage(pageNumber);
            setGoodsTotalPages(payload?.total_pages || 1);
          } catch (error) {
            console.error("LOAD GOODS DROPDOWN ERROR:", error.response?.data || error);
            alert("Không tải được danh sách hàng hóa");
          } finally {
            setGoodsLoading(false);
          }
        };
      const handleGoodsDropdownScroll = (e) => {
        const element = e.currentTarget;

        const isBottom =
          element.scrollTop + element.clientHeight >= element.scrollHeight - 8;

        if (isBottom && !goodsLoading && goodsPage < goodsTotalPages) {
          fetchGoodsDropdown({
            keyword: goodsSearch,
            pageNumber: goodsPage + 1,
            append: true,
          });
        }
      };

      const handleSelectGoods = (goods) => {
        setFormData((prev) => ({
          ...prev,
          goods_id: goods.id,
        }));

        setGoodsSearch(`${goods.code} - ${goods.name}`);
        setShowGoodsDropdown(false);
      };

    const fileInputRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [editingStockId, setEditingStockId] = useState(null);

    const [formData, setFormData] = useState({
        goods_id: "",
        warehouse_id: "",
        original_quantity: "",
        remaining_quantity: "",
        unit_price: "",
        lot_no: "",
        expired_date: "",
    });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

const defaultColumns = [
  { key: "goods_code", label: "Mã hàng", visible: true, width: 120 },
  { key: "goods_name", label: "Tên hàng", visible: true, width: 210 },
  { key: "unit", label: "ĐVT chính", visible: true, width: 120 },
  { key: "original_quantity", label: "Số lượng đầu", visible: true, width: 160 },
  { key: "remaining_quantity", label: "Số lượng còn", visible: true, width: 160 },
  { key: "unit_price", label: "Đơn giá", visible: true, width: 120 },
  { key: "total_value", label: "Giá trị tồn", visible: true, width: 160 },
];

const [showSettingModal, setShowSettingModal] = useState(false);

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem("openingStockColumns");
        return saved ? JSON.parse(saved) : defaultColumns;
    });

    useEffect(() => {
        localStorage.setItem("openingStockColumns", JSON.stringify(columns));
    }, [columns]);


  useEffect(() => {
    fetchOpeningStocks(search, page, pageSize);
  }, [page, pageSize]);
  
  useEffect(() => {
  fetchFormOptions();
}, []);
    const fetchOpeningStocks = async (
    keyword = search,
    pageNumber = page,
    size = pageSize
    ) => {
    try {
        const data = await getOpeningStocks({
        search: keyword,
        page: pageNumber,
        page_size: size,
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

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(openingStocks.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

const handleBulkDeleteOpeningStock = async () => {
  if (selectedIds.length === 0) {
    alert("Vui lòng chọn tồn kho cần xóa");
    return;
  }

  const confirmDelete = window.confirm(
    `Bạn có chắc muốn xóa ${selectedIds.length} dòng tồn kho không?`
  );

  if (!confirmDelete) return;

  try {
    await Promise.all(selectedIds.map((id) => deleteOpeningStock(id)));

    setSelectedIds([]);
    await fetchOpeningStocks(search, page, pageSize);

    alert("Xóa thành công");
  } catch (error) {
    console.error("BULK DELETE OPENING STOCK ERROR:", error.response?.data || error);
    alert("Xóa thất bại");
  }
};
const handleEditOpeningStock = (item) => {
  setEditingStockId(item.id);

  setFormData({
    goods_id: item.goods_id || "",
    warehouse_id: item.warehouse_id || "",
    original_quantity: item.original_quantity || "",
    remaining_quantity: item.remaining_quantity || "",
    unit_price: item.unit_price || "",
    lot_no: item.lot_no || "",
    expired_date: item.expired_date || "",
  });

  setGoodsSearch(`${item.goods_code || ""} - ${item.goods_name || ""}`);
  setShowModal(true);
};

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const resetForm = () => {
  setFormData({
    goods_id: "",
    warehouse_id: "",
    original_quantity: "",
    remaining_quantity: "",
    unit_price: "",
    lot_no: "",
    expired_date: "",
  });

  setGoodsSearch("");
  setShowGoodsDropdown(false);
};

const handleSave = async (keepOpen = false) => {
  if (
    !formData.goods_id ||
    !formData.warehouse_id ||
    formData.original_quantity === "" ||
    formData.unit_price === ""
  ) {
    alert("Vui lòng nhập đầy đủ Hàng hóa, Kho, Số lượng tồn và Đơn giá");
    return;
  }

  const payload = {
    goods_id: formData.goods_id,
    warehouse_id: formData.warehouse_id,
    original_quantity: Number(formData.original_quantity),
    remaining_quantity:
      formData.remaining_quantity === ""
        ? Number(formData.original_quantity)
        : Number(formData.remaining_quantity),
    unit_price: Number(formData.unit_price),
  };

  try {
    if (editingStockId) {
      await updateOpeningStock(editingStockId, payload);
      alert("Cập nhật tồn kho thành công");
    } else {
      await createOpeningStock(payload);
      alert("Thêm tồn kho thành công");
    }

    await fetchOpeningStocks(search, page, pageSize);

    if (keepOpen && !editingStockId) {
      resetForm();
    } else {
      setShowModal(false);
      setEditingStockId(null);
      resetForm();
    }
  } catch (error) {
    console.error("SAVE OPENING STOCK ERROR:", error.response?.data || error);

    alert(
      error.response?.data?.goods_id ||
        error.response?.data?.warehouse_id ||
        error.response?.data?.remaining_quantity ||
        error.response?.data?.original_quantity ||
        "Lưu tồn kho thất bại"
    );
  }
};
    const handleDeleteOpeningStock = async (item) => {
      const confirmDelete = window.confirm(
        `Bạn có chắc muốn xóa tồn kho của "${item.goods_name || item.goods_code || ""}" không?`
      );

      if (!confirmDelete) return;

      try {
        await deleteOpeningStock(item.id);
        await fetchOpeningStocks(search, page, pageSize);
        alert("Xóa thành công");
      } catch (error) {
        console.error("DELETE OPENING STOCK ERROR:", error.response?.data || error);
        alert("Xóa thất bại");
      }
    };
    const handleImportExcelClick = () => {
    fileInputRef.current.click();
    };

    const handleImportExcelChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
        await importOpeningStockExcel(formData);
        alert("Import tồn kho đầu kì thành công");
        await fetchOpeningStocks(search, page, pageSize);
    } catch (error) {
        console.error("IMPORT OPENING STOCK ERROR:", error.response?.data || error);
        alert("Import tồn kho đầu kì thất bại");
    }

    e.target.value = "";
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
    
    const selectedGoods = goodsList.find(
    (item) => item.id === formData.goods_id
    );

    const totalValue =
      Number(formData.original_quantity || 0) * Number(formData.unit_price || 0);

    const pageTotals = openingStocks.reduce(
      (acc, item) => {
        const originalQuantity = parseLocaleNumber(item.original_quantity || 0);
        const remainingQuantity = parseLocaleNumber(item.remaining_quantity || 0);
        const unitPrice = parseLocaleNumber(item.unit_price || 0);

        acc.original_quantity += Number.isNaN(originalQuantity)
          ? 0
          : originalQuantity;

        acc.remaining_quantity += Number.isNaN(remainingQuantity)
          ? 0
          : remainingQuantity;

        acc.total_value +=
          (Number.isNaN(remainingQuantity) ? 0 : remainingQuantity) *
          (Number.isNaN(unitPrice) ? 0 : unitPrice);

        return acc;
      },
      {
        original_quantity: 0,
        remaining_quantity: 0,
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
                const value = e.target.value;
                setSearch(value);
                setPage(1);
                fetchOpeningStocks(value, 1, pageSize);
                }}
            />

            {selectedIds.length > 0 && (
                <button
                className="bulk-delete-btn"
                title="Xóa hàng loạt"
                onClick={handleBulkDeleteOpeningStock}
                >
                <RiDeleteBin6Line />
                </button>
            )}
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
        title="Làm mới"
        onClick={() => fetchOpeningStocks(search, page, pageSize)}
        >
        <RiRefreshLine />
        </button>

        <button className="icon-btn excel-btn" title="Xuất ra Excel">
            <RiFileExcel2Line />
        </button>

        <button
            className="icon-btn"
            title="Thiết lập"
            onClick={() => setShowSettingModal(true)}
        >
            <RiSettings3Line />
        </button>

        <button className="import-excel-btn" onClick={handleImportExcelClick}>
            <RiFileExcel2Line />
            <span>Nhập từ Excel</span>
        </button>

        <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleImportExcelChange}
        />

        <button
            className="add-btn"
              onClick={() => {
                setEditingStockId(null);
                resetForm();
                setShowModal(true);
                fetchGoodsDropdown({
                  keyword: "",
                  pageNumber: 1,
                  append: false,
                });
              }}
            >
            + Thêm
        </button>
        </div>
        
      </div>

      <div className="opening-stock-table-area">
  <div className="opening-stock-table-header">
    <table className="opening-stock-table">
      <thead>
        <tr>
          <th className="checkbox-col">
            <input
              type="checkbox"
              checked={
                openingStocks.length > 0 &&
                selectedIds.length === openingStocks.length
              }
              onChange={handleSelectAll}
            />
          </th>

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
                    "original_quantity",
                    "remaining_quantity",
                    "unit_price",
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
        <th className="opening-stock-action-col"></th>
        </tr>
      </thead>
    </table>
  </div>

  <div className="opening-stock-table-body">
    <table className="opening-stock-table">
      <tbody>
        {openingStocks.map((item) => (
            <tr key={item.id} className="opening-stock-row">
                <td className="checkbox-col">
                    <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleSelect(item.id)}
                    />
                </td>

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
                        "original_quantity",
                        "remaining_quantity",
                        "unit_price",
                        "total_value",
                        ].includes(col.key)
                        ? "number-col"
                        : ""
                    }
                    >
                    {col.key === "original_quantity" || col.key === "remaining_quantity"
                        ? formatViNumber(item[col.key], 2)
                        : col.key === "unit_price"
                        ? formatViNumber(item[col.key], 2)
                        : col.key === "total_value"
                        ? formatViNumber(
                            parseLocaleNumber(item.remaining_quantity || 0) *
                            parseLocaleNumber(item.unit_price || 0),
                            2
                        )
                        : item[col.key] || "-"}
                </td>
                ))}

            <td className="opening-stock-row-actions">
                <button
                className="row-edit-btn"
                title="Sửa"
                onClick={() => handleEditOpeningStock(item)}
                >
                <RiEdit2Line />
                </button>

                <button
                className="row-delete-btn"
                title="Xóa"
                onClick={() => handleDeleteOpeningStock(item)}
                >
                <RiDeleteBin6Line />
                </button>
            </td>           
          </tr>
        ))}
                      {openingStocks.length > 0 && (
                <tr className="opening-stock-total-row">
                  <td className="checkbox-col"></td>

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
                            "original_quantity",
                            "remaining_quantity",
                            "unit_price",
                            "total_value",
                          ].includes(col.key)
                            ? "number-col"
                            : ""
                        }
                      >
                        {col.key === "original_quantity"
                          ? formatViNumber(pageTotals.original_quantity, 2)
                          : col.key === "remaining_quantity"
                          ? formatViNumber(pageTotals.remaining_quantity, 2)
                          : col.key === "total_value"
                          ? formatViNumber(pageTotals.total_value, 2)
                          : ""}
                      </td>
                    ))}

                  <td className="opening-stock-row-actions"></td>
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
              fetchOpeningStocks(search, 1, value);
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
{showModal && (
  <div className="opening-stock-modal-overlay">
    <div className="opening-stock-modal">
      <div className="opening-stock-modal-header">
        <h2>
          {editingStockId
            ? "Sửa tồn kho vật tư hàng hóa"
            : "Thêm tồn kho vật tư hàng hóa"}
        </h2>

        <button
          className="modal-close-btn"
          onClick={() => {
            setShowModal(false);
            setEditingStockId(null);
            resetForm();
          }}
        >
          ×
        </button>
      </div>

      <div className="opening-stock-form">
        <div className="form-row full">
          <div className="form-group goods-group">
            <label>
              Hàng hóa <span>*</span>
            </label>
                <div className="goods-dropdown-box">
                  <input
                    className="goods-dropdown-input"
                    value={goodsSearch}
                    placeholder="Chọn hàng hóa"
                    onFocus={() => {
                      setShowGoodsDropdown(true);
                      fetchGoodsDropdown({
                        keyword: goodsSearch,
                        pageNumber: 1,
                        append: false,
                      });
                    }}
                    onChange={(e) => {
                      const value = e.target.value;

                      setGoodsSearch(value);
                      setFormData((prev) => ({
                        ...prev,
                        goods_id: "",
                      }));

                      setShowGoodsDropdown(true);
                      fetchGoodsDropdown({
                        keyword: value,
                        pageNumber: 1,
                        append: false,
                      });
                    }}
                  />

                  <button
                    type="button"
                    className="goods-dropdown-toggle"
                    onClick={() => {
                      const next = !showGoodsDropdown;
                      setShowGoodsDropdown(next);

                      if (next) {
                        fetchGoodsDropdown({
                          keyword: goodsSearch,
                          pageNumber: 1,
                          append: false,
                        });
                      }
                    }}
                  >
                    ▾
                  </button>

                  {showGoodsDropdown && (
                    <div
                      className="goods-dropdown-list"
                      onScroll={handleGoodsDropdownScroll}
                    >
                      <div className="goods-dropdown-header">
                        <span>Mã vật tư hàng hóa</span>
                        <span>Tên vật tư hàng hóa</span>
                      </div>

                      {goodsList.map((goods) => (
                        <div
                          key={goods.id}
                          className="goods-dropdown-item"
                          onClick={() => handleSelectGoods(goods)}
                        >
                          <span className="goods-dropdown-code">{goods.code}</span>
                          <span className="goods-dropdown-name">{goods.name}</span>
                        </div>
                      ))}

                      {goodsLoading && (
                        <div className="goods-dropdown-status">Đang tải...</div>
                      )}

                      {!goodsLoading && goodsList.length === 0 && (
                        <div className="goods-dropdown-status">Không có dữ liệu</div>
                      )}
                    </div>
                  )}
                </div>
          </div>

          <button className="small-add-btn" type="button">
            +
          </button>
          </div>
            <div className="form-row full">
            <div className="form-group">
              <label>
                Kho <span>*</span>
              </label>
                <select
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleChange}
                >
                  <option value="">Chọn kho</option>

                  {warehouseList.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} - {warehouse.name}
                    </option>
                  ))}
                </select>
           </div>
          </div>

        <div className="form-row four-cols">
          <div className="form-group">
            <label>Đơn vị tính</label>
            <input
              value={
                selectedGoods?.unit ||
                selectedGoods?.unit_name ||
                selectedGoods?.goods_unit_name ||
                ""
              }
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Số lượng tồn</label>
            <input
              type="number"
              name="original_quantity"
              value={formData.original_quantity}
              onChange={(e) => {
                const value = e.target.value;

                setFormData((prev) => ({
                  ...prev,
                  original_quantity: value,
                  remaining_quantity: value,
                }));
              }}
            />
          </div>

          <div className="form-group">
            <label>Đơn giá</label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Giá trị tồn</label>
            <input value={formatViNumber(totalValue, 2)} readOnly />
          </div>
        </div>


      </div>

      <div className="opening-stock-modal-footer">
        <button
          className="cancel-btn"
          onClick={() => {
            setShowModal(false);
            setEditingStockId(null);
            resetForm();
          }}
        >
          Hủy
        </button>

        {!editingStockId && (
          <button className="save-more-btn" onClick={() => handleSave(true)}>
            Lưu và Thêm
          </button>
        )}

        <button className="save-btn" onClick={() => handleSave(false)}>
          Lưu
        </button>
      </div>
    </div>
  </div>
)}
        </>
        );
}
export default OpeningStockPage;