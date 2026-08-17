import { useCallback, useEffect, useState } from "react";
import {
  RiCloseLine,
  RiRefreshLine,
} from "react-icons/ri";
import axiosInstance from "../services/authService";
import "../styles/RecentActivitiesModal.css";

const ACTIVITY_FILTERS = [
  { key: "ALL", label: "Tất cả", types: ["receipt", "release", "transfer"] },
  { key: "receipt", label: "Nhập kho", types: ["receipt"] },
  { key: "release", label: "Xuất kho", types: ["release"] },
  { key: "transfer", label: "Điều chuyển", types: ["transfer"] },
];

const STATUS_LABELS = {
  PENDING: "Nháp",
  WAIT_TO_APPROVE: "Chờ duyệt",
  WAITING_DELIVERY: "Chờ nhận hàng",
  RECEIVED: "Đã nhận hàng",
  WAITING_RELEASE: "Chờ xuất kho",
  RELEASED: "Đã xuất kho",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status || "—";

const getActivityTypeLabel = (type) => {
  if (type === "receipt") return "Nhập kho";
  if (type === "release") return "Xuất kho";
  if (type === "transfer") return "Điều chuyển";
  return type || "—";
};

const getWarehouseText = (row) => {
  if (row?.activity_type === "receipt") {
    return (
      row?.destination_warehouse_name ||
      row?.destination_warehouse_code ||
      "—"
    );
  }

  if (row?.activity_type === "release") {
    return row?.source_warehouse_name || row?.source_warehouse_code || "—";
  }

  if (row?.activity_type === "transfer") {
    const source = row?.source_warehouse_code || row?.source_warehouse_name || "—";
    const destination =
      row?.destination_warehouse_code || row?.destination_warehouse_name || "—";
    return `${source} → ${destination}`;
  }

  return "—";
};

const formatDate = (value) => {
  if (!value) return "—";

  const text = String(value);
  const [year, month, day] = text.split("T")[0].split("-");

  if (!year || !month || !day) return text;
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

function RecentActivitiesModal({ onClose }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        setLoading(true);
        setError("");

        const selectedFilter =
          ACTIVITY_FILTERS.find((item) => item.key === activeFilter) ||
          ACTIVITY_FILTERS[0];

        const response = await axiosInstance.post(
          "/inventory/dashboard/recent-activities",
          {
            warehouse_ids: [],
            period_month: null,
            activity_types: selectedFilter.types,
            page,
            page_size: pageSize,
            refresh,
          }
        );

        const payload = response?.data?.data ?? response?.data ?? {};
        const results = Array.isArray(payload?.results) ? payload.results : [];

        setRows(results);
        setTotal(Number(payload?.total || 0));
        setTotalPages(Number(payload?.total_pages || 1));
      } catch (err) {
        console.error(
          "RECENT ACTIVITIES MODAL ERROR:",
          err?.response?.data || err
        );

        setRows([]);
        setTotal(0);
        setTotalPages(1);
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            "Không tải được danh sách hoạt động kho."
        );
      } finally {
        setLoading(false);
      }
    },
    [activeFilter, page, pageSize]
  );

  useEffect(() => {
    fetchActivities({ refresh: false });
  }, [fetchActivities]);

  return (
    <div className="recent-activities-modal-overlay" role="presentation">
      <div
        className="recent-activities-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Tất cả hoạt động kho"
      >
        <div className="recent-activities-modal-header">
          <div>
            <h2>Hoạt động kho</h2>
            <p>Xem toàn bộ phiếu nhập, xuất và điều chuyển gần đây.</p>
          </div>

          <button
            type="button"
            className="recent-activities-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <RiCloseLine />
          </button>
        </div>

        <div className="recent-activities-modal-toolbar">
          <div className="recent-activities-filter-tabs">
            {ACTIVITY_FILTERS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={activeFilter === item.key ? "active" : ""}
                onClick={() => {
                  setActiveFilter(item.key);
                  setPage(1);
                }}
                disabled={loading}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="recent-activities-toolbar-right">
            <span>
              Tổng số: <strong>{total.toLocaleString("vi-VN")}</strong>
            </span>

            <button
              type="button"
              className="recent-activities-refresh-btn"
              onClick={() => fetchActivities({ refresh: true })}
              disabled={loading}
            >
              <RiRefreshLine className={loading ? "is-spinning" : ""} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="recent-activities-table-shell">
          {error ? (
            <div className="recent-activities-state recent-activities-state--error">
              {error}
            </div>
          ) : (
            <table className="recent-activities-table">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th className="col-type">Loại</th>
                  <th className="col-code">Mã phiếu</th>
                  <th className="col-status">Trạng thái</th>
                  <th className="col-date">Ngày phiếu</th>
                  <th>Kho</th>
                  <th className="col-goods">Số mặt hàng</th>
                  <th className="col-created">Tạo lúc</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="recent-activities-state-cell">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="recent-activities-state-cell">
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${row.activity_type}-${row.ticket_id}`}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td>
                        <span
                          className={`recent-activities-type-badge ${
                            row.activity_type || "unknown"
                          }`}
                        >
                          {getActivityTypeLabel(row.activity_type)}
                        </span>
                      </td>
                      <td className="recent-activities-code-cell">
                        {row.ticket_code || "—"}
                      </td>
                      <td>
                        <span
                          className={`recent-activities-status-badge status-${String(
                            row.status || "unknown"
                          ).toLowerCase()}`}
                        >
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td>{formatDate(row.ticket_date)}</td>
                      <td className="recent-activities-warehouse-cell">
                        {getWarehouseText(row)}
                      </td>
                      <td>{Number(row.goods_lines || 0).toLocaleString("vi-VN")}</td>
                      <td>{formatDateTime(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="recent-activities-modal-footer">
          <div className="recent-activities-page-size">
            <span>Số dòng/trang</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              disabled={loading}
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="recent-activities-pagination">
            <span>
              Trang <strong>{page}</strong> / {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || page <= 1}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((prev) => Math.min(Math.max(totalPages, 1), prev + 1))
              }
              disabled={loading || page >= totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecentActivitiesModal;
