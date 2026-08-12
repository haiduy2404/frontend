import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../../styles/WarehouseTransferDetailPage.css";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiPrinterLine,
} from "react-icons/ri";

import {
  createWarehouseTransfer,
  getWarehouseTransferByCode,
  updateWarehouseTransfer,
} from "../../../services/warehouseTransferService";

import { getWarehouses } from "../../../services/warehouseService";
import { getOpeningStocks } from "../../../services/openingStockService";

const getTodayDate = () => {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;
};

const normalizeTransferDate = (value) => {
  if (!value) return getTodayDate();

  const dateOnly = String(value).split("T")[0];

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateOnly)) {
    const [day, month, year] = dateOnly.split("/");
    return `${year}-${month}-${day}`;
  }

  return dateOnly;
};

export default function WarehouseTransferDetailPage() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get("mode") === "print";
  const isViewMode = searchParams.get("mode") === "view" || isPrintMode;

  const isEditMode = code && code !== "new";

  const [warehouses, setWarehouses] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [activeStockRowId, setActiveStockRowId] = useState(null);
  const [stockKeyword, setStockKeyword] = useState("");
  const stockSearchTimerRef = useRef(null);
  const enterNavigationRef = useRef(null);
  const [deletedRows, setDeletedRows] = useState([]);

  const handleEnterMoveNext = (event) => {
    if (
      event.key !== "Enter" ||
      event.nativeEvent?.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    event.preventDefault();

    const container = enterNavigationRef.current;

    if (!container) return;

    const fields = Array.from(
      container.querySelectorAll(
        '[data-enter-next="true"]:not(:disabled):not([readonly])'
      )
    );

    const currentIndex = fields.indexOf(event.currentTarget);

    if (currentIndex === -1) return;

    const nextIndex = event.shiftKey
      ? currentIndex - 1
      : currentIndex + 1;

    const nextField = fields[nextIndex];

    event.currentTarget.blur();

    if (!nextField) return;

    requestAnimationFrame(() => {
      nextField.focus();

      if (
        nextField.tagName === "INPUT" &&
        nextField.type !== "checkbox" &&
        nextField.type !== "radio" &&
        typeof nextField.select === "function"
      ) {
        nextField.select();
      }
    });
  };

  const [form, setForm] = useState({
    id: null,
    transfer_code: "",
    transfer_date: getTodayDate(),
    reason: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    from_warehouse_address: "",
    to_warehouse_address: "",
    reference: "",
    status: "DRAFT",
  });

  const [rows, setRows] = useState([
    {
      row_id: 1,
      item_id: "",
      inventory_id: "",
      goods_id: "",
      goods_code: "",
      goods_name: "",
      unit_name: "",
      conversion_rate: 1,
      remaining_quantity: 0,
      transfer_quantity: "1,00",
      transfer_main_quantity: "1,00",
    },
  ]);

  const unwrapList = (data) => {
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.data?.results)
      ? data.data.results
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data?.items)
      ? data.data.items
      : [];
  };

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

  const formatViNumber = (value, fractionDigits = 2) => {
    const number = parseNumber(value);

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const createEmptyRow = () => ({
    row_id: Date.now(),
    item_id: "",
    inventory_id: "",
    goods_id: "",
    goods_code: "",
    goods_name: "",
    unit_name: "",
    conversion_rate: 1,
    remaining_quantity: 0,
    transfer_quantity: "1,00",
    transfer_main_quantity: "1,00",
  });

  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses({
        search: "",
        page: 1,
        page_size: 100,
      });

      setWarehouses(unwrapList(data));
    } catch (err) {
      console.error("Load warehouses error:", err.response?.data || err);
      setWarehouses([]);
    }
  };

  const loadStockItems = async (warehouseId, keyword = "") => {
    try {
      if (!warehouseId) {
        setStockItems([]);
        return;
      }

      const data = await getOpeningStocks({
        warehouse_id: warehouseId,
        search: keyword,
        page: 1,
        page_size: 100,
      });

      setStockItems(unwrapList(data));
    } catch (err) {
      console.error("Load stock balance error:", err.response?.data || err);
      setStockItems([]);
    }
  };
        const loadTransfer = async () => {
        try {
            if (!code || code === "new") return;

            const response = await getWarehouseTransferByCode(code);
            const data = response?.data;

            const fromWarehouseId = data.source_warehouse_id || "";

            if (fromWarehouseId && !isViewMode) {
              await loadStockItems(fromWarehouseId);
            }

            setForm({
            id: data.id,
            transfer_code: data.code || "",
            transfer_date: normalizeTransferDate(data.transfer_date),
            reason: data.description || data.reason || "",
            from_warehouse_id: data.source_warehouse_id || "",
            to_warehouse_id: data.destination_warehouse_id || "",
            from_warehouse_address: data.source_warehouse_address || "",
            to_warehouse_address: data.destination_warehouse_address || "",
            reference: data.reference || "",
            status: data.status || "DRAFT",
            });

            const details = Array.isArray(data.items) ? data.items : [];

            setRows(
            details.length > 0
                ? details.map((item, index) => ({
                    row_id: item.item_id || index + 1,
                    item_id: item.item_id || "",
                    inventory_id: item.inventory_id || "",
                    goods_id: item.goods_id || "",
                    goods_unit_id: item.goods_unit_id || "",
                    goods_code: item.goods_code || "",
                    goods_name: item.goods_name || "",
                    unit_name: item.goods_unit_name || "",
                    conversion_rate: item.conversion_ratio || 1,
                    remaining_quantity: formatViNumber(item.available_quantity ?? item.remaining_quantity ?? 0, 2),
                    transfer_quantity: formatViNumber(item.quantity || 0, 2),
                    transfer_main_quantity: formatViNumber(
                        item.quantity_in_default_unit ||
                        item.quantity ||
                        0,
                        2
                    ),
                }))
                : [createEmptyRow()]
            );
        } catch (err) {
            console.error("Load transfer error:", err.response?.data || err);
            alert("Không tải được chi tiết phiếu điều chuyển");
        }
        };

  useEffect(() => {
    loadWarehouses();

    if (isEditMode) {
      loadTransfer();
    }
  }, [code]);

  const handleStockKeywordChange = (rowId, value) => {
    handleRowChange(rowId, "goods_code", value);
    setActiveStockRowId(rowId);
    setShowStockDropdown(true);
    setStockKeyword(value);

    if (stockSearchTimerRef.current) clearTimeout(stockSearchTimerRef.current);
    stockSearchTimerRef.current = setTimeout(() => {
      if (form.from_warehouse_id) {
        loadStockItems(form.from_warehouse_id, value);
      }
    }, 300);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFromWarehouseChange = async (warehouseId) => {
    const selectedWarehouse = warehouses.find(
      (warehouse) => String(warehouse.id) === String(warehouseId)
    );

    setForm((prev) => ({
      ...prev,
      from_warehouse_id: warehouseId,
      from_warehouse_address:
        selectedWarehouse?.address ||
        selectedWarehouse?.warehouse_address ||
        "",
    }));

    setRows([createEmptyRow()]);
    await loadStockItems(warehouseId);
  };

  const handleToWarehouseChange = (warehouseId) => {
    const selectedWarehouse = warehouses.find(
      (warehouse) => String(warehouse.id) === String(warehouseId)
    );

    setForm((prev) => ({
      ...prev,
      to_warehouse_id: warehouseId,
      to_warehouse_address:
        selectedWarehouse?.address ||
        selectedWarehouse?.warehouse_address ||
        "",
    }));
  };

  const handleAddRow = (rowId) => {
    setRows((prev) => {
      const newRow = createEmptyRow();

      if (!rowId) {
        return [...prev, newRow];
      }

      const index = prev.findIndex((item) => item.row_id === rowId);

      if (index === -1) {
        return [...prev, newRow];
      }

      return [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)];
    });
  };

  const handleTransferQuantityEnter = (event, rowId) => {
    if (
      event.key !== "Enter" ||
      event.nativeEvent?.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    // Shift + Enter quay lại ô trước
    if (event.shiftKey) {
      handleEnterMoveNext(event);
      return;
    }

    event.preventDefault();

    // Cho onBlur chạy để định dạng SL điều chuyển
    event.currentTarget.blur();

    const newRow = createEmptyRow();

    setRows((prev) => {
      const currentIndex = prev.findIndex(
        (row) => String(row.row_id) === String(rowId)
      );

      if (currentIndex === -1) {
        return [...prev, newRow];
      }

      return [
        ...prev.slice(0, currentIndex + 1),
        newRow,
        ...prev.slice(currentIndex + 1),
      ];
    });

    setShowStockDropdown(false);
    setActiveStockRowId(null);
    setStockKeyword("");

    // Chờ dòng mới render rồi focus Mã hàng
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const newGoodsCodeInput =
          enterNavigationRef.current?.querySelector(
            `[data-stock-code-row-id="${String(newRow.row_id)}"]`
          );

        if (!newGoodsCodeInput) return;

        newGoodsCodeInput.focus();

        if (typeof newGoodsCodeInput.select === "function") {
          newGoodsCodeInput.select();
        }
      });
    });
  };

  const handleDeleteRow = (rowId) => {
    setRows((prev) => {
      const deletedRow = prev.find(
        (item) => String(item.row_id) === String(rowId)
      );

      if (!deletedRow) return prev;

      // Dòng đã tồn tại ở BE => có item_id
      // Phải gửi lại với is_delete = true
      if (deletedRow.item_id) {
        setDeletedRows((old) => {
          const existed = old.some(
            (item) =>
              String(item.item_id) ===
              String(deletedRow.item_id)
          );

          if (existed) return old;

          return [
            ...old,
            {
              ...deletedRow,
              is_delete: true,
            },
          ];
        });
      }

      // Dòng mới chưa lưu BE thì chỉ cần xóa khỏi FE
      return prev.filter(
        (item) => String(item.row_id) !== String(rowId)
      );
    });
  };


  const handleRowChange = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.row_id !== rowId) return row;

        const nextRow = {
          ...row,
          [field]: value,
        };

        if (field === "transfer_quantity") {
          const qty = parseNumber(value);
          const rate = parseNumber(nextRow.conversion_rate || 1);

          nextRow.transfer_main_quantity = formatViNumber(qty * rate, 2);
        }

        return nextRow;
      })
    );
  };

    const handleSelectInventory = (rowId, item) => {
    if (!item) return;

    const remainingQuantity =
        item.remaining_quantity ||
        item.stock_quantity ||
        item.quantity ||
        item.original_quantity ||
        0;

    const conversionRate =
        item.conversion_rate || item.conversion_ratio || item.ratio || 1;

    setRows((prev) =>
        prev.map((row) => {
        if (row.row_id !== rowId) return row;

        const qty = parseNumber(row.transfer_quantity || 1);

        return {
            ...row,
            inventory_id: item.inventory_id || item.id || "",
            goods_id: item.goods_id || item.goods?.id || item.id || "",
            goods_unit_id: item.unit_id || item.goods_unit_id || "",
            goods_code: item.goods_code || item.code || item.goods?.code || "",
            goods_name: item.goods_name || item.name || item.goods?.name || "",
            unit_name:
            item.unit_name ||
            item.goods_unit_name ||
            item.unit ||
            item.goods_unit?.name ||
            "",
            conversion_rate: conversionRate,
            remaining_quantity: formatViNumber(remainingQuantity, 2),
            transfer_main_quantity: formatViNumber(
            qty * parseNumber(conversionRate),
            2
            ),
        };
        })
    );
    };

  const validateBeforeSave = () => {
    if (!form.from_warehouse_id) {
      alert("Vui lòng chọn kho xuất");
      return false;
    }

    if (!form.to_warehouse_id) {
      alert("Vui lòng chọn kho nhập");
      return false;
    }

    if (String(form.from_warehouse_id) === String(form.to_warehouse_id)) {
      alert("Kho xuất và kho nhập không được trùng nhau");
      return false;
    }

    const validRows = rows.filter((row) => row.goods_id);

    if (validRows.length === 0) {
      alert("Vui lòng chọn ít nhất một hàng hóa tồn kho");
      return false;
    }

    return true;
  };

  const buildPayload = (status = "DRAFT") => {
    return {
        source_warehouse_id: form.from_warehouse_id,
        destination_warehouse_id: form.to_warehouse_id,
        transfer_date: form.transfer_date || getTodayDate(),
        reason: form.reason || null,
        reference: form.reference || null,
        status,
        items: [
            ...rows
                .filter((row) => row.goods_id)
                .map((row, index) => ({
                item_id: row.item_id || null,
                goods_id: row.goods_id,
                goods_unit_id: row.goods_unit_id || null,
                quantity: parseNumber(row.transfer_quantity),
                is_delete: false,
                sort_order: index + 1,
                })),

            ...deletedRows.map((row) => ({
                item_id: row.item_id || null,
                goods_id: row.goods_id,
                goods_unit_id: row.goods_unit_id || null,
                quantity: parseNumber(row.transfer_quantity),
                is_delete: true,
        })),
    ],
        };
    };

  const resetNewTransferForm = () => {
    setForm({
      id: null,
      transfer_code: "",
      transfer_date: getTodayDate(),
      reason: "",
      from_warehouse_id: "",
      to_warehouse_id: "",
      from_warehouse_address: "",
      to_warehouse_address: "",
      reference: "",
      status: "DRAFT",
    });

    setRows([createEmptyRow()]);
    setDeletedRows([]);
    setStockItems([]);
  };

  const handleSaveDraft = async () => {
    try {
      if (!validateBeforeSave()) return;

      const payload = buildPayload("DRAFT");

      if (isEditMode && form.id) {
        await updateWarehouseTransfer(form.id, payload);
        alert("Cập nhật phiếu điều chuyển thành công");
      } else {
        await createWarehouseTransfer(payload);
        alert("Tạo phiếu điều chuyển thành công");
      }

      navigate("/dashboard/activity/transfer");
    } catch (err) {
      console.error("Save transfer error:", err.response?.data || err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Lưu phiếu điều chuyển thất bại"
      );
    }
  };

  const handleSaveDraftAndAddNew = async () => {
    try {
      if (!validateBeforeSave()) return;

      const payload = buildPayload("DRAFT");

      if (isEditMode && form.id) {
        await updateWarehouseTransfer(form.id, payload);
      } else {
        await createWarehouseTransfer(payload);
      }

      alert("Lưu phiếu điều chuyển thành công");

      resetNewTransferForm();
      navigate("/dashboard/activity/transfer/detail/new", { replace: true });
    } catch (err) {
      console.error("Save and add transfer error:", err.response?.data || err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Lưu và thêm phiếu điều chuyển thất bại"
      );
    }
  };

  const handlePrint = () => {
    const transferCode = form.transfer_code || code;

    if (!transferCode) {
      alert("Không tìm thấy số phiếu điều chuyển để in");
      return;
    }

    navigate(`/dashboard/activity/transfer/print/${transferCode}`);
  };

  return (
    <div
      className="warehouse-transfer-page"
      ref={enterNavigationRef}
    >
      <div className="transfer-title">
        Phiếu điều chuyển {form.transfer_code || ""}
      </div>

      <div className="transfer-main">
        <div className="transfer-left">
          <h3>Thông tin chung</h3>

          <div className="transfer-card">
            <label className="radio-line">
              <input type="radio" checked readOnly />
              Điều chuyển giữa các kho
            </label>

            <div className="form-grid">
              <div className="form-group required">
                <label>Kho xuất</label>
                <select
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  disabled={isViewMode}
                  value={form.from_warehouse_id}
                  onChange={(e) => handleFromWarehouseChange(e.target.value)}
                >
                  <option value="">Chọn kho xuất</option>

                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code || warehouse.warehouse_code || ""} -{" "}
                      {warehouse.name || warehouse.warehouse_name || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Địa chỉ kho xuất</label>
                <input value={form.from_warehouse_address} disabled />
              </div>

              <div className="form-group required">
                <label>Kho nhập</label>
                <select
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  disabled={isViewMode}
                  value={form.to_warehouse_id}
                  onChange={(e) => handleToWarehouseChange(e.target.value)}
                >
                  <option value="">Chọn kho nhập</option>

                  {warehouses
                    .filter(
                      (warehouse) =>
                        String(warehouse.id) !==
                        String(form.from_warehouse_id)
                    )
                    .map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code || warehouse.warehouse_code || ""} -{" "}
                        {warehouse.name || warehouse.warehouse_name || ""}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Địa chỉ kho nhập</label>
                <input value={form.to_warehouse_address} disabled />
              </div>

              <div className="form-group full">
                <label>Ngày điều chuyển</label>
                <input
                  type="date"
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  disabled={isViewMode}
                  value={form.transfer_date}
                  onChange={(e) =>
                    handleFormChange("transfer_date", e.target.value)
                  }
                />
              </div>

              <div className="form-group full">
                <label>Lý do điều chuyển</label>
                <input
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  disabled={isViewMode}
                  value={form.reason}
                  onChange={(e) => handleFormChange("reason", e.target.value)}
                  placeholder="Nhập lý do điều chuyển"
                />
              </div>

              <div className="form-group full">
                <label>Tham chiếu</label>
                <input
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  disabled={isViewMode}
                  value={form.reference}
                  onChange={(e) =>
                    handleFormChange("reference", e.target.value)
                  }
                  placeholder="Nhập tham chiếu"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="transfer-status">
          <h3>Theo dõi tình trạng</h3>

          <div className="status-card">
            <div className="status-row">
              <span>Tình trạng thực hiện</span>
              <b>{form.status || "DRAFT"}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Chi tiết</h3>

        <div className="detail-card">
          <div className="goods-toolbar">
            <label>Hàng hóa tồn kho</label>
          </div>

         <div className="table-wrap">
            <table className="transfer-detail-table">
                <colgroup>
                <col className="col-stt" />
                <col className="col-code" />
                <col className="col-name" />
                <col className="col-unit" />
                <col className="col-stock" />
                <col className="col-qty" />
                <col className="col-main-qty" />
                <col className="col-action" />
                </colgroup>

                <thead>
                <tr>
                  <th>#</th>
                  <th>Mã hàng</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th>Tồn kho</th>
                  <th>SL điều chuyển</th>
                  <th>SL điều chuyển theo ĐVT chính</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
  {rows.map((row, index) => (
    <tr key={row.row_id} className="transfer-row">
      <td>{index + 1}</td>

      <td className="goods-code-dropdown-cell">
        <div className="goods-code-dropdown-box">
          <input
            data-enter-next="true"
            data-stock-code-row-id={String(row.row_id)}
            onKeyDown={handleEnterMoveNext}
            value={row.goods_code}
            placeholder={form.from_warehouse_id ? "Chọn mã hàng" : "Chọn kho xuất trước"}
            disabled={isViewMode || !form.from_warehouse_id}
            onFocus={() => {
              setActiveStockRowId(row.row_id);
              setShowStockDropdown(true);
              setStockKeyword(row.goods_code || "");
              if (form.from_warehouse_id && stockItems.length === 0) {
                loadStockItems(form.from_warehouse_id, row.goods_code || "");
              }
            }}
            onChange={(e) => {
              handleStockKeywordChange(row.row_id, e.target.value);
            }}
          />

          <button
            type="button"
            disabled={isViewMode || !form.from_warehouse_id}
            onClick={() => {
              setActiveStockRowId(row.row_id);
              const nextOpen = !showStockDropdown;
              setShowStockDropdown(nextOpen);
              setStockKeyword(row.goods_code || "");
              if (nextOpen && form.from_warehouse_id && stockItems.length === 0) {
                loadStockItems(form.from_warehouse_id, row.goods_code || "");
              }
            }}
          >
            ▾
          </button>
          {showStockDropdown && activeStockRowId === row.row_id && (
            <div className="goods-code-dropdown-list">
                <div className="goods-code-dropdown-header">
                <span>Mã hàng</span>
                <span>Tên hàng</span>
                </div>

                {stockItems.map((item) => (
                <div
                    key={item.inventory_id || item.goods_id || item.id}
                    className="goods-code-dropdown-item"
                    onMouseDown={(e) => {
                        e.preventDefault();

                        handleSelectInventory(row.row_id, item);

                        setShowStockDropdown(false);
                        setActiveStockRowId(null);
                    }}
                >
                    <span>{item.goods_code || item.code}</span>
                    <span>{item.goods_name || item.name}</span>
                </div>
                ))}

                {stockItems.length === 0 && (
                <div className="goods-code-dropdown-status">
                    Không có dữ liệu
                </div>
                )}
            </div>
            )}
        </div>
      </td>

      <td>{row.goods_name}</td>
      <td>{row.unit_name}</td>
      <td>{row.remaining_quantity}</td>

      <td>
      <input
        data-enter-next="true"
        onKeyDown={(e) =>
          handleTransferQuantityEnter(e, row.row_id)
        }
        disabled={isViewMode}
        value={row.transfer_quantity}
        onChange={(e) =>
          handleRowChange(
            row.row_id,
            "transfer_quantity",
            e.target.value
          )
        }
        onBlur={(e) =>
          handleRowChange(
            row.row_id,
            "transfer_quantity",
            formatViNumber(e.target.value, 2)
          )
        }
      />
      </td>

      <td>{row.transfer_main_quantity}</td>

        <td className="delete-row-col">
          {!isViewMode && (
            <div className="detail-action-row add-row-action">
                <button
                type="button"
                className="goods-code-add-btn"
                onClick={() => handleAddRow(row.row_id)}
                >
                <RiAddLine />
                </button>

                <button
                type="button"
                className="delete-row-btn"
                onClick={() => handleDeleteRow(row.row_id)}
                >
                <RiDeleteBin6Line />
                </button>
            </div>
          )}
        </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>

          <div className="detail-footer">
            <span>Tổng số: {rows.length}</span>

            <div className="page-size">
              <span>Số dòng/trang</span>
              <select defaultValue={20}>
                <option value={20}>20</option>
              </select>
              <b>{rows.length ? `1 - ${rows.length}` : "0 - 0"}</b>
            </div>
          </div>
        </div>
      </div>
        <div className="bottom-actions">
          <button type="button" onClick={() => navigate("/dashboard/activity/transfer")}>
            {isPrintMode ? "Quay lại" : "Hủy"}
          </button>

          {isPrintMode && (
            <button type="button" className="print" onClick={handlePrint}>
              <RiPrinterLine />
              In
            </button>
          )}

          {!isViewMode && (
            <>
              <button
                type="button"
                className="outline"
                onClick={handleSaveDraftAndAddNew}
              >
                Lưu và Thêm
              </button>

              <button type="button" className="save" onClick={handleSaveDraft}>
                Lưu
              </button>
            </>
          )}
        </div>
    </div>
  );
}