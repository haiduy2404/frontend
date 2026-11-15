import { useEffect } from "react";
import { RiCloseLine } from "react-icons/ri";

import "../../styles/ReleaseRecheckModal.css";

/*
 * Kiểm tra lệnh xuất kho TRƯỚC khi lưu tạm / hoàn thành.
 *
 * Trang mở modal là đã gọi API /warehouse-releases/recheck ngay (mặc định 1
 * tháng), nên người lập phiếu luôn thấy kết quả trước khi bấm lưu. Nút Lưu tạm /
 * Hoàn thành bị khoá cho tới khi kiểm tra xong — không thể bỏ qua bước này.
 *
 * Hai phần:
 *   1. Tồn kho sau khi xuất — mã nào đang âm / sẽ âm / có thể âm (tính cả các
 *      phiếu khác đã trình chưa trừ kho).
 *   2. Lịch sử xuất cho cùng đối tượng xuất kho trong khoảng đã chọn.
 */

const WINDOW_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "1 tháng" },
  { value: 60, label: "2 tháng" },
  { value: 90, label: "3 tháng" },
];

const LEVELS = {
  ALREADY_NEGATIVE: { label: "Đang âm", className: "is-danger" },
  WILL_BE_NEGATIVE: { label: "Sẽ âm", className: "is-danger" },
  MAY_BE_NEGATIVE: { label: "Có thể âm", className: "is-warning" },
};

