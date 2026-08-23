import {
  RiAddLine,
  RiUser3Line,
} from "react-icons/ri";

function ImportOrderDetailHeader({
  selectedRow,
  getReceiptStatusText,

  canCreate,
  onAdd,
}) {
  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "WAITING_DELIVERY":
        return "waiting";

      case "RECEIVED":
        return "received";

      case "COMPLETED":
        return "completed";

      default:
        return "default";
    }
  };

  const formatDateTime = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit",

        hour12: false,
      }
    ).format(date);
  };

  const creatorName =
    selectedRow
      ?.created_by_admin_name ||
    selectedRow
      ?.created_by?.name ||
    selectedRow
      ?.creator_name ||
    selectedRow
      ?.importer ||
    "-";

  const createdAt =
    selectedRow?.created_at ||
    selectedRow?.receipt_date ||
    selectedRow?.import_date;

  return (
    <header className="import-order-detail-header">
      <div className="import-order-detail-header-main">
        {selectedRow ? (
          <div className="import-order-detail-header-info">
            <div className="import-order-detail-title-row">
                <h2>
                    {selectedRow?.code || "-"}
                </h2>
            </div>

            <div className="import-order-detail-created">
              <RiUser3Line />

              <span>
                Tạo bởi:
              </span>

              <strong>
                {creatorName}
              </strong>

              <span className="import-order-detail-created-dot">
                •
              </span>

              <span>
                {formatDateTime(
                  createdAt
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="import-order-detail-header-empty">
            Chọn một phiếu để xem
            chi tiết
          </div>
        )}

        {canCreate && (
          <button
            type="button"
            className="import-order-detail-add-btn"
            onClick={onAdd}
          >
            <RiAddLine />

            <span>
              Thêm
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

export default ImportOrderDetailHeader;