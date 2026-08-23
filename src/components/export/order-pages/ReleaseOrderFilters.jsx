import {
  RiSearchLine,
  RiFilter3Line,
} from "react-icons/ri";


function ReleaseOrderFilters({
  search,
  filters,
  onSearchChange,
  onFilterChange,
  onTimeTypeChange,
}) {
  return (
    <div className="release-order-filters">
      <div className="release-order-search-box">
        <RiSearchLine />

        <input
          className="release-order-search"
          placeholder="Tìm theo số lệnh, đối tượng..."
          value={search}
          onChange={onSearchChange}
        />
      </div>


      <div className="release-order-filter-row">
        <select
          name="status"
          value={filters.status}
          onChange={onFilterChange}
        >
          <option value="">
            Trạng thái: Tất cả
          </option>

          <option value="PENDING">
            Nháp
          </option>

          <option value="WAIT_TO_APPROVE">
            Chờ duyệt
          </option>

          <option value="COMPLETED">
            Hoàn thành
          </option>

          <option value="CANCELLED">
            Đã hủy
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


        <button
          type="button"
          className="release-order-filter-icon-btn"
          title="Bộ lọc"
        >
          <RiFilter3Line />
        </button>
      </div>


      {filters.time_type === "custom" && (
        <div className="release-order-custom-date-row">
          <input
            type="date"
            name="start_date"
            value={filters.start_date || ""}
            onChange={onFilterChange}
          />

          <input
            type="date"
            name="end_date"
            value={filters.end_date || ""}
            onChange={onFilterChange}
          />
        </div>
      )}
    </div>
  );
}


export default ReleaseOrderFilters;