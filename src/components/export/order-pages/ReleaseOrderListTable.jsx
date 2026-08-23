import {
  RiCalendarLine,
  RiMapPinLine,
} from "react-icons/ri";


function ReleaseOrderListTable({
  releaseOrders,
  loading,

  selectedId,
  selectedIds,

  isAllChecked,

  getReleaseStatusText,

  onToggleAll,
  onToggleOne,
  onSelectRow,
  onOpenReleaseOrder,
}) {
  const getStatusClass = (
    status
  ) =>
    String(
      status || ""
    )
      .toLowerCase()
      .replaceAll("_", "-");


  if (loading) {
    return (
      <div className="release-order-list-loading">
        Đang tải danh sách lệnh xuất kho...
      </div>
    );
  }


  if (
    !releaseOrders ||
    releaseOrders.length === 0
  ) {
    return (
      <div className="release-order-list-empty">
        Không có lệnh xuất kho
      </div>
    );
  }


  return (
    <>
      <div className="release-order-list-header">
        <label>
          <input
            type="checkbox"
            checked={isAllChecked}
            onChange={onToggleAll}
          />

          <span>
            Tổng {releaseOrders.length} lệnh
          </span>
        </label>

        <span>
          Mới nhất
        </span>
      </div>


      <div className="release-order-card-list">
        {releaseOrders.map(
          (row) => {
            const code =
              row.code ||
              row.release_code ||
              "-";

            const receiverUnit =
              row.receiver_unit?.name ||
              row.receiver_unit ||
              "-";

            const releaseTarget =
              row.release_target?.name ||
              row.release_target ||
              "-";

            const warehouse =
              row.warehouse_name ||
              row.warehouse?.name ||
              row.warehouse ||
              "-";

            const statusClass =
              getStatusClass(
                row.status
              );


            return (
              <div
                key={row.id}
                className={[
                  "release-order-list-card",

                  selectedId ===
                  row.id
                    ? "selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  onSelectRow(
                    row
                  )
                }
              >
                <div className="release-order-list-card-top">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.includes(
                        row.id
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      onToggleOne(
                        event,
                        row.id
                      )
                    }
                    onClick={(
                      event
                    ) =>
                      event.stopPropagation()
                    }
                  />


                  <button
                    type="button"
                    className="release-order-card-code"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      onOpenReleaseOrder(
                        row
                      );
                    }}
                  >
                    {code}
                  </button>


                  <span
                    className={`release-order-card-status ${statusClass}`}
                  >
                    {getReleaseStatusText(
                      row.status
                    )}
                  </span>
                </div>


                <div className="release-order-card-target">
                  {releaseTarget}
                </div>


                <div className="release-order-card-receiver">
                  {receiverUnit}
                </div>


                <div className="release-order-card-meta">
                  <span>
                    <RiMapPinLine />

                    {warehouse}
                  </span>

                  <span>
                    <RiCalendarLine />

                    {row.release_date ||
                      row.created_at ||
                      "-"}
                  </span>
                </div>
              </div>
            );
          }
        )}
      </div>
    </>
  );
}


export default ReleaseOrderListTable;