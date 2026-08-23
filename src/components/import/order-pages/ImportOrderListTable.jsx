import {
  RiCalendarLine,
  RiMapPin2Line,
} from "react-icons/ri";

import {
  formatISOToViDate,
} from "../../../utils/dateUtils";

function ImportOrderListTable({
  importOrders,

  total,

  selectedId,
  selectedIds,

  completing,
  rejecting,

  isAllChecked,
  waitingDeliveryRows,

  isWaitingDeliveryStatus,
  getReceiptStatusText,

  onToggleAll,
  onToggleOne,

  onSelectRow,
  onOpenReceipt,
}) {
  const getStatusClass = (status) => {
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

  const getWarehouseName = (row) =>
    row.warehouse_name ||
    row.warehouse?.name ||
    row.warehouse ||
    "-";

  const getSupplierName = (row) =>
    row.supplier_name ||
    row.vendor_name ||
    row.partner_name ||
    row.company_name ||
    row.supplier?.name ||
    "-";

  const getAmount = (row) =>
    row.total_amount ??
    row.grand_total ??
    row.total_value ??
    row.amount ??
    null;

  const formatCompactMoney = (value) => {
    const number = Number(value);

    if (
      value === null ||
      value === undefined ||
      Number.isNaN(number)
    ) {
      return "-";
    }

    if (Math.abs(number) >= 1_000_000_000) {
      return `${(
        number / 1_000_000_000
      ).toLocaleString("vi-VN", {
        maximumFractionDigits: 2,
      })} tỷ`;
    }

    if (Math.abs(number) >= 1_000_000) {
      return `${(
        number / 1_000_000
      ).toLocaleString("vi-VN", {
        maximumFractionDigits: 2,
      })} triệu`;
    }

    return number.toLocaleString(
      "vi-VN"
    );
  };

  return (
    <div className="import-order-list-wrapper">
      {/* HEADER DANH SÁCH */}
      <div className="import-order-list-header">
        <div className="import-order-list-total">
          <input
            type="checkbox"
            checked={isAllChecked}
            disabled={
              completing ||
              rejecting ||
              waitingDeliveryRows.length ===
                0
            }
            title="Chọn tất cả phiếu Chờ nhận hàng"
            onChange={onToggleAll}
          />

          <span>
            Tổng{" "}
            <strong>
              {total ?? importOrders.length}
            </strong>{" "}
            lệnh
          </span>
        </div>

        <div className="import-order-list-sort">
          Mới nhất
        </div>
      </div>

      {/* DANH SÁCH CARD */}
      <div className="import-order-card-list">
        {importOrders.length === 0 ? (
          <div className="import-order-empty">
            Không có phiếu nhập kho
          </div>
        ) : (
          importOrders.map((row) => {
            const selected =
              selectedId === row.id;

            const statusClass =
              getStatusClass(
                row.status
              );

            const statusText =
              getReceiptStatusText(
                row.status
              );

            const date =
              formatISOToViDate(
                row.receipt_date ||
                  row.import_date ||
                  row.created_at
              ) || "-";

            return (
              <div
                key={row.id}
                className={`import-order-card ${
                  selected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onSelectRow(row)
                }
              >
                {/* TOP */}
                <div className="import-order-card-top">
                  <div className="import-order-card-code-area">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(
                        row.id
                      )}
                      disabled={
                        completing ||
                        rejecting ||
                        !isWaitingDeliveryStatus(
                          row.status
                        )
                      }
                      title={
                        !isWaitingDeliveryStatus(
                          row.status
                        )
                          ? "Chỉ phiếu Chờ nhận hàng mới được chọn"
                          : ""
                      }
                      onChange={(
                        event
                      ) =>
                        onToggleOne(
                          event,
                          row
                        )
                      }
                      onClick={(
                        event
                      ) =>
                        event.stopPropagation()
                      }
                    />

                    <span
                      className={`import-order-status-dot ${statusClass}`}
                    />

                    <button
                      type="button"
                      className="import-order-code"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        onOpenReceipt(
                          row
                        );
                      }}
                    >
                      {row.code ||
                        "-"}
                    </button>
                  </div>

                  <span
                    className={`import-order-status-badge ${statusClass}`}
                  >
                    {statusText}
                  </span>
                </div>

                {/* BODY */}
                <div className="import-order-card-body">
                  <div
                    className="import-order-supplier"
                    title={getSupplierName(
                      row
                    )}
                  >
                    {getSupplierName(
                      row
                    )}
                  </div>

                  <div className="import-order-warehouse">
                    <RiMapPin2Line />

                    <span>
                      {getWarehouseName(
                        row
                      )}
                    </span>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="import-order-card-footer">
                  <div className="import-order-date">
                    <RiCalendarLine />

                    <span>
                      {date}
                    </span>
                  </div>

                  <strong className="import-order-amount">
                    {formatCompactMoney(
                      getAmount(row)
                    )}
                  </strong>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ImportOrderListTable;