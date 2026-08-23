import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiLoader4Line,
} from "react-icons/ri";
import { isPendingTransferStatus } from "./utils/warehouseTransferUtils";

export default function WarehouseTransferActionBar({
  selectedRow,
  canUpdate,
  canDelete,
  canCreate,
  canDeleteAdmin,
  rejecting,
  completing,
  handleAdd,
  handleOpenEdit,
  handleComplete,
  handleReject,
  handleDelete,
}) {
  return (
    <>
      {canUpdate && (
        <button
          type="button"
          className="edit-btn"
          disabled={!selectedRow || !isPendingTransferStatus(selectedRow.status)}
          onClick={() => {
            if (!selectedRow) {
              alert("Vui lòng chọn phiếu cần chỉnh sửa");
              return;
            }

            if (!isPendingTransferStatus(selectedRow.status)) {
              alert("Chỉ được chỉnh sửa phiếu đang điều chuyển.");
              return;
            }

            handleOpenEdit(selectedRow);
          }}
        >
          <RiEdit2Line />
          <span>Chỉnh sửa</span>
        </button>
      )}

      {canDeleteAdmin && (
        <button
          type="button"
          className="delete-toolbar-btn"
          disabled={
            rejecting ||
            completing ||
            !selectedRow ||
            selectedRow.status !== "COMPLETED"
          }
          onClick={() => handleReject(selectedRow)}
          title={
            selectedRow && selectedRow.status !== "COMPLETED"
              ? "Chỉ được từ chối phiếu đã hoàn thành"
              : ""
          }
        >
          {rejecting ? (
            <RiLoader4Line className="transfer-action-loading-icon" />
          ) : (
            <RiCloseCircleLine />
          )}

          <span>{rejecting ? "Đang từ chối..." : "Từ chối"}</span>
        </button>
      )}

      {canUpdate && (
        <button
          type="button"
          className="complete-toolbar-btn"
          disabled={
            completing ||
            rejecting ||
            !selectedRow ||
            !isPendingTransferStatus(selectedRow.status)
          }
          onClick={() => handleComplete(selectedRow)}
        >
          {completing ? (
            <RiLoader4Line className="transfer-action-loading-icon" />
          ) : (
            <RiCheckboxCircleLine />
          )}

          <span>{completing ? "Đang hoàn thành..." : "Hoàn thành"}</span>
        </button>
      )}

      {canDelete && (
        <button
          type="button"
          className="delete-toolbar-btn"
          disabled={!selectedRow}
          onClick={() => {
            if (!selectedRow) {
              alert("Vui lòng chọn phiếu cần xóa");
              return;
            }

            handleDelete(selectedRow);
          }}
        >
          <RiDeleteBin6Line />
          <span>Xóa</span>
        </button>
      )}

      {canCreate && (
        <button type="button" className="add-btn" onClick={handleAdd}>
          <RiAddLine />
          <span>Thêm</span>
        </button>
      )}
    </>
  );
}
