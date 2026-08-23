import {
  RiCheckboxCircleLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFileCopyLine,
  RiFileTextLine,
} from "react-icons/ri";


function ReleaseOrderSidePanel({
  selectedRow,
  selectedCount,

  canCreate,
  canUpdate,
  canComplete,
  canDelete,

  onEdit,
  onComplete,
  onClone,
  onDelete,
  onPrint,
}) {
  if (!selectedRow) {
    return null;
  }


  const status =
    String(
      selectedRow.status || ""
    )
      .trim()
      .toUpperCase();


  const isPending =
    status === "PENDING";

  const editDisabled =
    selectedCount > 1 ||
    !canUpdate ||
    !isPending;


  return (
    <aside className="release-order-side-panel">
      <section className="release-order-side-card">
        <div className="release-order-side-title">
          THAO TÁC
        </div>


        <button
          type="button"
          className="release-order-side-action"
          disabled={editDisabled}
          onClick={onEdit}
        >
          <RiEdit2Line />

          <span>
            <strong>
              Chỉnh sửa
            </strong>

            <small>
              Chỉnh sửa thông tin lệnh xuất
            </small>
          </span>
        </button>


        {canComplete && (
          <button
            type="button"
            className="release-order-side-action"
            disabled={!isPending}
            onClick={onComplete}
          >
            <RiCheckboxCircleLine />

            <span>
              <strong>
                {selectedCount > 1
                  ? `Duyệt lệnh (${selectedCount})`
                  : "Duyệt lệnh"}
              </strong>

              <small>
                Chuyển lệnh sang bước tiếp theo
              </small>
            </span>
          </button>
        )}


        {canCreate && (
          <button
            type="button"
            className="release-order-side-action"
            onClick={onClone}
          >
            <RiFileCopyLine />

            <span>
              <strong>
                Nhân bản
              </strong>

              <small>
                Tạo lệnh mới từ lệnh đang chọn
              </small>
            </span>
          </button>
        )}


        {canDelete && (
          <button
            type="button"
            className="release-order-side-action danger"
            onClick={onDelete}
          >
            <RiDeleteBin6Line />

            <span>
              <strong>
                Xóa phiếu
              </strong>

              <small>
                Xóa lệnh xuất kho đang chọn
              </small>
            </span>
          </button>
        )}
      </section>


      <section className="release-order-side-card">
        <div className="release-order-side-title">
          CÁC PHIẾU IN
        </div>


        <button
          type="button"
          className="release-order-side-action"
          onClick={onPrint}
        >
          <RiFileTextLine />

          <span>
            <strong>
              In phiếu xuất kho
            </strong>

            <small>
              Mở phiếu ở chế độ in
            </small>
          </span>
        </button>
      </section>
    </aside>
  );
}


export default ReleaseOrderSidePanel;