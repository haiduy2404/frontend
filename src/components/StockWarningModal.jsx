import { useCallback, useEffect, useState } from "react";
import {
  RiAlertLine,
  RiCloseLine,
  RiRefreshLine,
} from "react-icons/ri";
import axiosInstance from "../services/authService";
import "../styles/StockWarningModal.css";

const formatDecimalString = (value) => {
  if (value === null || value === undefined || value === "") return "—";

  const text = String(value).trim();
  if (!text) return "—";
  if (!text.includes(".")) return text;

  const [integerPart, decimalPart = ""] = text.split(".");
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
};

const formatQuantityWithUnit = (value, unitName) => {
  const quantity = formatDecimalString(value);
  return quantity === "—" || !unitName ? quantity : `${quantity} ${unitName}`;
};

function StockWarningModal({ onClose, scopeType = "ORGANIZATION" }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWarnings = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.post(
          "/inventory/dashboard/stock-warnings",
          {
            scope_type: scopeType,
            statuses: ["BELOW_MIN"],
            warehouse_ids: [],
            goods_group_ids: [],
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
        console.error("STOCK WARNING MODAL ERROR:", err?.response?.data || err);

        setRows([]);
        setTotal(0);
        setTotalPages(1);
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            "Không tải được danh sách cảnh báo tồn kho."
        );
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, scopeType]
  );

  useEffect(() => {
    fetchWarnings({ refresh: false });
  }, [fetchWarnings]);

  const showWarehouse = scopeType === "WAREHOUSE";

  return (
    <div className="stock-warning-modal-overlay" role="presentation">
      <div
        className="stock-warning-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Tất cả cảnh báo tồn kho thấp"
      >
        <div className="stock-warning-modal-header">
          <div>
            <h2>Cảnh báo tồn kho thấp</h2>
            <p>Danh sách toàn bộ vật tư đang dưới định mức tối thiểu.</p>
          </div>

          <button
            type="button"
            className="stock-warning-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <RiCloseLine />
          </button>
        </div>

        <div className="stock-warning-summary-row">
          <div className="stock-warning-summary-card active">
            <span>Dưới định mức</span>
            <strong>{total.toLocaleString("vi-VN")}</strong>
          </div>
        </div>

        <div className="stock-warning-modal-toolbar">
          <div>
            Tổng số đang hiển thị: <strong>{total.toLocaleString("vi-VN")}</strong>
          </div>

          <button
            type="button"
            className="stock-warning-refresh-btn"
            onClick={() => fetchWarnings({ refresh: true })}
            disabled={loading}
          >
            <RiRefreshLine className={loading ? "is-spinning" : ""} />
            Làm mới
          </button>
        </div>

        <div className="stock-warning-table-shell">
          {error ? (
            <div className="stock-warning-state stock-warning-state--error">
              {error}
            </div>
          ) : (
            <table className="stock-warning-table">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th className="col-code">Mã vật tư</th>
                  <th>Tên vật tư</th>
                  <th className="col-group">Nhóm</th>
                  {showWarehouse ? <th className="col-warehouse">Kho</th> : null}
                  <th className="col-quantity">Tồn hiện tại</th>
                  <th className="col-quantity">Tối thiểu</th>
                  <th className="col-quantity">Thiếu</th>
                  <th className="col-status">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={showWarehouse ? 9 : 8}
                      className="stock-warning-state-cell"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showWarehouse ? 9 : 8}
                      className="stock-warning-state-cell"
                    >
                      Không có vật tư dưới định mức.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={`${row.goods_id}-${row.warehouse_id || "org"}-${row.status}`}
                    >
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td className="stock-warning-code-cell">
                        {row.goods_code || "—"}
                      </td>
                      <td className="stock-warning-name-cell">
                        {row.goods_name || "—"}
                      </td>
                      <td>
                        <div className="stock-warning-group-cell">
                          {row.goods_group_code ? (
                            <strong>{row.goods_group_code}</strong>
                          ) : null}
                          <span>{row.goods_group_name || "—"}</span>
                        </div>
                      </td>
                      {showWarehouse ? (
                        <td>
                          {row.warehouse_code && row.warehouse_name
                            ? `${row.warehouse_code} - ${row.warehouse_name}`
                            : row.warehouse_name || row.warehouse_code || "—"}
                        </td>
                      ) : null}
                      <td>{formatQuantityWithUnit(row.quantity, row.unit_name)}</td>
                      <td>
                        {formatQuantityWithUnit(row.min_quantity, row.unit_name)}
                      </td>
                      <td className="stock-warning-gap-cell">
                        {formatQuantityWithUnit(row.gap, row.unit_name)}
                      </td>
                      <td>
                        <span
                          className={`stock-warning-badge status-${String(
                            row.status || "warning"
                          ).toLowerCase()}`}
                        >
                          <RiAlertLine />
                          {row.status_label || "Cảnh báo"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="stock-warning-modal-footer">
          <div className="stock-warning-page-size">
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

          <div className="stock-warning-pagination">
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

export default StockWarningModal;
