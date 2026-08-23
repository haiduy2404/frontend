import {
  RiCalendarLine,
  RiMapPinLine,
} from "react-icons/ri";
import { formatISOToViDate } from "../../../utils/dateUtils";

function WarehouseReleaseListTable({
  releaseOrders,
  loading,
  selectedId,
  selectedIds,
  isAllChecked,
  getReleaseStatusText,
  onToggleAll,
  onToggleOne,
  onSelectRow,
}) {
  if (loading) {
    return (
      <div className="warehouse-release-list-empty">
        Đang tải danh sách lệnh xuất kho...
      </div>
    );
  }

  if (!releaseOrders.length) {
    return (
      <div className="warehouse-release-list-empty">
        Không có dữ liệu lệnh xuất kho
      </div>
    );
  }

  return (
    <>
      <div className="warehouse-release-list-header">
        <label>
          <input
            type="checkbox"
            checked={isAllChecked}
            onChange={onToggleAll}
          />
          <span>{releaseOrders.length} lệnh trên trang</span>
        </label>

        <span>Mới nhất</span>
      </div>

      <div className="warehouse-release-card-list">
        {releaseOrders.map((row) => {
          const statusClass = String(row.status || "")
            .toLowerCase()
            .replaceAll("_", "-");

          const code = row.code || row.release_code || "-";

          const warehouseName =
            row.warehouse_name ||
            row.warehouse?.name ||
            row.warehouse ||
            "-";

          const receiverUnit =
            row.receiver_unit?.name ||
            row.receiver_unit ||
            "-";

          const releaseTarget =
            row.release_target?.name ||
            row.release_target ||
            "-";

          return (
            <div
              key={row.id}
              className={[
                "warehouse-release-list-card",
                selectedId === row.id ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectRow(row)}
            >
              <div className="warehouse-release-card-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={(event) =>
                    onToggleOne(event, row.id)
                  }
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                />

                <strong>{code}</strong>

                <span
                  className={`warehouse-release-card-status ${statusClass}`}
                >
                  {getReleaseStatusText(row.status)}
                </span>
              </div>

              <div className="warehouse-release-card-target">
                {releaseTarget}
              </div>

              <div className="warehouse-release-card-receiver">
                {receiverUnit}
              </div>

              <div className="warehouse-release-card-meta">
                <span>
                  <RiMapPinLine />
                  {warehouseName}
                </span>

                <span>
                  <RiCalendarLine />
                  {formatISOToViDate(row.release_date) || "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default WarehouseReleaseListTable;