const TICKET_STATUS = {
  PENDING: "Nháp",
  WAIT_TO_APPROVE: "Chờ duyệt",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatQty = (value) =>
  toNumber(value).toLocaleString("vi-VN", { maximumFractionDigits: 5 });

function Qty({ value, unit, signed = false }) {
  const number = toNumber(value);
  return (
    <span className={signed && number < 0 ? "recheck-negative" : undefined}>
      {formatQty(number)}
      {unit ? <small> {unit}</small> : null}
    </span>
  );
}

function SectionHeader({ title, count, tone, children }) {
  return (
    <div className="recheck-section-header">
      <h4>
        {title}
        {count > 0 && <span className={`recheck-count ${tone}`}>{count} mã</span>}
      </h4>
      {children}
    </div>
  );
}

function StockSection({ stock }) {
  const lines = stock?.lines || [];

  if (!stock?.warehouse_id) {
    return (
      <div className="recheck-empty">
        Chưa chọn kho xuất — bỏ qua kiểm tra tồn kho.
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="recheck-ok">
        ✓ Tồn kho {stock.warehouse_code} đủ cho mọi vật tư trong phiếu, kể cả
        khi các phiếu đang chờ duyệt được hoàn thành.
      </div>
    );
  }

  const hasPending = lines.some((line) => toNumber(line.pending_quantity) > 0);

  return (
    <div className="recheck-table-wrap">
      <table className="recheck-table">
        <thead>
          <tr>
            <th>Mã VT</th>
            <th>Tên vật tư</th>
            <th className="num">Tồn hiện tại</th>
            <th className="num">Phiếu này xuất</th>
            <th className="num">Còn lại</th>
            {hasPending && <th className="num">Phiếu khác chờ duyệt</th>}
            {hasPending && <th className="num">Sau tất cả</th>}
            <th>Mức</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const level = LEVELS[line.level] || LEVELS.WILL_BE_NEGATIVE;
            const pending = toNumber(line.pending_quantity) > 0;
            return (
              <tr key={line.goods_id} title={line.message}>
                <td className="code">{line.goods_code || "—"}</td>
                <td className="name">{line.goods_name || "—"}</td>
                <td className="num">
                  <Qty value={line.on_hand} unit={line.unit_name} signed />
                </td>
                <td className="num">
                  <Qty value={line.release_quantity} unit={line.unit_name} />
                </td>
                <td className="num">
                  <Qty value={line.after_release} unit={line.unit_name} signed />
                </td>
                {hasPending && (
                  <td className="num">
                    {pending ? (
                      <>
                        <Qty value={line.pending_quantity} unit={line.unit_name} />
                        <div className="recheck-codes">
                          {(line.pending_release_codes || []).join(", ")}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                {hasPending && (
                  <td className="num">
                    <Qty value={line.after_pending} unit={line.unit_name} signed />
                  </td>
                )}
                <td>
                  <span className={`recheck-badge ${level.className}`}>
                    {level.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DuplicateSection({ duplicate, target, formatDate }) {
  const warnings = duplicate?.warnings || [];

  if (!duplicate?.release_target_id && !duplicate?.release_target) {
    return (
      <div className="recheck-empty">
        Đối tượng xuất kho mới — chưa có lịch sử để đối chiếu.
      </div>
    );
  }

  if (warnings.length === 0) {
    return (
      <div className="recheck-ok">
        ✓ Không vật tư nào đã được xuất cho <strong>{target}</strong> từ{" "}
        {formatDate(duplicate.window_from)} đến {formatDate(duplicate.window_to)}.
      </div>
    );
  }

  return (
    <div className="recheck-table-wrap">
      <table className="recheck-table">
        <thead>
          <tr>
            <th>Mã VT</th>
            <th>Tên vật tư</th>
            <th className="num">Số lần</th>
            <th>Phiếu đã xuất</th>
          </tr>
        </thead>
        <tbody>
          {warnings.map((warning) => (
            <tr key={warning.goods_id}>
              <td className="code">{warning.goods_code || "—"}</td>
              <td className="name">{warning.goods_name || "—"}</td>
              <td className="num">{warning.occurrences ?? warning.tickets?.length ?? 0}</td>
              <td>
                <ul className="recheck-tickets">
                  {(warning.tickets || []).map((ticket) => (
                    <li key={ticket.release_id || ticket.code}>
                      <strong>{ticket.code}</strong>
                      <span>{formatDate(ticket.release_date)}</span>
                      <span>
                        {formatQty(ticket.quantity)} {ticket.unit_name || ""}
                      </span>
                      <span className="muted">
                        {ticket.warehouse_code || "—"} ·{" "}
                        {ticket.receiver_unit || "—"} ·{" "}
                        {TICKET_STATUS[ticket.status] || ticket.status || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReleaseRecheckModal({
  open,
  warehouseLabel,
  target,
  releaseDate,
  windowDays,
  onWindowChange,
  result,
  loading,
  error,
  onRetry,
  onClose,
  canSave,
  canComplete,
  onSaveDraft,
  onComplete,
  actionLoading,
  formatDate,
}) {
  const busy = loading || actionLoading;

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const stockCount = result?.stock?.lines?.length || 0;
  const duplicateCount = result?.duplicate?.warnings?.length || 0;
  // Chỉ cho lưu khi đã có kết quả kiểm tra — không bỏ qua được bước này.
  const checked = Boolean(result) && !loading && !error;

  let summary = null;
  if (loading) {
    summary = <div className="recheck-summary is-loading">Đang kiểm tra tồn kho và lịch sử xuất…</div>;
  } else if (error) {
    summary = (
      <div className="recheck-summary is-error" role="alert">
        <span>{error}</span>
        <button type="button" onClick={onRetry}>Thử lại</button>
      </div>
    );
  } else if (result && !result.has_warning) {
    summary = <div className="recheck-summary is-ok">✓ Không có cảnh báo nào. Có thể lưu phiếu.</div>;
  } else if (result) {
    summary = (
      <div className="recheck-summary is-warning">
        <strong>Có cảnh báo — xem kỹ trước khi lưu:</strong>
        {stockCount > 0 && <span className="recheck-count is-danger">{stockCount} mã âm tồn</span>}
        {duplicateCount > 0 && <span className="recheck-count is-warning">{duplicateCount} mã đã xuất gần đây</span>}
      </div>
    );
  }

  return (
    <div
      className="recheck-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="recheck-modal" role="dialog" aria-modal="true" aria-labelledby="recheck-title">
        <header className="recheck-header">
          <div>
            <h3 id="recheck-title">Kiểm tra lệnh xuất kho</h3>
            <p>
              <span>Kho: <strong>{warehouseLabel || "—"}</strong></span>
              <span>Đối tượng: <strong>{target || "—"}</strong></span>
              <span>Ngày xuất: <strong>{releaseDate || "—"}</strong></span>
            </p>
          </div>
          <button type="button" className="recheck-close" onClick={onClose} disabled={busy} aria-label="Đóng">
            <RiCloseLine />
          </button>
        </header>

        {summary}

        <div className="recheck-body">
          <section>
            <SectionHeader title="Tồn kho sau khi xuất" count={stockCount} tone="is-danger" />
            {loading && !result ? <div className="recheck-skeleton" /> : result && <StockSection stock={result.stock} />}
          </section>

          <section>
            <SectionHeader title="Đã xuất cho đối tượng này trong" count={duplicateCount} tone="is-warning">
              <select
                className="recheck-window"
                value={windowDays}
                onChange={(event) => onWindowChange(Number(event.target.value))}
                disabled={loading}
                aria-label="Khoảng thời gian kiểm tra lịch sử xuất"
              >
                {WINDOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </SectionHeader>
            {loading && !result ? (
              <div className="recheck-skeleton" />
            ) : (
              result && <DuplicateSection duplicate={result.duplicate} target={target} formatDate={formatDate} />
            )}
          </section>
        </div>

        <footer className="recheck-footer">
          <span className="recheck-footer-hint">
            {!checked
              ? "Lưu tạm / Hoàn thành mở khi kiểm tra xong."
              : result.has_warning
                ? "Cảnh báo không chặn việc lưu — hãy chắc chắn số lượng đã đúng."
                : "Đã kiểm tra xong."}
          </span>
          <div>
            <button type="button" className="recheck-btn is-ghost" onClick={onClose} disabled={busy}>
              Hủy
            </button>
            {canSave && (
              <button type="button" className="recheck-btn is-secondary" onClick={onSaveDraft} disabled={busy || !checked}>
                {actionLoading ? "Đang xử lý…" : "Lưu tạm"}
              </button>
            )}
            {canComplete && (
              <button
                type="button"
                className={`recheck-btn ${checked && result.has_warning ? "is-warning" : "is-primary"}`}
                onClick={onComplete}
                disabled={busy || !checked}
              >
                {actionLoading ? "Đang xử lý…" : checked && result.has_warning ? "Vẫn hoàn thành" : "Hoàn thành"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ReleaseRecheckModal;
