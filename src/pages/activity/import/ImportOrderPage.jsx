import { useEffect, useState, useMemo, } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/ImportOrderPage.css"; 
import "../../../styles/ImportOrderDetailPage.css";
import {
  getWarehouseReceiptsPageable,
  getWarehouseReceiptByCode,
  updateWarehouseReceiptStatus,
  deleteWarehouseReceipt,
} from "../../../services/warehouseReceiptService";
import { calculateImportOrderTotals } from "../../../utils/importOrderTotals";

import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
} from "react-icons/ri";

import {
  getDefaultImportOrderFilters,
  buildImportOrderFilterParams,
} from "./utils/importOrderFilterUtils";

function ImportOrderPage() {
  const { canDo } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [importOrders, setImportOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [detailRows, setDetailRows] = useState([]);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [filters, setFilters] = useState(getDefaultImportOrderFilters());


 const unwrapData = (response) => response?.data || response;
 const navigate = useNavigate();

 const filteredImportOrders = useMemo(() => {
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    return importOrders;
  }

  return importOrders.filter((row) => {
    const invoiceCode = String(
      row.invoice_code || row.invoice_no || ""
    ).toLowerCase();

    const receiptCode = String(row.code || "").toLowerCase();

    return (
      invoiceCode.includes(keyword) ||
      receiptCode.includes(keyword)
    );
  });
}, [importOrders, search]);

 const selectedRow = filteredImportOrders.find((item) => item.id === selectedId);

 const getReceiptStatusText = (status) => {
  switch (status) {
    case "WAITING_DELIVERY":
      return "Chờ nhận hàng";
    case "RECEIVED":
      return "Đã nhận hàng";
    case "COMPLETED":
      return "Đã hoàn thành";
    default:
      return "-";
  }
};

 const fetchImportOrderDetail = async (code) => {
  if (!code) {
    setDetailRows([]);
    setSelectedReceiptDetail(null);
    return;
  }

  try {
    setDetailLoading(true);

    const response = await getWarehouseReceiptByCode(code);
    const data = unwrapData(response);

    const rawRows =
        data?.inventory_lines ||
        data?.inventory ||
        data?.items ||
        data?.details ||
      [];

    const mappedRows = Array.isArray(rawRows)
      ? rawRows.map((line) => {
          const selectedUnit = Array.isArray(line.units)
            ? line.units.find(
                (unitItem) =>
                  String(unitItem.unit_id) === String(line.goods_unit_id)
              )
            : null;

          return {
            ...line,
            unit_name: selectedUnit?.unit_name || line.unit_name || "",
            conversion_ratio:
              selectedUnit?.conversion_ratio !== null &&
              selectedUnit?.conversion_ratio !== undefined
                ? String(selectedUnit.conversion_ratio)
                : line.conversion_ratio !== null &&
                  line.conversion_ratio !== undefined
                ? String(line.conversion_ratio)
                : "",
          };
        })
      : [];

    setSelectedReceiptDetail(data);
    setDetailRows(mappedRows);
  } catch (error) {
    console.error("LOAD IMPORT ORDER DETAIL ERROR:", error.response?.data || error);
    setSelectedReceiptDetail(null);
    setDetailRows([]);
    alert("Không tải được chi tiết hàng hóa");
  } finally {
    setDetailLoading(false);
  }
};

const fetchImportOrders = async (customParams = {}) => {
  try {
    setLoading(true);

    const filterParams = buildImportOrderFilterParams(filters);

    const response = await getWarehouseReceiptsPageable({
      search,
      page,
      page_size: pageSize,
      ...filterParams,
      ...customParams,
    });

    const data = unwrapData(response);

    const results = Array.isArray(data?.results) ? data.results : [];

    setImportOrders(results);
    setSelectedIds([]);
    setTotal(data?.total || results.length);

    if (results.length > 0) {
      const firstRow = results[0];

      if (!selectedId) {
        setSelectedId(firstRow.id);
        fetchImportOrderDetail(firstRow.code);
      }
    } else {
      setSelectedId(null);
      setDetailRows([]);
    }
  } catch (error) {
    console.error("LOAD IMPORT ORDERS ERROR:", error.response?.data || error);
    alert("Không tải được danh sách phiếu nhập");
    setImportOrders([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
      fetchImportOrders();
    }, [page, pageSize]);

    const parseMoney = (value) => {
      if (value === null || value === undefined || value === "") return 0;

      if (typeof value === "number") return value;

      const text = String(value).trim();

      if (text.includes(",") && text.includes(".")) {
        return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
      }

      if (text.includes(",")) {
        return Number(text.replace(",", ".")) || 0;
      }

      return Number(text) || 0;
    };

    const formatMoney = (value) => {
      return parseMoney(value).toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const formatViNumber = (value, fractionDigits = 2) => {
      return parseMoney(value).toLocaleString("vi-VN", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    };

    const formatViQuantity = (value) => {
      const number = parseMoney(value);

      return number.toLocaleString("vi-VN", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 5,
      });
    };

    const {
      totalAmount: detailTotalAmount,
      vatSummary: detailAutoVatSummary,
    } = calculateImportOrderTotals(detailRows, {
      getQty:   (item) => parseMoney(item.original_quantity || item.quantity || 0),
      getPrice: (item) => parseMoney(item.unit_price || 0),
      getVat:   (item) => String(Number(item.vat || 0)),
    });

    const detailVatAmountSummary =
  selectedReceiptDetail?.vat_amount_summary || {};

    const detailVat0Amount =
      detailVatAmountSummary.vat0amount !== null &&
      detailVatAmountSummary.vat0amount !== undefined
        ? parseMoney(detailVatAmountSummary.vat0amount)
        : parseMoney(detailAutoVatSummary["0"] || 0);

    const detailVat5Amount =
      detailVatAmountSummary.vat5amount !== null &&
      detailVatAmountSummary.vat5amount !== undefined
        ? parseMoney(detailVatAmountSummary.vat5amount)
        : parseMoney(detailAutoVatSummary["5"] || 0);

    const detailVat8Amount =
      detailVatAmountSummary.vat8amount !== null &&
      detailVatAmountSummary.vat8amount !== undefined
        ? parseMoney(detailVatAmountSummary.vat8amount)
        : parseMoney(detailAutoVatSummary["8"] || 0);

    const detailVat10Amount =
      detailVatAmountSummary.vat10amount !== null &&
      detailVatAmountSummary.vat10amount !== undefined
        ? parseMoney(detailVatAmountSummary.vat10amount)
        : parseMoney(detailAutoVatSummary["10"] || 0);

    const detailVatTotalAmount =
      detailVat0Amount +
      detailVat5Amount +
      detailVat8Amount +
      detailVat10Amount;

    const detailGrandTotal = Math.round(
      detailTotalAmount + detailVatTotalAmount
    );

    const handleCompleteReceipt = async (row) => {
      const confirmed = window.confirm(
        `Bạn có chắc muốn hoàn thành phiếu ${row.code || row.invoice_code || ""} không?`
      );
      if (!confirmed) return;
      try {
        await updateWarehouseReceiptStatus(row.id, { status: "COMPLETED" });
        setOpenActionId(null);
        await fetchImportOrders();
        alert("Hoàn thành phiếu nhập thành công");
      } catch (error) {
        console.error("COMPLETE RECEIPT ERROR:", error.response?.data || error);
        alert(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "Hoàn thành phiếu nhập thất bại"
        );
      }
    };

    const handleCompleteSelectedReceipts = async () => {
      const completable = filteredImportOrders.filter(
        (r) => selectedIds.includes(r.id) && r.status !== "COMPLETED"
      );
      const skipped = selectedIds.length - completable.length;

      if (completable.length === 0) {
        alert("Không có phiếu nào có thể hoàn thành (tất cả đã hoàn thành).");
        return;
      }

      const msg =
        skipped > 0
          ? `Hoàn thành ${completable.length} phiếu (bỏ qua ${skipped} phiếu đã hoàn thành)?`
          : `Bạn có chắc muốn hoàn thành ${completable.length} phiếu nhập đã chọn không?`;
      if (!window.confirm(msg)) return;

      const results = await Promise.allSettled(
        completable.map((r) =>
          updateWarehouseReceiptStatus(r.id, { status: "COMPLETED" })
        )
      );
      const failed = results.filter((r) => r.status === "rejected");

      setSelectedIds([]);
      await fetchImportOrders();

      if (failed.length === 0) {
        alert(`Hoàn thành ${completable.length} phiếu nhập thành công`);
      } else {
        alert(
          `Hoàn thành ${completable.length - failed.length}/${completable.length} thành công. ` +
          `${failed.length} phiếu thất bại.`
        );
      }
    };
  const handleDeleteReceipt = async (row) => {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa phiếu ${row.code || row.invoice_code || ""} không?`
  );

  if (!confirmed) return;

  try {
    await deleteWarehouseReceipt(row.id);

    setOpenActionId(null);
    await fetchImportOrders();
    alert("Xóa phiếu nhập thành công");
  } catch (error) {
    console.error("DELETE RECEIPT ERROR:", error.response?.data || error);
    alert("Xóa phiếu nhập thất bại");
  }
};

  const isAllChecked =
    filteredImportOrders.length > 0 &&
    filteredImportOrders.every((row) => selectedIds.includes(row.id));

  const handleToggleAll = (e) => {
    const checked = e.target.checked;

    if (checked) {
      setSelectedIds(filteredImportOrders.map((row) => row.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (e, rowId) => {
    e.stopPropagation();

    setSelectedIds((prev) => {
      if (prev.includes(rowId)) {
        return prev.filter((id) => id !== rowId);
      }

      return [...prev, rowId];
    });
  };

    const handleDeleteSelectedReceipts = async () => {
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một phiếu cần xóa");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} phiếu nhập đã chọn không?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteWarehouseReceipt(id)));

      setSelectedIds([]);
      setSelectedId(null);
      setDetailRows([]);
      setSelectedReceiptDetail(null);

      await fetchImportOrders();

      alert("Xóa các phiếu nhập đã chọn thành công");
    } catch (error) {
      console.error("DELETE SELECTED RECEIPTS ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa các phiếu nhập đã chọn thất bại"
      );
    }
  };

    const handleFilterChange = (e) => {
      const { name, value } = e.target;

      const nextFilters = {
        ...filters,
        [name]: value,
      };

      setFilters(nextFilters);

      if (nextFilters.time_type === "custom") {
        if (!nextFilters.start_date || !nextFilters.end_date) {
          return;
        }

        if (new Date(nextFilters.start_date) > new Date(nextFilters.end_date)) {
          alert("Ngày bắt đầu không được lớn hơn ngày kết thúc");
          return;
        }
      }

      const filterParams = buildImportOrderFilterParams(nextFilters);

      setPage(1);

      fetchImportOrders({
        page: 1,
        ...filterParams,
      });
    };
  
    const handleTimeTypeChange = (e) => {
    const value = e.target.value;

    const nextFilters = {
      ...filters,
      time_type: value,
      start_date: value === "custom" ? filters.start_date : "",
      end_date: value === "custom" ? filters.end_date : "",
    };

    setFilters(nextFilters);
    setPage(1);

    if (value === "custom") {
      return;
    }

    const filterParams = buildImportOrderFilterParams(nextFilters);

    fetchImportOrders({
      page: 1,
      ...filterParams,
    });
  };

  return (
    <div className="warehouse-import-page">
      <div className="warehouse-import-toolbar">
        <div className="warehouse-import-filters">
          <input
            className="warehouse-import-search"
            placeholder="🔍  Tìm kiếm số hóa đơn"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
            }}
          />
          <select
            className="warehouse-import-time-select"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="WAITING_DELIVERY">Chờ nhận hàng</option>
            <option value="RECEIVED">Đã nhận hàng</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
            <select
              className="warehouse-import-time-select"
              name="time_type"
              value={filters.time_type}
              onChange={handleTimeTypeChange}
            >
              <option value="this_month">Tháng này</option>
              <option value="quarter_1">Quý 1</option>
              <option value="quarter_2">Quý 2</option>
              <option value="quarter_3">Quý 3</option>
              <option value="quarter_4">Quý 4</option>
              <option value="custom">Tùy chọn</option>
            </select>

            {filters.time_type === "custom" && (
              <>
                <input
                  type="date"
                  name="start_date"
                  className="warehouse-import-date-input"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />

                <input
                  type="date"
                  name="end_date"
                  className="warehouse-import-date-input"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </>
            )}
        </div>

        <div className="warehouse-import-actions">
          {canDo("update_warehouse_receipt") && (
            <button
              className="edit-btn"
              disabled={selectedIds.length > 1 || !selectedRow || selectedRow.status === "COMPLETED"}
              title={selectedIds.length > 1 ? "Chỉ chỉnh sửa được 1 phiếu tại một thời điểm" : ""}
              onClick={() => {
                if (!selectedRow) {
                  alert("Vui lòng chọn phiếu cần chỉnh sửa");
                  return;
                }
                if (selectedRow.status === "COMPLETED") {
                  alert("Phiếu đã hoàn thành, không được chỉnh sửa.");
                  return;
                }
                if (selectedRow.status === "RECEIVED") {
                  navigate(
                    `/dashboard/activity/import/order-detail/${selectedRow.code || selectedRow.id}?mode=edit-items`
                  );
                  return;
                }
                navigate(
                  `/dashboard/activity/import/order-detail/${selectedRow.code || selectedRow.id}`
                );
              }}
            >
              <RiEdit2Line />
              <span>Chỉnh sửa</span>
            </button>
          )}

          {canDo("complete_warehouse_receipt") && (
            <button
              className="complete-toolbar-btn"
              disabled={selectedIds.length > 1 ? false : !selectedRow}
              onClick={() => {
                if (selectedIds.length > 1) {
                  handleCompleteSelectedReceipts();
                  return;
                }
                if (!selectedRow) {
                  alert("Vui lòng chọn phiếu cần hoàn thành");
                  return;
                }
                handleCompleteReceipt(selectedRow);
              }}
            >
              <RiCheckboxCircleLine />
              <span>
                {selectedIds.length > 1
                  ? `Hoàn thành (${selectedIds.length})`
                  : "Hoàn thành"}
              </span>
            </button>
          )}

          {canDo("delete_warehouse_receipt") && (
            <button
              className="delete-toolbar-btn"
              disabled={!selectedRow && selectedIds.length === 0}
              onClick={() => {
                if (selectedIds.length > 1) {
                  handleDeleteSelectedReceipts();
                  return;
                }
                if (!selectedRow) {
                  alert("Vui lòng chọn phiếu cần xóa");
                  return;
                }
                handleDeleteReceipt(selectedRow);
              }}
            >
              <RiDeleteBin6Line />
              <span>{selectedIds.length > 1 ? `Xóa (${selectedIds.length})` : "Xóa"}</span>
            </button>
          )}

          {canDo("create_warehouse_receipt") && (
            <button
              className="add-btn"
              onClick={() => navigate("/dashboard/activity/import/order-detail/new")}
            >
              <RiAddLine />
              <span>Thêm</span>
            </button>
          )}
        </div>
      </div>

      <div className="warehouse-import-main">
        <div className="warehouse-import-table-wrapper">
          <table className="warehouse-import-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={handleToggleAll}
                  />
                </th>
                <th>Số hóa đơn</th>
                <th>Tình trạng thực hiện</th>
                <th>Ngày nhập kho</th>
                <th>Kho nhập</th>
                <th>Người thực hiện nhập</th>
                <th>Ngày tạo phiếu nhập</th>
                <th>Người sửa phiếu nhập</th>
                <th>Ngày sửa</th>
              </tr>
            </thead>

            <tbody>
              {filteredImportOrders.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? "selected" : ""}
                  onClick={() => {
                      setSelectedId(row.id);
                      fetchImportOrderDetail(row.code);
              }}
                >
                  <td className="checkbox-col">
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => handleToggleOne(e, row.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                  </td>

                  <td
                    className="link-text"
                    onClick={(e) => {
                      e.stopPropagation();

                      navigate(
                        `/dashboard/activity/import/order-detail/${row.code || row.id}?mode=print`
                      );
                    }}
                  >
                    {row.invoice_code || row.invoice_no || row.code || "-"}
                  </td>
                    <td>{getReceiptStatusText(row.status)}</td>
                    <td>{row.receipt_date || row.import_date || "-"}</td>
                    <td>{row.warehouse_name || row.warehouse?.name || row.warehouse || "-"}</td>
                    <td>{row.created_by_admin_name || row.importer || "-"}</td>
                    <td>{row.created_at || "-"}</td>
                    <td>{row.last_updated_by_admin_name || "-"}</td>
                    <td>{row.updated_at || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="warehouse-import-pagination">
          <div>
            Tổng số: <strong>{total}</strong>
          </div>

          <div className="pagination-right">
            <span>Số dòng/trang</span>
            <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <strong>
                {filteredImportOrders.length > 0 ? 1 : 0} - {filteredImportOrders.length}
            </strong>

            <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
              ‹
            </button>

            <button
              disabled={page * pageSize >= total}
              onClick={() => setPage((prev) => prev + 1)}
            >
              ›
            </button>
          </div>
        </div>

        <div className="detail-splitter">⌄</div>
          <div className="warehouse-import-detail">
            <h3>Chi tiết hàng hóa</h3>

            <div className="import-list-detail-card">
              <div className="detail-search">
                <span>🔍</span>
                <input placeholder="Tìm kiếm" readOnly />
              </div>

              <div className="import-list-detail-table-wrapper">
                <table className="import-list-detail-table">
                  <colgroup>
                    <col className="col-stt" />
                    <col className="col-code" />
                    <col className="col-name" />
                    <col className="col-unit" />
                    <col className="col-qty" />
                    <col className="col-qty" />
                    <col className="col-qty" />
                    <col className="col-check" />
                    <col className="col-price" />
                    <col className="col-amount" />
                    <col className="col-vat" />
                  </colgroup>

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã hàng</th>
                      <th>Tên hàng</th>
                      <th>ĐVT</th>
                      <th>Tỷ lệ chuyển đổi</th>
                      <th>SL yêu cầu</th>
                      <th>SL thực nhập</th>
                      <th>Đánh dấu đủ</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Thuế VAT</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailLoading && (
                      <tr>
                        <td colSpan={11}>Đang tải chi tiết...</td>
                      </tr>
                    )}

                    {!detailLoading && detailRows.length === 0 && (
                      <tr>
                        <td colSpan={11}>Không có chi tiết hàng hóa</td>
                      </tr>
                    )}

                    {!detailLoading &&
                      detailRows.map((item, index) => {
                        const requestedQuantity = parseMoney(
                          item.request_quantity || item.requested_quantity || 0
                        );

                        const originalQuantity = parseMoney(item.original_quantity || 0);
                        const unitPrice = parseMoney(item.unit_price || 0);
                        const amount = originalQuantity * unitPrice;

                        return (
                          <tr key={item.inventory_id || item.goods_id || index}>
                            <td>{index + 1}</td>
                            <td>{item.goods_code || "-"}</td>
                            <td>{item.goods_name || "-"}</td>
                            <td>{item.unit_name || "-"}</td>

                            <td className="number-col">
                              {formatViNumber(item.conversion_ratio || 1, 3)}
                            </td>

                            <td className="number-col">
                              {formatViQuantity(requestedQuantity)}
                            </td>

                            <td className="number-col">
                              {formatViQuantity(originalQuantity)}
                            </td>

                            <td className="center-col">
                              <input
                                type="checkbox"
                                checked={requestedQuantity === originalQuantity}
                                readOnly
                                disabled
                              />
                            </td>

                            <td className="number-col">
                              {formatViNumber(unitPrice, 3)}
                            </td>

                            <td className="number-col">
                              {formatViNumber(amount, 0)}
                            </td>

                            <td className="number-col">
                              {Number(item.vat || 0)}%
                            </td>
                          </tr>
                        );
                      })}

                    {!detailLoading && detailRows.length > 0 && (
                      <tr className="table-total-row">
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>

                        <td className="number-col">
                          {formatViQuantity(
                            detailRows.reduce(
                              (sum, item) =>
                                sum +
                                parseMoney(
                                  item.request_quantity || item.requested_quantity || 0
                                ),
                              0
                            )
                          )}
                        </td>

                        <td className="number-col">
                          {formatViQuantity(
                            detailRows.reduce(
                              (sum, item) => sum + parseMoney(item.original_quantity || 0),
                              0
                            )
                          )}
                        </td>

                        <td></td>
                        <td></td>

                        <td className="number-col">
                          {formatViNumber(detailTotalAmount, 0)}
                        </td>

                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!detailLoading && detailRows.length > 0 && (
                <div className="import-list-money-summary">
                  <div className="money-row">
                    <span>Cộng</span>
                    <strong>{formatViNumber(detailTotalAmount, 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 0%</span>
                      <strong>{formatViNumber(detailVat0Amount, 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 5%</span>
                    <strong>{formatViNumber(detailVat5Amount, 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 8%</span>
                    <strong>{formatViNumber(detailVat8Amount, 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 10%</span>
                    <strong>{formatViNumber(detailVat10Amount, 0)}</strong>
                  </div>

                  <div className="money-row total">
                    <span>Tổng cộng</span>
                    <strong>{formatViNumber(detailGrandTotal, 0)}</strong>
                  </div>
                </div>
              )}

              <div className="table-bottom-bar">
                <div>
                  Tổng số: <strong>{detailRows.length}</strong>
                </div>

                <div className="table-pagination">
                  <span>Số dòng/trang</span>
                  <select defaultValue={20}>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <strong>1 - {detailRows.length}</strong>
                  <button disabled>‹</button>
                  <button disabled>›</button>
                </div>
              </div>
            </div>
          </div>
      </div>
    {openActionId && menuPosition && (
    <div
      className="row-action-menu fixed-row-action-menu"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          const row = importOrders.find((item) => item.id === openActionId);
          if (row) handleCompleteReceipt(row);
        }}
      >
        Hoàn thành
      </button>

      <button
        className="danger"
        onClick={() => {
          const row = importOrders.find((item) => item.id === openActionId);
          if (row) handleDeleteReceipt(row);
        }}
      >
        Xóa
      </button>
    </div>
  )}
    </div>
  );
}

export default ImportOrderPage;