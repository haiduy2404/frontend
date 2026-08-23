import {
  RiAddLine,
  RiUser3Line,
} from "react-icons/ri";

import {
  formatISOToViDate,
} from "../../../utils/dateUtils";


function ReleaseOrderDetailHeader({
  selectedRow,
  getReleaseStatusText,
  canCreate,
  onAdd,
}) {
  const status =
    String(
      selectedRow?.status ||
      ""
    ).toUpperCase();


  return (
    <header className="release-order-detail-header">
      <div className="release-order-detail-header-main">
        {selectedRow ? (
          <>
            <div className="release-order-detail-title-row">
              <h2>
                {selectedRow.code ||
                  selectedRow.release_code ||
                  "-"}
              </h2>
            </div>


            <div className="release-order-detail-created">
              <RiUser3Line />

              <span>Tạo bởi:</span>

              <strong>
                {selectedRow.created_by_admin_name ||
                  selectedRow.created_by_name ||
                  selectedRow.created_by ||
                  "-"}
              </strong>

              <span className="release-order-detail-dot">
                •
              </span>

              <span>
                {formatISOToViDate(
                  selectedRow.created_at
                ) || "-"}
              </span>
            </div>
          </>
        ) : (
          <>
            <h2>Lệnh xuất kho</h2>

            <div className="release-order-detail-created">
              Chọn một phiếu để xem chi tiết
            </div>
          </>
        )}
      </div>


      {canCreate && (
        <button
          type="button"
          className="release-order-detail-add-btn"
          onClick={onAdd}
        >
          <RiAddLine />

          <span>Thêm</span>
        </button>
      )}
    </header>
  );
}


export default ReleaseOrderDetailHeader;