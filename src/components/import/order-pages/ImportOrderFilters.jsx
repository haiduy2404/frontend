import {
  RiSearchLine,
  RiFilter3Line,
} from "react-icons/ri";

function ImportOrderFilters({
  search,
  filters,

  onSearchChange,
  onFilterChange,
  onTimeTypeChange,
}) {
  return (
    <div className="import-order-sidebar-filters">
      {/* SEARCH */}
      <div className="import-order-sidebar-search-row">
        <div className="import-order-sidebar-search-box">
          <RiSearchLine />

          <input
            type="text"
            placeholder="Tìm theo số lệnh, đối tượng..."
            value={search}
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
          />
        </div>

        <button
          type="button"
          className="import-order-sidebar-filter-btn"
          title="Bộ lọc"
        >
          <RiFilter3Line />
        </button>
      </div>

      {/* FILTER ROW */}
      <div className="import-order-sidebar-filter-grid">
        <select
          name="status"
          value={filters.status}
          onChange={onFilterChange}
        >
          <option value="">
            Trạng thái: Tất cả
          </option>

          <option value="WAITING_DELIVERY">
            Chờ nhận hàng
          </option>

          <option value="RECEIVED">
            Đã nhận hàng
          </option>

          <option value="COMPLETED">
            Đã hoàn thành
          </option>
        </select>

        <select
          name="time_type"
          value={filters.time_type}
          onChange={onTimeTypeChange}
        >
          <option value="last_3_months">
            3 tháng gần nhất
          </option>

          <option value="quarter_1">
            Quý 1
          </option>

          <option value="quarter_2">
            Quý 2
          </option>

          <option value="quarter_3">
            Quý 3
          </option>

          <option value="quarter_4">
            Quý 4
          </option>

          <option value="custom">
            Tùy chọn
          </option>
        </select>
      </div>

      {/* CUSTOM DATE */}
      {filters.time_type ===
        "custom" && (
        <div className="import-order-sidebar-date-grid">
          <input
            type="date"
            name="start_date"
            value={
              filters.start_date
            }
            onChange={
              onFilterChange
            }
          />

          <input
            type="date"
            name="end_date"
            value={
              filters.end_date
            }
            onChange={
              onFilterChange
            }
          />
        </div>
      )}
    </div>
  );
}

export default ImportOrderFilters;