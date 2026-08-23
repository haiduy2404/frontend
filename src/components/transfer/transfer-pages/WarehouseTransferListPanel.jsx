import { formatISOToViDate } from "../../../utils/dateUtils";
import {
  getFromWarehouseName,
  getToWarehouseName,
  getTransferCode,
  getTransferStatusClass,
  getTransferStatusText,
} from "./utils/warehouseTransferUtils";

export default function WarehouseTransferListPanel({
  transfers,
  totalCount,
  selectedTransferId,
  onSelectTransfer,
  pageSize,
  setPageSize,
  loading,
  error,
}) {
  return (
    <section className="warehouse-transfer-list-panel">
      <div className="warehouse-transfer-list-meta">
        <label className="warehouse-transfer-total-check">
          <input type="checkbox" disabled />
          <span>Tổng {totalCount} phiếu</span>
        </label>

        <button type="button" className="warehouse-transfer-sort-btn">
          Mới nhất
        </button>
      </div>

      <div className="warehouse-transfer-list-scroll">
        {loading && transfers.length === 0 && (
          <div className="warehouse-transfer-list-state">Đang tải dữ liệu...</div>
        )}

        {!loading && error && (
          <div className="warehouse-transfer-list-state error">{error}</div>
        )}

        {!loading && !error && transfers.length === 0 && (
          <div className="warehouse-transfer-list-state">
            Không có phiếu điều chuyển
          </div>
        )}

        {transfers.map((item, index) => {
          const code = getTransferCode(item) || `Phiếu ${index + 1}`;
          const selected = selectedTransferId === item.id;
          const statusClass = getTransferStatusClass(item.status);

          return (
            <button
              type="button"
              key={item.id || code || index}
              className={`warehouse-transfer-list-item ${
                selected ? "selected" : ""
              }`}
              onClick={() => onSelectTransfer(item.id)}
            >
              <span className="warehouse-transfer-select-dot" aria-hidden="true">
                {selected ? "●" : "○"}
              </span>

              <span className="warehouse-transfer-list-item-content">
                <span className="warehouse-transfer-list-item-head">
                  <strong>{code}</strong>
                  <span
                    className={`warehouse-transfer-status-badge ${statusClass}`}
                  >
                    {getTransferStatusText(item.status)}
                  </span>
                </span>

                <span className="warehouse-transfer-route">
                  {getFromWarehouseName(item)}
                  <span>→</span>
                  {getToWarehouseName(item)}
                </span>

                <span className="warehouse-transfer-list-date">
                  ▣ {" "}
                  {formatISOToViDate(
                    item.transfer_date || item.created_at || item.date
                  ) || "-"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="warehouse-transfer-list-footer">
        <div className="warehouse-transfer-page-size">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="warehouse-transfer-pagination">
          <button type="button" disabled>
            ‹
          </button>
          <span className="active">1</span>
          <span>/</span>
          <span>{Math.max(1, Math.ceil(totalCount / pageSize))}</span>
          <button type="button" disabled>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
