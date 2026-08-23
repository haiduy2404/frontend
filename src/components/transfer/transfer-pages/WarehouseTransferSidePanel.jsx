import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiLoader4Line,
} from "react-icons/ri";

import WarehouseTransferPrintPanel from "./WarehouseTransferPrintPanel";
import WarehouseTransferDocumentsPanel from "./WarehouseTransferDocumentsPanel";

import { isPendingTransferStatus } from "./utils/warehouseTransferUtils";

export default function WarehouseTransferSidePanel({ detail, actions }) {
  const transfer = detail.raw;
  const pending = isPendingTransferStatus(detail.status);

  const busy =
    actions.completing ||
    actions.rejecting ||
    actions.deleting;

  return (
    <aside className="warehouse-transfer-side-column">
      {/* =====================================================
          THAO TÁC
      ===================================================== */}
      <section className="warehouse-transfer-side-card">
        <h3>THAO TÁC</h3>

        <div className="warehouse-transfer-side-actions">
          {actions.canUpdate && (
            <button
              type="button"
              disabled={!pending || busy}
              onClick={() => actions.handleOpenEdit(transfer)}
            >
              <RiEdit2Line />

              <span>
                <strong>Chỉnh sửa</strong>
                <small>Chỉnh sửa thông tin phiếu</small>
              </span>
            </button>
          )}

          {actions.canUpdate && pending && (
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.handleComplete(transfer)}
            >
              {actions.completing ? (
                <RiLoader4Line className="warehouse-transfer-spin" />
              ) : (
                <RiCheckboxCircleLine />
              )}

              <span>
                <strong>
                  {actions.completing
                    ? "Đang hoàn thành..."
                    : "Hoàn thành"}
                </strong>

                <small>Hoàn thành phiếu điều chuyển</small>
              </span>
            </button>
          )}

          {actions.canDeleteAdmin &&
            detail.status === "COMPLETED" && (
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => actions.handleReject(transfer)}
              >
                {actions.rejecting ? (
                  <RiLoader4Line className="warehouse-transfer-spin" />
                ) : (
                  <RiCloseCircleLine />
                )}

                <span>
                  <strong>
                    {actions.rejecting
                      ? "Đang từ chối..."
                      : "Từ chối"}
                  </strong>

                  <small>
                    Đưa phiếu về trạng thái đang điều chuyển
                  </small>
                </span>
              </button>
            )}

          {actions.canDelete && (
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={() => actions.handleDelete(transfer)}
            >
              {actions.deleting ? (
                <RiLoader4Line className="warehouse-transfer-spin" />
              ) : (
                <RiDeleteBin6Line />
              )}

              <span>
                <strong>
                  {actions.deleting
                    ? "Đang xóa..."
                    : "Xóa phiếu"}
                </strong>

                <small>Xóa phiếu điều chuyển</small>
              </span>
            </button>
          )}
        </div>
      </section>

      {/* =====================================================
          CÁC PHIẾU IN
      ===================================================== */}
      <WarehouseTransferPrintPanel detail={detail} />

      {/* =====================================================
          TÀI LIỆU LIÊN QUAN
      ===================================================== */}
      <WarehouseTransferDocumentsPanel detail={detail} />

      {/* =====================================================
          GHI CHÚ
      ===================================================== */}
      <section className="warehouse-transfer-side-card warehouse-transfer-note-card">
        <h3>GHI CHÚ</h3>

        <p>{detail.note || "Chưa có ghi chú"}</p>
      </section>
    </aside>
  );
}