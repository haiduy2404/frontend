import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/ReleaseOrderPage.css";
import {
  getReleaseOrdersPageable,
  getReleaseOrderByCode,
  updateReleaseOrder,
  completeReleaseOrder,
} from "../../../services/releaseOrderService";

import {
  getDefaultWarehouseReleaseFilters,
  buildWarehouseReleaseFilterParams,
} from "./utils/warehouseReleaseFilterUtils";
import { getWarehouses  } from "../../../services/warehouseService";
import {
  RiCheckboxCircleLine,
  RiSave3Line,
} from "react-icons/ri";

function WarehouseReleasePage() {
  const navigate = useNavigate();
  const { canDo } = useAuth();
  const canUpdateRelease = canDo("update_warehouse_release1");
  const canInputActualQuantity = canDo("update_actual_released_quantity");
  const canUseReleaseActualPage = canUpdateRelease && canInputActualQuantity;
  const [releaseOrders, setReleaseOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(
      getDefaultWarehouseReleaseFilters()
  );
  const [warehouses, setWarehouses] = useState([]);
  const unwrapData = (response) => response?.data || response;
  const handleCompleteRelease = async () => {
  if (!selectedOrder) {
    alert("Vui lòng chọn lệnh xuất kho");
    return;
  }
  try {
    // lưu SL thực xuất trước
    const payload = {
      terms: selectedOrder.terms || null,
      release_date: selectedOrder.release_date,
      warehouse_id:
        selectedOrder.warehouse_id || selectedOrder.warehouse?.id,
      receiver_unit: selectedOrder.receiver_unit?.name || null,
      release_target: selectedOrder.release_target?.name || null,
      description: selectedOrder.description || null,

      items: detailRows.map((item) => ({
        item_id: item.item_id,
        goods_id: item.goods_id,
        goods_unit_id: item.goods_unit_id || null,
        requested_quantity: parseNumber(item.requested_quantity),
        actual_quantity: parseNumber(item.actual_quantity),
        is_delete: false,
      })),
    };

    await updateReleaseOrder(selectedOrder.id, payload);

    // hoàn thành xuất kho
    await completeReleaseOrder(selectedOrder.id);

    alert("Hoàn thành xuất kho thành công");

    await fetchReleaseOrders();
    await fetchReleaseOrderDetail(
      selectedOrder.code || selectedOrder.release_code
    );
  } catch (error) {
    console.error(
      "COMPLETE RELEASE ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Hoàn thành xuất kho thất bại"
    );
  }
};

  const fetchWarehouses = async () => {
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
      console.error("LOAD WAREHOUSES ERROR:", error.response?.data || error);
      setWarehouses([]);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

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
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN");
  };


  const getReleaseStatusText = (status) => {
    switch (status) {
      case "WAITING_RELEASE":
        return "Chờ xuất kho";
      case "RELEASED":
        return "Đã xuất kho";
      case "COMPLETED":
        return "Đã hoàn thành";
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

    const filterParams =
      buildWarehouseReleaseFilterParams(currentFilters);

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
      setTotal(data?.total || data?.count || results.length);

      if (results.length > 0 && !selectedId) {
        const firstRow = results[0];
        setSelectedId(firstRow.id);
        fetchReleaseOrderDetail(firstRow.code || firstRow.release_code);
      }

      if (results.length === 0) {
        setSelectedId(null);
        setSelectedOrder(null);
        setDetailRows([]);
      }
    } catch (error) {
      console.error("LOAD RELEASE ORDERS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách lệnh xuất kho");
      setReleaseOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchReleaseOrderDetail = async (code) => {
    if (!code) return;

    try {
      setDetailLoading(true);

      const response = await getReleaseOrderByCode(code);
      const data = unwrapData(response);

    const rows =
    data?.items ||
    data?.inventory_lines ||
    data?.release_inventory_lines ||
    data?.inventory ||
    data?.details ||
    [];

      setSelectedOrder(data);

      setDetailRows(
        Array.isArray(rows)
          ? rows.map((item, index) => {
              const requestedQuantity = parseNumber(
                item.request_quantity ||
                  item.requested_quantity ||
                  item.original_quantity ||
                  0
              );

              const actualQuantity = parseNumber(
                item.actual_quantity ||
                  item.release_quantity ||
                  item.exported_quantity ||
                  0
              );
              const quantityInDefaultUnit = parseNumber(
                item.quantity_in_default_unit
              );
              const baseQuantity =
                actualQuantity > 0 ? actualQuantity : requestedQuantity;
              const conversionRatio =
                item.goods_unit_id &&
                baseQuantity > 0 &&
                quantityInDefaultUnit !== null &&
                !Number.isNaN(quantityInDefaultUnit)
                  ? quantityInDefaultUnit / baseQuantity
                  : parseNumber(item.conversion_ratio || 1) || 1;

                return {
                    id:
                        item.item_id ||
                        item.release_inventory_id ||
                        item.inventory_id ||
                        item.id ||
                        index + 1,

                    item_id:
                        item.item_id ||
                        item.release_inventory_id ||
                        item.inventory_id ||
                        item.id ||
                        "",

                    goods_id: item.goods_id || item.goods?.id || "",
                    goods_code:
                        item.goods_code ||
                        item.goods?.code ||
                        item.code ||
                    "",

                    goods_name:
                        item.goods_name ||
                        item.goods?.name ||
                        item.name ||
                    "",

                    goods_unit_id:
                        item.goods_unit_id ||
                        item.unit_id ||
                        item.goods_unit?.id ||
                    "",

                    unit_name:
                        item.goods_unit_name ||
                        item.unit_name ||
                        item.goods_unit?.name ||
                    "",
                    conversion_ratio: conversionRatio,
                    requested_quantity: formatViNumber(requestedQuantity, 2),
                    actual_quantity: formatViNumber(actualQuantity, 2),
                };
            })
          : []
      );
    } catch (error) {
      console.error("LOAD RELEASE DETAIL ERROR:", error.response?.data || error);
      alert("Không tải được chi tiết lệnh xuất kho");
      setSelectedOrder(null);
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
    }
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
  }, [page, pageSize, debouncedSearch]);

    const handleChangeActualQuantity = (rowId, value) => {
        setDetailRows((prev) =>
        prev.map((item) =>
            item.id === rowId
            ? {
                ...item,
                actual_quantity: value,
                }
            : item
        )
        );
    };

    const handleSaveActualQuantity = async () => {
    if (!canUseReleaseActualPage) {
        alert("Bạn không có quyền nhập số lượng thực xuất");
        return;
    }

    if (!selectedOrder) {
        alert("Vui lòng chọn lệnh xuất kho");
        return;
    }

    try {
        const payload = {
        terms: selectedOrder.terms || null,
        release_date: selectedOrder.release_date,
        warehouse_id: selectedOrder.warehouse_id || selectedOrder.warehouse?.id,
        receiver_unit: selectedOrder.receiver_unit?.name || null,
        release_target: selectedOrder.release_target?.name || null,
        description: selectedOrder.description || null,

        items: detailRows.map((item) => ({
            item_id: item.item_id,
            goods_id: item.goods_id,
            goods_unit_id: item.goods_unit_id || null,
            requested_quantity: parseNumber(item.requested_quantity),
            actual_quantity: parseNumber(item.actual_quantity),
            is_delete: false,
        })),
        };

        await updateReleaseOrder(selectedOrder.id, payload);

        alert("Cập nhật số lượng thực xuất thành công");
        await fetchReleaseOrders();
        await fetchReleaseOrderDetail(selectedOrder.code || selectedOrder.release_code);
    } catch (error) {
        console.error("SAVE ACTUAL RELEASED QUANTITY ERROR:", error.response?.data || error);
        alert(
        error.response?.data?.message ||
            error.response?.data?.detail ||
            "Cập nhật số lượng thực xuất thất bại"
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
    setPage(1);

    if (nextFilters.time_type === "custom") {
      if (!nextFilters.start_date || !nextFilters.end_date) {
        return;
      }
    }

    fetchReleaseOrders(
      {
        page: 1,
        ...buildWarehouseReleaseFilterParams(nextFilters),
      },
      nextFilters
    );
  };

  const handleTimeTypeChange = (e) => {
    const value = e.target.value;

    const nextFilters = {
      ...filters,
      time_type: value,
    };

    setFilters(nextFilters);

    if (value === "custom") {
      return;
    }

    setPage(1);

    fetchReleaseOrders({
      page: 1,
      ...buildWarehouseReleaseFilterParams(nextFilters),
    });
    nextFilters
  };

  return (
    <div className="release-order-page">
      <div className="release-order-tabs">
        <button
          type="button"
          className="release-order-tab"
          onClick={() => navigate("/dashboard/activity/export/order")}
        >
          Lệnh xuất kho
        </button>

        <button
          type="button"
          className="release-order-tab active"
          disabled={!canUseReleaseActualPage}
          onClick={() => {
            if (!canUseReleaseActualPage) {
              alert("Bạn không có quyền xuất kho");
              return;
            }

            navigate("/dashboard/activity/export/release");
          }}
        >
          Xuất kho
        </button>
      </div>

      <div className="release-order-toolbar">
        <div className="release-order-filters">
          <input
            className="release-order-search"
            placeholder="🔍  Tìm kiếm số lệnh xuất / đơn vị lĩnh"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
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
          <select
            name="warehouse_id"
            value={filters.warehouse_id}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả kho</option>
            {warehouses.map((warehouse) => {
              const id = warehouse.id || warehouse.warehouse_id;
              const name = warehouse.name || warehouse.warehouse_name || warehouse.code || id;

              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
            {filters.time_type === "custom" && (
              <>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />

                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </>
            )}
        </div>

        <div className="release-order-actions">
          {canUseReleaseActualPage && (
            <>
              <button
                className="release-edit-btn"
                disabled={!selectedOrder}
                onClick={handleSaveActualQuantity}
              >
                <RiSave3Line />
                <span>Lưu SL thực xuất</span>
              </button>
                <button
                    className="release-complete-btn"
                    disabled={!selectedOrder}
                    onClick={handleCompleteRelease}
                    >
                    <RiCheckboxCircleLine />
                    <span>Hoàn thành</span>
                </button>
            </>
          )}
        </div>
      </div>

      <div className="release-order-main">
        <div className="release-order-table-wrapper">
          <table className="release-order-table">
            <thead>
              <tr>
                <th>Số lệnh XK</th>
                <th>Tình trạng</th>
                <th>Ngày xuất kho</th>
                <th>Kho xuất</th>
                <th>Đơn vị lĩnh vật tư</th>
                <th>Đối tượng xuất kho</th>
                <th>Người tạo</th>
                <th>Ngày tạo</th>
                <th>Người sửa</th>
                <th>Ngày sửa</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10}>Đang tải danh sách lệnh xuất kho...</td>
                </tr>
              )}

              {!loading && releaseOrders.length === 0 && (
                <tr>
                  <td colSpan={10}>Không có dữ liệu lệnh xuất kho</td>
                </tr>
              )}

              {!loading &&
                releaseOrders.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? "selected" : ""}
                    onClick={() => {
                      setSelectedId(row.id);
                      fetchReleaseOrderDetail(row.code || row.release_code);
                    }}
                  >
                    <td
                        className="release-order-link-text"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/activity/export/release-print/${row.code || row.release_code}`);
                        }}
                        >
                        {row.code || row.release_code || "-"}
                    </td>
                    <td>{getReleaseStatusText(row.status)}</td>
                    <td>{row.release_date || "-"}</td>
                    <td>{row.warehouse_name || row.warehouse?.name || row.warehouse || "-"}</td>
                    <td>{row.receiver_unit?.name || "-"}</td>
                    <td>{row.release_target?.name || "-"}</td>
                    <td>{row.created_by_admin_name || row.created_by || "-"}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{row.last_updated_by_admin_name || row.updated_by || "-"}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="release-order-pagination">
          <div>
            Tổng số: <strong>{total}</strong>
          </div>

          <div className="release-pagination-right">
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

        <div className="release-detail-splitter">⌄</div>

        <div className="release-order-detail">
          <h3>Chi tiết xuất kho</h3>

          <div className="release-detail-card">
            <div className="release-detail-table-wrapper">
              <table className="release-detail-table">
                <colgroup>
                  <col className="release-col-stt" />
                  <col className="release-col-code" />
                  <col className="release-col-name" />
                  <col className="release-col-unit" />
                  <col className="release-col-qty" />
                  <col className="release-col-qty" />
                  <col className="release-col-qty" />
                </colgroup>

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã VT</th>
                    <th>Tên hàng</th>
                    <th>ĐVT</th>
                    <th>Tỷ lệ chuyển đổi</th>
                    <th>SL yêu cầu</th>
                    <th>SL thực xuất</th>
                  </tr>
                </thead>

                <tbody>
                  {detailLoading && (
                    <tr>
                      <td colSpan={7}>Đang tải chi tiết...</td>
                    </tr>
                  )}

                  {!detailLoading && detailRows.length === 0 && (
                    <tr>
                      <td colSpan={7}>Không có chi tiết hàng hóa</td>
                    </tr>
                  )}

                  {!detailLoading &&
                    detailRows.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.goods_code || "-"}</td>

                        <td>{item.goods_name || "-"}</td>

                        <td>{item.unit_name || "-"}</td>
                        <td className="release-number-col">
                          {formatViNumber(item.conversion_ratio || 1, 3)}
                        </td>

                        <td className="release-number-col">
                          {item.requested_quantity}
                        </td>

                        <td className="release-number-col">
                          <input
                            className="table-number-input"
                            value={item.actual_quantity}
                            disabled={!canUseReleaseActualPage}
                            onChange={(e) =>
                              handleChangeActualQuantity(item.id, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}

                  {!detailLoading && detailRows.length > 0 && (
                    <tr className="release-total-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>

                      <td className="release-number-col">
                        {formatViNumber(
                          detailRows.reduce(
                            (sum, item) =>
                              sum + parseNumber(item.requested_quantity),
                            0
                          ),
                          2
                        )}
                      </td>

                      <td className="release-number-col">
                        {formatViNumber(
                          detailRows.reduce(
                            (sum, item) =>
                              sum + parseNumber(item.actual_quantity),
                            0
                          ),
                          2
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="release-table-bottom-bar">
              <div>
                Tổng số: <strong>{detailRows.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarehouseReleasePage;