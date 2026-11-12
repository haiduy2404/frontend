import "../../styles/ReportGrandTotal.css";

/*
 * Khối "tổng của toàn bộ kết quả lọc" đặt trên bảng báo cáo phân trang.
 *
 * Trang gọi API summary MỘT lần theo bộ lọc (không gọi lại khi lật trang) rồi
 * truyền số đã định dạng vào đây. Lỗi tải tổng không chặn bảng: chỉ khối này
 * báo lỗi và có nút Thử lại.
 */
function ReportGrandTotal({
  label = "Tổng thành tiền",
  amount,
  note = "Toàn bộ kết quả theo bộ lọc, không chỉ trang đang xem",
  stats = [],
  loading = false,
  error = "",
  onRetry,
}) {
  return (
    <div className="report-grand-total" aria-live="polite" aria-busy={loading}>
      <div className="report-grand-total-main">
        <span>{label}</span>
        <strong>{loading ? "Đang tính…" : amount ?? "—"}</strong>
        <small>{note}</small>
      </div>

      {error ? (
        <div className="report-grand-total-error" role="alert">
          <span>{error}</span>
          {onRetry && (
            <button type="button" onClick={onRetry}>
              Thử lại
            </button>
          )}
        </div>
      ) : (
        <dl className="report-grand-total-stats">
          {stats
            .filter((stat) => !stat.hidden)
            .map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{loading ? "…" : stat.value ?? "—"}</dd>
              </div>
            ))}
        </dl>
      )}
    </div>
  );
}

export default ReportGrandTotal;
