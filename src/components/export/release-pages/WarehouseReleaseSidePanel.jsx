import {
  RiCloseCircleLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFileTextLine,
  RiLoader4Line,
} from "react-icons/ri";

function WarehouseReleaseSidePanel({
  selectedRow,
  selectedCount,

  canUseReleaseActualPage,
  canDelete,

  rejecting,
  deleting,

  canRejectReleaseByStatus,
  canDeleteReleaseByStatus,

  printForms,

  onOpenActual,
  onReject,
  onDelete,
  onPrint,
}) {
  if (!selectedRow) return null;

  return (
    <aside className="warehouse-release-side-panel">
      <section className="warehouse-release-side-card">
        <div className="warehouse-release-section-title">
          THAO TÁC
        </div>

        {canUseReleaseActualPage && (
          <button
            type="button"
            className="warehouse-release-side-action"
            disabled={selectedCount > 1}
            onClick={onOpenActual}
          >
            <RiEdit2Line />

            <span>
              <strong>Nhập SL thực xuất</strong>
              <small>
                Cập nhật số lượng thực tế
              </small>
            </span>
          </button>
        )}

        <button
          type="button"
          className="warehouse-release-side-action warning"
          disabled={
            rejecting ||
            selectedCount > 1 ||
            !canRejectReleaseByStatus(
              selectedRow.status
            )
          }
          onClick={onReject}
        >
          {rejecting ? (
            <RiLoader4Line className="spin" />
          ) : (
            <RiCloseCircleLine />
          )}

          <span>
            <strong>
              {rejecting
                ? "Đang từ chối..."
                : "Từ chối"}
            </strong>

            <small>
              Hủy lệnh theo quyền và trạng thái
            </small>
          </span>
        </button>

        {canDelete && (
          <button
            type="button"
            className="warehouse-release-side-action danger"
            disabled={
              deleting ||
              !canDeleteReleaseByStatus(
                selectedRow.status
              )
            }
            onClick={onDelete}
          >
            <RiDeleteBin6Line />

            <span>
              <strong>
                {selectedCount > 0
                  ? `Xóa (${selectedCount})`
                  : "Xóa"}
              </strong>

              <small>
                Xóa lệnh xuất kho
              </small>
            </span>
          </button>
        )}
      </section>

      <section className="warehouse-release-side-card">
        <div className="warehouse-release-section-title">
          CÁC PHIẾU IN
        </div>

        <div className="warehouse-release-print-actions">
          {printForms.map((form) => (
            <button
              key={form.key}
              type="button"
              className="warehouse-release-side-action warehouse-release-print-action"
              onClick={() =>
                onPrint(form.key)
              }
            >
              <RiFileTextLine />

              <span>
                <strong>{form.label}</strong>
                <small>
                  {form.description}
                </small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

export default WarehouseReleaseSidePanel;
