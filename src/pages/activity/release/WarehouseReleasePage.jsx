import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/WarehouseReleasePage.css";

import {
  getReleaseOrdersPageable,
  getReleaseOrderByCode,
  deleteReleaseOrder,
  updateWarehouseReleaseStatus,
} from "../../../services/releaseOrderService";

import {
  getDefaultWarehouseReleaseFilters,
  buildWarehouseReleaseFilterParams,
} from "./utils/warehouseReleaseFilterUtils";

import { getWarehouses } from "../../../services/warehouseService";

import {
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCloseCircleLine,
  RiLoader4Line,
} from "react-icons/ri";

function WarehouseReleasePage() {
  const navigate = useNavigate();
  const { canDo } = useAuth();

  const canUpdateRelease = canDo("update_warehouse_release");
  const canInputActualQuantity = canDo("update_actual_released_quantity");
  const canUseReleaseActualPage = canUpdateRelease || canInputActualQuantity;
  const canDelete = canDo("delete_warehouse_release");
  const canDeleteAdmin = canDo("delete_warehouse_admin");
  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get("mode") === "print";
  const [releaseOrders, setReleaseOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailSearch, setDetailSearch] = useState("");

  const [topPaneHeight, setTopPaneHeight] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  const splitContainerRef = useRef(null);
  const listPaneRef = useRef(null);
  const resizeStartRef = useRef(null);

  const [warehouses, setWarehouses] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState(getDefaultWarehouseReleaseFilters());

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);

  const unwrapData = (response) => response?.data || response;
  const filteredDetailRows = useMemo(() => {
    const keyword = detailSearch.trim().toLowerCase();

    if (!keyword) return detailRows;

    return detailRows.filter((item) => {
      const searchableText = [
        item.goods_code,
        item.goods_name,
        item.unit_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [detailRows, detailSearch]);

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

  const canDeleteReleaseByStatus = (status) => {
    return status === "PENDING" || status === "WAIT_TO_APPROVE";
  };

  const canRejectReleaseByStatus = (status) => {
    if (status === "WAIT_TO_APPROVE") {
      return canUpdateRelease;
    }

    if (status === "COMPLETED") {
      return canDeleteAdmin;
    }

    return false;
  };

  const getWarehouseDisplayName = (warehouse) => {
    return (
      warehouse?.name ||
      warehouse?.warehouse_name ||
      warehouse?.code ||
      warehouse?.id ||
      ""
    );
  };

  const getRowCode = (row) => row?.code || row?.release_code || "";

  const getActionOrder = () => {
    if (selectedIds.length === 1) {
      return releaseOrders.find((row) => row.id === selectedIds[0]) || null;
    }

    return selectedOrder;
  };

  const isAllChecked =
    releaseOrders.length > 0 &&
    releaseOrders.every((row) => selectedIds.includes(row.id));

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

  const fetchReleaseOrderDetail = async (code) => {
    if (!code) return;

    try {
      setDetailLoading(true);

      const response = await getReleaseOrderByCode(code);
      const data = unwrapData(response);

      const rows = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.inventory_lines)
        ? data.inventory_lines
        : Array.isArray(data?.release_inventory_lines)
        ? data.release_inventory_lines
        : Array.isArray(data?.details)
        ? data.details
        : [];

      setSelectedOrder(data);

      setDetailRows(
        rows.map((item, index) => {
          const requestedQuantity = parseNumber(
            item.request_quantity ??
              item.requested_quantity ??
              item.original_quantity ??
              0
          );

          const actualQuantity = parseNumber(
            item.actual_quantity ??
              item.release_quantity ??
              item.exported_quantity ??
              0
          );

          const conversionRatio =
            parseNumber(
              item.conversion_ratio ??
                item.goods_conversion_ratio ??
                item.unit_conversion_ratio ??
                1
            ) || 1;

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
              item.goods_code || item.goods?.code || item.code || "",

            goods_name:
              item.goods_name || item.goods?.name || item.name || "",

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
            actual_quantity:
              item.actual_quantity === null ||
              item.actual_quantity === undefined
                ? ""
                : formatViNumber(actualQuantity, 2),
          };
        })
      );
    } catch (error) {
      console.error("LOAD RELEASE DETAIL ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Không tải được chi tiết lệnh xuất kho"
      );
      setSelectedOrder(null);
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
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
        setSelectedOrder(null);
        setDetailRows([]);
        return;
      }

      const currentStillExists =
        selectedId && results.some((row) => row.id === selectedId);

      if (!currentStillExists) {
        const firstRow = results[0];
        setSelectedId(firstRow.id);
        fetchReleaseOrderDetail(getRowCode(firstRow));
      }
    } catch (error) {
      console.error("LOAD RELEASE ORDERS ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Không tải được danh sách lệnh xuất kho"
      );

      setReleaseOrders([]);
      setSelectedIds([]);
      setSelectedId(null);
      setSelectedOrder(null);
      setDetailRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

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

  const handleSelectRow = (row) => {
    setSelectedId(row.id);
    fetchReleaseOrderDetail(getRowCode(row));
  };

  const handleToggleAll = (e) => {
    const checked = e.target.checked;
    setSelectedIds(checked ? releaseOrders.map((row) => row.id) : []);
  };

  const handleToggleOne = (e, rowId) => {
    e.stopPropagation();

    setSelectedIds((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
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
    setPage(1);

    if (value === "custom") {
      return;
    }

    fetchReleaseOrders(
      {
        page: 1,
      },
      nextFilters
    );
  };

  const handleEditRelease = () => {
      if (selectedIds.length > 1) {
        alert("Chỉ được chỉnh sửa 1 lệnh xuất kho tại một thời điểm");
        return;
      }

      const order = getActionOrder();

      if (!order) {
        alert("Vui lòng chọn lệnh xuất kho cần chỉnh sửa");
        return;
      }

      const code = getRowCode(order);

      if (!code) {
        alert("Không tìm thấy số lệnh xuất kho");
        return;
      }

      navigate(`/dashboard/activity/export/release/edit/${code}`);
    };

    const handleRejectRelease = async () => {
    if (rejecting) return;

    if (!canUpdateRelease && !canDeleteAdmin) {
      alert("Bạn không có quyền từ chối lệnh xuất kho");
      return;
    }

    if (selectedIds.length > 1) {
      alert("Chỉ được từ chối 1 lệnh xuất kho tại một thời điểm");
      return;
    }

    const order = getActionOrder();

    if (!order) {
      alert("Vui lòng chọn lệnh xuất kho cần từ chối");
      return;
    }

    if (!canRejectReleaseByStatus(order.status)) {
      if (order.status === "COMPLETED" && !canDeleteAdmin) {
        alert(
          'Bạn cần quyền "delete_warehouse_admin" để từ chối lệnh đã hoàn thành'
        );
        return;
      }

      if (order.status === "WAIT_TO_APPROVE" && !canUpdateRelease) {
        alert(
          'Bạn cần quyền "update_warehouse_release" để từ chối lệnh chờ duyệt'
        );
        return;
      }

      alert(
        "Chỉ được từ chối lệnh ở trạng thái Chờ duyệt hoặc Hoàn thành"
      );
      return;
    }

    const warehouseReleaseId =
      order.warehouse_release_id ||
      order.release_id ||
      order.id;

    if (!warehouseReleaseId) {
      alert("Không tìm thấy ID lệnh xuất kho");
      return;
    }

    const releaseCode = getRowCode(order) || warehouseReleaseId;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn từ chối phiếu ${releaseCode} không?`
    );

    if (!confirmed) return;
    try {
      setRejecting(true);

      // Đợi React hiển thị vòng loading
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // Loading đủ 1,5 giây trước khi gửi API về backend
      const randomLoadingTime =
        Math.floor(Math.random() * (1500 - 700 + 1)) + 700;

        await new Promise((resolve) =>
        setTimeout(resolve, randomLoadingTime)
      );

      // Sau 1,5 giây mới gọi API từ chối
      await updateWarehouseReleaseStatus(
        warehouseReleaseId,
        "cancel"
      );

      // API thành công rồi mới tải lại danh sách
      setSelectedIds([]);
      setSelectedId(null);
      setSelectedOrder(null);
      setDetailRows([]);

      await fetchReleaseOrders({
        page: 1,
      });

      alert(`Từ chối phiếu ${releaseCode} thành công.`);
    } catch (error) {
      console.error(
        "REJECT WAREHOUSE RELEASE ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          `Không thể từ chối phiếu ${releaseCode}`
      );
    } finally {
      setRejecting(false);
    }
  };

  const deleteOrdersByIds = async (ids) => {
    if (!ids || ids.length === 0) return;

    const confirmMessage =
      ids.length === 1
        ? "Bạn có chắc muốn xóa lệnh xuất kho đã chọn không?"
        : `Bạn có chắc muốn xóa ${ids.length} lệnh xuất kho đã chọn không?`;

    if (!window.confirm(confirmMessage)) return;

    const results = await Promise.allSettled(
      ids.map((id) => deleteReleaseOrder(id))
    );

    const failed = results.filter((result) => result.status === "rejected");

    setSelectedIds([]);
    setSelectedId(null);
    setSelectedOrder(null);
    setDetailRows([]);

    await fetchReleaseOrders({
      page: 1,
    });

    if (failed.length === 0) {
      alert(
        ids.length === 1
          ? "Xóa lệnh xuất kho thành công"
          : `Xóa ${ids.length} lệnh xuất kho thành công`
      );
    } else {
      alert(
        `Xóa ${ids.length - failed.length}/${ids.length} thành công. ` +
          `${failed.length} lệnh thất bại.`
      );
    }
  };

  const handleDeleteRelease = () => {
    if (!canDelete) {
      alert("Bạn không có quyền xóa lệnh xuất kho");
      return;
    }

    if (selectedIds.length > 0) {
      const selectedRows = releaseOrders.filter((row) =>
        selectedIds.includes(row.id)
      );

      const invalidRows = selectedRows.filter(
        (row) => !canDeleteReleaseByStatus(row.status)
      );

      if (invalidRows.length > 0) {
        alert("Chỉ được xóa lệnh xuất kho ở trạng thái Nháp hoặc Chờ duyệt.");
        return;
      }

      deleteOrdersByIds(selectedIds);
      return;
    }

    if (!selectedOrder) {
      alert("Vui lòng chọn lệnh cần xóa");
      return;
    }

    if (!canDeleteReleaseByStatus(selectedOrder.status)) {
      alert("Phiếu đã hoàn thành, không được xóa.");
      return;
    }

    deleteOrdersByIds([selectedOrder.id]);
  };

  useEffect(() => {
  if (!isResizing) return undefined;

  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;

  document.body.style.cursor = "row-resize";
  document.body.style.userSelect = "none";

  const handlePointerMove = (event) => {
    const container = splitContainerRef.current;
    const resizeStart = resizeStartRef.current;

    if (!container || !resizeStart) return;

    const containerHeight = container.getBoundingClientRect().height;

    const minTopHeight = 180;
    const minBottomHeight = 220;
    const splitterHeight = 12;

    const maxTopHeight = Math.max(
      minTopHeight,
      containerHeight - minBottomHeight - splitterHeight
    );

    const nextHeight =
      resizeStart.height + (event.clientY - resizeStart.y);

    const clampedHeight = Math.min(
      maxTopHeight,
      Math.max(minTopHeight, nextHeight)
    );

    setTopPaneHeight(clampedHeight);
  };

  const stopResizing = () => {
    resizeStartRef.current = null;
    setIsResizing(false);
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", stopResizing);
  window.addEventListener("pointercancel", stopResizing);

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopResizing);
    window.removeEventListener("pointercancel", stopResizing);

    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
  };
}, [isResizing]);

const handleSplitterPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const listPane = listPaneRef.current;
    if (!listPane) return;

    event.preventDefault();

    resizeStartRef.current = {
      y: event.clientY,
      height: listPane.getBoundingClientRect().height,
    };

    setIsResizing(true);
  };

  const resetPaneSize = () => {
    setTopPaneHeight(null);
};

  const actionOrder = getActionOrder();

  return (
    <div className="release-order-page">
      <div className="release-order-toolbar">
        <div className="release-order-filters">
          <input
            className="release-order-search"
            placeholder="🔍  Tìm kiếm số lệnh xuất / đơn vị lĩnh"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang xuất kho</option>
            <option value="WAITING_RELEASE">Chờ xuất kho</option>
            <option value="RELEASED">Đã xuất kho</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <select
            name="time_type"
            value={filters.time_type}
            onChange={handleTimeTypeChange}
          >
            <option value="last_3_months">3 tháng gần nhất</option>
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
              const warehouseId = warehouse.id || warehouse.warehouse_id;
              const warehouseName = getWarehouseDisplayName(warehouse);

              return (
                <option key={warehouseId} value={warehouseId}>
                  {warehouseName}
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
            <button
              className="release-edit-btn"
              disabled={selectedIds.length > 1 || !actionOrder}
              onClick={handleEditRelease}
              title={
                selectedIds.length > 1
                  ? "Chỉ chỉnh sửa được 1 lệnh tại một thời điểm"
                  : ""
              }
            >
              <RiEdit2Line />
              <span>Chỉnh sửa</span>
            </button>
          )}
        {(canUpdateRelease || canDeleteAdmin) && (
            <button
              type="button"
              className="release-reject-btn"
              disabled={
                rejecting ||
                selectedIds.length > 1 ||
                !actionOrder ||
                !canRejectReleaseByStatus(actionOrder.status)
              }
              onClick={handleRejectRelease}
              title={
                actionOrder &&
                !canRejectReleaseByStatus(actionOrder.status)
                  ? "Chỉ được từ chối lệnh đang ở trạng thái Chờ duyệt"
                  : ""
              }
            >
              {rejecting ? (
                <RiLoader4Line className="release-action-loading-icon" />
              ) : (
                <RiCloseCircleLine />
              )}

              <span>
                {rejecting ? "Đang từ chối..." : "Từ chối"}
              </span>
            </button>
          )}

          {canDelete && (
            <button
              className="release-delete-btn"
              disabled={
                selectedIds.length > 0
                  ? releaseOrders
                      .filter((row) => selectedIds.includes(row.id))
                      .some((row) => !canDeleteReleaseByStatus(row.status))
                  : !selectedOrder || !canDeleteReleaseByStatus(selectedOrder.status)
              }
              onClick={handleDeleteRelease}
            >
              <RiDeleteBin6Line />
              <span>
                {selectedIds.length > 0
                  ? `Xóa (${selectedIds.length})`
                  : "Xóa"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={splitContainerRef}
        className={`release-order-main${isResizing ? " is-resizing" : ""}`}
      >
      <div
        ref={listPaneRef}
        className="warehouse-release-list-pane"
        style={
          topPaneHeight === null
            ? undefined
            : { flexBasis: `${topPaneHeight}px` }
        }
      >
        <div className="release-order-table-wrapper">
          <table className="release-order-table">
            <thead>
              <tr>
                <th className="release-order-checkbox-col">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={handleToggleAll}
                  />
                </th>
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
                  <td colSpan={11}>Đang tải danh sách lệnh xuất kho...</td>
                </tr>
              )}

              {!loading && releaseOrders.length === 0 && (
                <tr>
                  <td colSpan={11}>Không có dữ liệu lệnh xuất kho</td>
                </tr>
              )}

              {!loading &&
                releaseOrders.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? "selected" : ""}
                    onClick={() => handleSelectRow(row)}
                  >
                    <td className="release-order-checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => handleToggleOne(e, row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>

                    <td
                      className="release-order-link-text"
                      onClick={(e) => {
                        e.stopPropagation();

                        navigate(
                          `/dashboard/activity/export/release/edit/${getRowCode(row)}?mode=print`
                        );
                      }}
                    >
                      {getRowCode(row) || "-"}
                    </td>

                    <td>{getReleaseStatusText(row.status)}</td>
                    <td>{row.release_date || "-"}</td>
                    <td>
                      {row.warehouse_name ||
                        row.warehouse?.name ||
                        row.warehouse ||
                        "-"}
                    </td>
                    <td>{row.receiver_unit?.name || row.receiver_unit || "-"}</td>
                    <td>{row.release_target?.name || row.release_target || "-"}</td>
                    <td>{row.created_by_admin_name || row.created_by || "-"}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>
                      {row.last_updated_by_admin_name || row.updated_by || "-"}
                    </td>
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

            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              ‹
            </button>

            <button
              type="button"
              disabled={page * pageSize >= total}
              onClick={() => setPage((prev) => prev + 1)}
            >
              ›
            </button>
          </div>
        </div>
        </div>

        <div
          className="release-detail-splitter warehouse-release-vertical-splitter"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Kéo để thay đổi chiều cao danh sách và chi tiết xuất kho"
          title="Giữ chuột kéo lên hoặc xuống. Nhấp đúp để đặt lại."
          onPointerDown={handleSplitterPointerDown}
          onDoubleClick={resetPaneSize}
        >
          <span className="warehouse-release-splitter-handle" />
        </div>

        <div className="release-order-detail">
          <h3>Chi tiết xuất kho</h3>

          <div className="release-detail-card">
          <div className="release-detail-search">
            <span>🔍</span>

            <input
              placeholder="Tìm mã hàng, tên hàng, đơn vị tính"
              value={detailSearch}
              onChange={(e) => setDetailSearch(e.target.value)}
            />
          </div>
            <div className="release-detail-table-wrapper">
              <table className="release-detail-table">
                <colgroup>
                  <col className="release-col-stt" />
                  <col className="release-col-code" />
                  <col className="release-col-name" />
                  <col className="release-col-unit" />
                  <col className="release-col-ratio" />
                  <col className="release-col-requested" />
                  <col className="release-col-actual" />
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

                  {!detailLoading && filteredDetailRows.length === 0 && (
                    <tr>
                      <td colSpan={7}>Không có chi tiết hàng hóa</td>
                    </tr>
                  )}

                  {!detailLoading &&
                    filteredDetailRows.map((item, index) => (
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
                          {item.actual_quantity || "-"}
                        </td>
                      </tr>
                    ))}

                  {!detailLoading && filteredDetailRows.length > 0 && (
                    <tr className="release-total-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>

                      <td className="release-number-col">
                        {formatViNumber(
                          filteredDetailRows.reduce(
                            (sum, item) =>
                              sum + parseNumber(item.requested_quantity),
                            0
                          ),
                          2
                        )}
                      </td>

                      <td className="release-number-col">
                        {formatViNumber(
                          filteredDetailRows.reduce(
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
                Tổng số: <strong>{filteredDetailRows.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarehouseReleasePage;