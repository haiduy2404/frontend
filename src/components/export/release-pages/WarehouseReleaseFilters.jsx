import { RiFilter3Line, RiSearchLine } from "react-icons/ri";

function WarehouseReleaseFilters({
  search,
  filters,
  warehouses,
  getWarehouseDisplayName,
  onSearchChange,
  onFilterChange,
  onTimeTypeChange,
}) {
  return (
    <div className="warehouse-release-filters">
      <div className="warehouse-release-search-box">
        <RiSearchLine />

        <input
          className="warehouse-release-search"
          placeholder="Tìm số lệnh / đơn vị lĩnh"
          value={search}
          onChange={onSearchChange}
        />
      </div>

      <div className="warehouse-release-filter-row">
        <select
          name="status"
          value={filters.status}
          onChange={onFilterChange}
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
          onChange={onTimeTypeChange}
        >
          <option value="last_3_months">3 tháng gần nhất</option>
          <option value="quarter_1">Quý 1</option>
          <option value="quarter_2">Quý 2</option>
          <option value="quarter_3">Quý 3</option>
          <option value="quarter_4">Quý 4</option>
          <option value="custom">Tùy chọn</option>
        </select>

        <button
          type="button"
          className="warehouse-release-filter-icon"
          tabIndex={-1}
        >
          <RiFilter3Line />
        </button>
      </div>

      <select
        className="warehouse-release-warehouse-filter"
        name="warehouse_id"
        value={filters.warehouse_id}
        onChange={onFilterChange}
      >
        <option value="">Tất cả kho</option>

        {warehouses.map((warehouse) => {
          const warehouseId =
            warehouse.id || warehouse.warehouse_id;

          return (
            <option key={warehouseId} value={warehouseId}>
              {getWarehouseDisplayName(warehouse)}
            </option>
          );
        })}
      </select>

      {filters.time_type === "custom" && (
        <div className="warehouse-release-custom-date-row">
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={onFilterChange}
          />

          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={onFilterChange}
          />
        </div>
      )}
    </div>
  );
}

export default WarehouseReleaseFilters;
