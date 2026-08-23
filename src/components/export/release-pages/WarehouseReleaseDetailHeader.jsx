import { RiUser3Line } from "react-icons/ri";
import { formatISOToViDate } from "../../../utils/dateUtils";

function WarehouseReleaseDetailHeader({
  selectedRow,
  getReleaseStatusText,
}) {
  if (!selectedRow) {
    return (
      <header className="warehouse-release-detail-header">
        <div>
          <h2>Xuất kho thực tế</h2>
          <span>Chọn một lệnh xuất kho để xem chi tiết</span>
        </div>
      </header>
    );
  }

  const statusClass = String(selectedRow.status || "")
    .toLowerCase();

  return (
    <header className="warehouse-release-detail-header">
      <div className="warehouse-release-detail-header-main">
        <div className="warehouse-release-detail-title-row">
          <h2>
            {selectedRow.code ||
              selectedRow.release_code ||
              "-"}
          </h2>
        </div>

        <div className="warehouse-release-detail-created">
          <RiUser3Line />
          <span>Tạo bởi:</span>
          <strong>
            {selectedRow.created_by_admin_name ||
              selectedRow.created_by_name ||
              selectedRow.created_by ||
              "-"}
          </strong>
          <span>•</span>
          <span>
            {formatISOToViDate(selectedRow.created_at) || "-"}
          </span>
        </div>
      </div>
    </header>
  );
}

export default WarehouseReleaseDetailHeader;
