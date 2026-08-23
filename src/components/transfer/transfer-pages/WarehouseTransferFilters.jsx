export default function WarehouseTransferFilters({
  keyword,
  setKeyword,
  timeRange,
  setTimeRange,
  status,
  setStatus,
}) {
  return (
    <div className="warehouse-transfer-filters">
      <div className="warehouse-transfer-search-row">
        <div className="warehouse-transfer-search-box">
          <span className="warehouse-transfer-search-icon">⌕</span>
          <input
            type="text"
            value={keyword}
            placeholder="Tìm kiếm số phiếu, kho..."
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="warehouse-transfer-filter-icon-btn"
          title="Bộ lọc"
        >
          ▽
        </button>
      </div>

      <div className="warehouse-transfer-filter-row">
        <select
          value={timeRange}
          onChange={(event) => setTimeRange(event.target.value)}
        >
          <option value="last_3_months">Thời gian: 3 tháng gần nhất</option>
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="all">Tất cả</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tình trạng: Tất cả</option>
          <option value="PENDING">Đang điều chuyển</option>
          <option value="COMPLETED">Đã hoàn thành</option>
        </select>
      </div>
    </div>
  );
}
