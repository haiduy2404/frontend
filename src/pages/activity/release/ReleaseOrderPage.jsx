import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/ReleaseOrderPage.css";

import {
  getReleaseOrdersPageable,
  getReleaseOrderByCode,
  deleteReleaseOrder,
  submitReleaseOrder,
  completeReleaseOrder,
} from "../../../services/releaseOrderService";

import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
  RiFileCopyLine,
} from "react-icons/ri";

import {
  getDefaultWarehouseReleaseFilters,
  buildWarehouseReleaseFilterParams,
} from "./utils/warehouseReleaseFilterUtils";

function ReleaseOrderPage() {
  const { canDo } = useAuth();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [releaseOrders, setReleaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);

  const [detailRows, setDetailRows] = useState([]);
  const [selectedReleaseDetail, setSelectedReleaseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSearch, setDetailSearch] = useState("");
  
  const [topPaneHeight, setTopPaneHeight] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  const splitContainerRef = useRef(null);
  const listPaneRef = useRef(null);
  const resizeStartRef = useRef(null);

  const unwrapData = (response) => response?.data || response;
  const [filters, setFilters] = useState(getDefaultWarehouseReleaseFilters());

  const selectedRow = releaseOrders.find((item) => item.id === selectedId);

  const filteredDetailRows = useMemo(() => {
    const keyword = detailSearch.trim().toLowerCase();

    if (!keyword) return detailRows;

    return detailRows.filter((item) => {
      const searchableText = [
        item.goods_code,
        item.goods_name,
        item.goods_unit_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [detailRows, detailSearch]);

    const getReleaseStatusText = (status) => {
    switch (status) {
        case "PENDING":
        return "Nháp";
        case "WAIT_TO_APPROVE":
        return "Chờ duyệt";
        case "COMPLETED":
        return "Hoàn thành";
        case "CANCELLED":
        return "Đã hủy";
        default:
        return "-";
    }
    };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const text = String(value).trim();

    if (!text) return 0;

    let normalized = text;

    if (text.includes(",") && text.includes(".")) {
      normalized = text.replace(/\./g, "").replace(",", ".");
    } else if (text.includes(",")) {
      normalized = text.replace(",", ".");
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

  const unwrapApiData = (response) => {
    return response?.data;
   };

  const fetchReleaseOrderDetail = async (code) => {

    if (!code) {
      setDetailRows([]);
      setSelectedReleaseDetail(null);
      return;
    }

    try {
      setDetailLoading(true);

      const response = await getReleaseOrderByCode(code);
      const data = response?.data || response;

      setSelectedReleaseDetail(data);
      setDetailRows(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error("LOAD RELEASE ORDER DETAIL ERROR:", error.response?.data || error);
      setSelectedReleaseDetail(null);
      setDetailRows([]);
      alert("Không tải được chi tiết hàng hóa xuất kho");
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
          search,
          page,
          page_size: pageSize,
          ...filterParams,
          ...customParams,
        });

      const data = unwrapData(response);
      const results = Array.isArray(data?.results) ? data.results : [];

      setReleaseOrders(results);
      setSelectedIds([]);
      setTotal(data?.total || data?.count || results.length);

      if (results.length > 0) {
        const firstRow = results[0];

        if (!selectedId) {
          setSelectedId(firstRow.id);
          fetchReleaseOrderDetail(firstRow.code || firstRow.release_code);
        }
      } else {
        setSelectedId(null);
        setDetailRows([]);
        setSelectedReleaseDetail(null);
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
    const handleFilterChange = (e) => {
    const { name, value } = e.target;

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
  }, [page, pageSize, debouncedSearch]);

    const handleCompleteRelease = async (row) => {
    const confirmed = window.confirm(
        `Bạn có chắc muốn trình duyệt lệnh ${
        row.code || row.release_code || ""
        } không?`
    );
    if (!confirmed) return;
    try {
        await submitReleaseOrder(row.id);
        await fetchReleaseOrders();
        alert("Trình duyệt lệnh xuất kho thành công");
    } catch (error) {
        console.error("SUBMIT RELEASE ORDER ERROR:", error.response?.data || error);
        alert(
            error.response?.data?.message ||
            error.response?.data?.detail ||
            "Trình duyệt lệnh xuất kho thất bại"
        );
    }
    };

    const handleCompleteSelectedReleases = async () => {
    const submittable = releaseOrders.filter(
        (r) => selectedIds.includes(r.id) && r.status === "PENDING"
    );
    const skipped = selectedIds.length - submittable.length;

    if (submittable.length === 0) {
        alert("Không có lệnh nào ở trạng thái Nháp để trình duyệt.");
        return;
    }

    const msg =
        skipped > 0
        ? `Trình duyệt ${submittable.length} lệnh (bỏ qua ${skipped} lệnh không ở trạng thái Nháp)?`
        : `Bạn có chắc muốn trình duyệt ${submittable.length} lệnh đã chọn không?`;
    if (!window.confirm(msg)) return;

    const results = await Promise.allSettled(
        submittable.map((r) => submitReleaseOrder(r.id))
    );
    const failed = results.filter((r) => r.status === "rejected");

    setSelectedIds([]);
    await fetchReleaseOrders();

    if (failed.length === 0) {
        alert(`Trình duyệt ${submittable.length} lệnh xuất kho thành công`);
    } else {
        alert(
        `Trình duyệt ${submittable.length - failed.length}/${submittable.length} thành công. ` +
        `${failed.length} lệnh thất bại.`
        );
    }
    };

    const handleCompleteSelectedAsWarehouseRelease = async () => {
    const completable = releaseOrders.filter(
        (r) => selectedIds.includes(r.id) && r.status === "WAIT_TO_APPROVE"
    );
    const skipped = selectedIds.length - completable.length;

    if (completable.length === 0) {
        alert("Không có lệnh nào ở trạng thái Chờ duyệt để hoàn thành xuất kho.");
        return;
    }

    const msg =
        skipped > 0
        ? `Hoàn thành xuất kho ${completable.length} lệnh (bỏ qua ${skipped} lệnh không ở trạng thái Chờ duyệt)?`
        : `Bạn có chắc muốn hoàn thành xuất kho ${completable.length} lệnh đã chọn không?`;
    if (!window.confirm(msg)) return;

    const results = await Promise.allSettled(
        completable.map((r) => completeReleaseOrder(r.id))
    );
    const failed = results.filter((r) => r.status === "rejected");

    setSelectedIds([]);
    await fetchReleaseOrders();

    if (failed.length === 0) {
        alert(`Hoàn thành xuất kho ${completable.length} lệnh thành công`);
    } else {
        alert(
        `Hoàn thành ${completable.length - failed.length}/${completable.length} thành công. ` +
        `${failed.length} lệnh thất bại.`
        );
    }
    };

  const handleCloneReleaseOrder = (row) => {
      if (!row) {
        alert("Vui lòng chọn phiếu cần nhân bản");
        return;
      }

      const code = row.code || row.release_code;

      if (!code) {
        alert("Không tìm thấy số phiếu để nhân bản");
        return;
      }

      navigate(
        `/dashboard/activity/export/order-detail/new?clone_from=${encodeURIComponent(code)}`
      );
    };

  const handleDeleteRelease = async (row) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phiếu ${row.code || row.release_code || ""} không?`
    );

    if (!confirmed) return;

    try {
      await deleteReleaseOrder(row.id);

      setSelectedId(null);
      setDetailRows([]);
      setSelectedReleaseDetail(null);

      await fetchReleaseOrders();
      alert("Xóa phiếu xuất kho thành công");
    } catch (error) {
      console.error("DELETE RELEASE ORDER ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa phiếu xuất kho thất bại"
      );
    }
  };

  const isAllChecked =
    releaseOrders.length > 0 &&
    releaseOrders.every((row) => selectedIds.includes(row.id));

  const handleToggleAll = (e) => {
    const checked = e.target.checked;

    if (checked) {
      setSelectedIds(releaseOrders.map((row) => row.id));
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

  const handleDeleteSelectedReleases = async () => {
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một phiếu cần xóa");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} phiếu xuất kho đã chọn không?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteReleaseOrder(id)));

      setSelectedIds([]);
      setSelectedId(null);
      setDetailRows([]);
      setSelectedReleaseDetail(null);

      await fetchReleaseOrders();

      alert("Xóa các phiếu xuất kho đã chọn thành công");
    } catch (error) {
      console.error("DELETE SELECTED RELEASE ORDERS ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa các phiếu xuất kho đã chọn thất bại"
      );
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN");
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

  return (
    <div className="release-order-page">
      <div className="release-order-toolbar">
        <div className="release-order-filters">
          <input
            className="release-order-search"
            placeholder="🔍  Tìm kiếm số phiếu xuất / đơn vị lĩnh"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
            }}
          />
          <select
            className="release-filter-select"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Nháp</option>
            <option value="WAIT_TO_APPROVE">Chờ duyệt</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <select
            className="release-filter-select"
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
                className="release-filter-date"
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
              />

              <input
                className="release-filter-date"
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </>
          )}
        </div>

        <div className="release-order-actions">
          {canDo("update_warehouse_release") &&
            canDo("update_actual_released_quantity") && (
            <button
              className="edit-btn"
              disabled={selectedIds.length > 1 || !selectedRow || selectedRow.status === "COMPLETED" || selectedRow.status === "CANCELLED"}
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
                navigate(
                  `/dashboard/activity/export/order-detail/${
                    selectedRow.code || selectedRow.release_code || selectedRow.id
                  }`
                );
              }}
            >
              <RiEdit2Line />
              <span>Chỉnh sửa</span>
            </button>
          )}

          {canDo("complete_warehouse_release") && (
            <>
              <button
                className="complete-toolbar-btn"
                disabled={selectedIds.length > 1 ? false : !selectedRow}
                onClick={() => {
                  if (selectedIds.length > 1) {
                    handleCompleteSelectedReleases();
                    return;
                  }
                  if (!selectedRow) {
                    alert("Vui lòng chọn phiếu cần trình duyệt");
                    return;
                  }
                  handleCompleteRelease(selectedRow);
                }}
              >
                <RiCheckboxCircleLine />
                <span>
                  {selectedIds.length > 1
                    ? `Trình duyệt (${selectedIds.length})`
                    : "Trình duyệt"}
                </span>
              </button>
              <button
                className="complete-toolbar-btn"
                style={{ color: "#0d9488" }}
                disabled={selectedIds.length > 1 ? false : !selectedRow}
                onClick={() => {
                  if (selectedIds.length > 1) {
                    handleCompleteSelectedAsWarehouseRelease();
                    return;
                  }
                  if (!selectedRow) {
                    alert("Vui lòng chọn phiếu cần hoàn thành xuất kho");
                    return;
                  }
                  const confirmed = window.confirm(
                    `Hoàn thành xuất kho lệnh ${selectedRow.code || selectedRow.release_code || ""}?`
                  );
                  if (!confirmed) return;
                  completeReleaseOrder(selectedRow.id)
                    .then(() => {
                      fetchReleaseOrders();
                      alert("Hoàn thành xuất kho thành công");
                    })
                    .catch((error) => {
                      alert(
                        error.response?.data?.message ||
                        error.response?.data?.detail ||
                        "Hoàn thành xuất kho thất bại"
                      );
                    });
                }}
              >
                <RiCheckboxCircleLine />
                <span>
                  {selectedIds.length > 1
                    ? `Hoàn thành XK (${selectedIds.length})`
                    : "Hoàn thành XK"}
                </span>
              </button>
            </>
          )}

          {canDo("create_warehouse_release") && (
            <button
              className="add-btn"
              onClick={() =>
                navigate("/dashboard/activity/export/order-detail/new")
              }
            >
              <RiAddLine />
              <span>Thêm</span>
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
          className="release-order-list-pane"
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
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={handleToggleAll}
                  />
                </th>
                <th>Số phiếu XK</th>
                <th>Tình trạng thực hiện</th>
                <th>Đơn vị lĩnh vật tư</th>
                <th>Đối tượng xuất kho</th>
                <th>Người tạo phiếu xuất</th>
                <th>Ngày tạo</th>
                <th>Người sửa phiếu xuất</th>
                <th>Ngày sửa</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9}>Đang tải danh sách phiếu xuất kho...</td>
                </tr>
              )}

              {!loading && releaseOrders.length === 0 && (
                <tr>
                  <td colSpan={9}>Không có dữ liệu phiếu xuất kho</td>
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
                        `/dashboard/activity/export/order-detail/${
                            row.code || row.release_code || row.id
                        }?mode=print`
                        );
                      }}
                    >
                      {row.code || row.release_code || "-"}
                    </td>

                    <td>{getReleaseStatusText(row.status)}</td>
                    <td>{row.receiver_unit?.name || "-"}</td>
                    <td>{row.release_target?.name || "-"}</td>
                    <td>{row.created_by_admin_name || row.created_by_name || row.created_by || "-"}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>
                    {row.last_updated_by_admin_name ||
                        row.updated_by_admin_name ||
                        row.last_updated_by_name ||
                        row.updated_by ||
                        "-"}
                    </td>
                    <td className="release-order-updated-cell">
                      <span className="release-order-updated-text">
                        {formatDateTime(row.updated_at)}
                      </span>

                      <div className="release-row-actions">
                        {canDo("create_warehouse_release") && (
                          <button
                            type="button"
                            className="release-row-action-btn clone"
                            title="Nhân bản"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloneReleaseOrder(row);
                            }}
                          >
                            <RiFileCopyLine />
                          </button>
                        )}

                        {canDo("delete_warehouse_release") && (
                          <button
                            type="button"
                            className="release-row-action-btn delete"
                            title="Xóa"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRelease(row);
                            }}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="release-order-pagination">
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
              {releaseOrders.length > 0 ? 1 : 0} -{" "}
              {releaseOrders.length}
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
        </div>

        <div
          className="detail-splitter release-vertical-splitter"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Kéo để thay đổi chiều cao danh sách và chi tiết"
          title="Giữ chuột kéo lên hoặc xuống. Nhấp đúp để đặt lại."
          onPointerDown={handleSplitterPointerDown}
          onDoubleClick={resetPaneSize}
        >
          <span className="release-vertical-splitter-handle" />
        </div>

        <div className="release-order-detail">
          <h3>Chi tiết hàng hóa xuất kho</h3>

          <div className="import-list-detail-card">
            <div className="detail-search">
              <span>🔍</span>
              <input
                placeholder="Tìm mã hàng, tên hàng, đơn vị tính"
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
              />
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
                </colgroup>

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã hàng</th>
                    <th>Tên hàng</th>
                    <th>ĐVT</th>
                    <th>Tỷ lệ chuyển đổi</th>
                    <th>SL yêu cầu</th>
                  </tr>
                </thead>

                <tbody>
                  {detailLoading && (
                    <tr>
                      <td colSpan={6}>Đang tải chi tiết...</td>
                    </tr>
                  )}

                  {!detailLoading && filteredDetailRows.length === 0 && (
                    <tr>
                      <td colSpan={6}>Không tìm thấy hàng hóa phù hợp</td>
                    </tr>
                  )}

                  {!detailLoading &&
                    filteredDetailRows.map((item, index) => {
                      const requestedQuantity = parseNumber(item.requested_quantity);
                      const conversionRatio =
                        item.conversion_ratio ??
                        item.goods_conversion_ratio ??
                        item.unit_conversion_ratio ??
                        item.goods_unit?.conversion_ratio ??
                        item.conversion_rate ??
                        1;

                      return (
                        <tr key={item.release_inventory_id || item.goods_id || index}>
                          <td>{index + 1}</td>
                          <td>{item.goods_code || ""}</td>
                          <td>{item.goods_name || ""}</td>
                          <td>{item.goods_unit_name || ""}</td>
                          <td className="number-col">
                            {formatViNumber(conversionRatio, 3)}
                          </td>

                          <td className="number-col">
                            {formatViNumber(requestedQuantity, 2)}
                          </td>
                        </tr>
                      );
                    })}

                  {!detailLoading && filteredDetailRows.length > 0 && (
                    <tr className="table-total-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    <td className="number-col">
                    {formatViNumber(
                        filteredDetailRows.reduce(
                        (sum, item) =>
                            sum + parseNumber(item.requested_quantity || 0),
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

            <div className="table-bottom-bar">
              <div>
                Tổng số: <strong>{filteredDetailRows.length}</strong>
              </div>

              <div className="table-pagination">
                <span>Số dòng/trang</span>
                <select defaultValue={20}>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <strong>{filteredDetailRows.length > 0 ? 1 : 0} - {filteredDetailRows.length}</strong>
                <button disabled>‹</button>
                <button disabled>›</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseOrderPage;