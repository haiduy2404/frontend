import {
  RiCloseLine,
  RiFlaskLine,
  RiSave3Line,
  RiCheckboxCircleLine,
  RiLoader4Line,
} from "react-icons/ri";

function ImportOrderInspectionModal({
  open,
  onClose,

  receiptCode,
  inspectionCode,

  rows = [],

  loading,
  savingAction,

  canUpdate,
  canComplete,

  isReceiptCompleted,

  onChangeAccepted,
  onBlurAccepted,

  onSaveDraft,
  onComplete,
}) {
  if (!open) {
    return null;
  }

  const isSaving =
    Boolean(savingAction);

  const isDraftSaving =
    savingAction === "draft";

  const isCompleting =
    savingAction === "complete";

  const disableEditing =
    loading ||
    isSaving ||
    isReceiptCompleted ||
    !canUpdate;

  return (
    <div
      className="import-order-inspection-modal-overlay"
      onMouseDown={() => {
        if (!isSaving) {
          onClose();
        }
      }}
    >
      <div
        className="import-order-inspection-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* =================================
            HEADER
        ================================= */}
        <div className="import-order-inspection-modal-header">
          <div className="import-order-inspection-modal-heading">
            <div className="import-order-inspection-modal-icon">
              <RiFlaskLine />
            </div>

            <div>
              <h2>
                Biên bản kiểm nghiệm
              </h2>

              <p>
                Nhập kết quả kiểm nghiệm hàng hóa
                trước khi hoàn thành phiếu nhập kho
              </p>
            </div>
          </div>

          <button
            type="button"
            className="import-order-inspection-modal-close"
            onClick={onClose}
            disabled={isSaving}
            title="Đóng"
          >
            <RiCloseLine />
          </button>
        </div>

        {/* =================================
            RECEIPT INFO
        ================================= */}
        <div className="import-order-inspection-info">
          <div className="import-order-inspection-info-item">
            <span>
              Số biên bản kiểm nghiệm
            </span>

            <strong>
              {inspectionCode || "-"}
            </strong>
          </div>

          <div className="import-order-inspection-info-item">
            <span>
              Phiếu nhập kho tham chiếu
            </span>

            <strong>
              {receiptCode || "-"}
            </strong>
          </div>

          <div className="import-order-inspection-info-note">
            <span>
              Lưu tạm chỉ lưu số liệu kiểm nghiệm,
              không thay đổi trạng thái phiếu.
            </span>
          </div>
        </div>

        {/* =================================
            BODY
        ================================= */}
        <div className="import-order-inspection-modal-body">
          <div className="import-order-inspection-table-header">
            <div>
              <h3>
                Chi tiết hàng hóa
              </h3>

              <span>
                Tổng {rows.length} mặt hàng
              </span>
            </div>

            {isReceiptCompleted && (
              <span className="import-order-inspection-completed-badge">
                Đã hoàn thành
              </span>
            )}
          </div>

          <div className="import-order-inspection-table-wrapper">
            <table className="import-order-inspection-table">
              <thead>
                <tr>
                  <th className="inspection-index-col">
                    STT
                  </th>

                  <th>
                    Mã hàng
                  </th>

                  <th>
                    Tên hàng
                  </th>

                  <th>
                    Đơn vị tính
                  </th>

                  <th className="inspection-number-col">
                    Số lượng theo chứng từ
                  </th>

                  <th className="inspection-number-col inspection-accepted-col">
                    Số lượng đúng quy cách,
                    phẩm chất
                  </th>

                  <th className="inspection-number-col">
                    Số lượng không đúng quy cách,
                    phẩm chất
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="import-order-inspection-empty"
                    >
                      <div className="import-order-inspection-loading">
                        <RiLoader4Line />

                        <span>
                          Đang tải dữ liệu kiểm nghiệm...
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="import-order-inspection-empty"
                      >
                        Phiếu nhập kho chưa có chi
                        tiết hàng hóa
                      </td>
                    </tr>
                  )}

                {!loading &&
                  rows.map((item, index) => (
                    <tr
                      key={
                        item.id ||
                        item.inventory_id ||
                        item.goods_id ||
                        index
                      }
                    >
                      <td className="inspection-index-col">
                        {index + 1}
                      </td>

                      <td>
                        {item.goods_code || "-"}
                      </td>

                      <td
                        className="inspection-goods-name"
                        title={
                          item.goods_name || ""
                        }
                      >
                        {item.goods_name || "-"}
                      </td>

                      <td>
                        {item.unit_name || "-"}
                      </td>

                      <td className="inspection-number-col">
                        {item.original_quantity ||
                          "0,000"}
                      </td>

                      <td className="inspection-accepted-col">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="import-order-inspection-number-input"
                          value={
                            item.accepted_quantity ??
                            ""
                          }
                          disabled={
                            disableEditing
                          }
                          onChange={(event) =>
                            onChangeAccepted(
                              item.id,
                              event.target.value
                            )
                          }
                          onBlur={() =>
                            onBlurAccepted(
                              item.id
                            )
                          }
                        />
                      </td>

                      <td className="inspection-number-col">
                        {item.rejected_quantity ||
                          "0,000"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================
            FOOTER
        ================================= */}
        <div className="import-order-inspection-modal-footer">
          <div className="import-order-inspection-footer-note">
            <strong>
              Lưu tạm:
            </strong>

            <span>
              phiếu vẫn giữ trạng thái Đã nhận hàng.
            </span>
          </div>

          <div className="import-order-inspection-modal-actions">
            <button
              type="button"
              className="import-order-inspection-cancel-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Đóng
            </button>

            {canUpdate && (
              <button
                type="button"
                className="import-order-inspection-draft-btn"
                disabled={
                  loading ||
                  isSaving ||
                  isReceiptCompleted ||
                  rows.length === 0
                }
                onClick={onSaveDraft}
              >
                {isDraftSaving ? (
                  <>
                    <RiLoader4Line className="import-order-inspection-spin" />

                    <span>
                      Đang lưu...
                    </span>
                  </>
                ) : (
                  <>
                    <RiSave3Line />

                    <span>
                      Lưu tạm
                    </span>
                  </>
                )}
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                className="import-order-inspection-complete-btn"
                disabled={
                  loading ||
                  isSaving ||
                  isReceiptCompleted ||
                  rows.length === 0
                }
                onClick={onComplete}
              >
                {isCompleting ? (
                  <>
                    <RiLoader4Line className="import-order-inspection-spin" />

                    <span>
                      Đang hoàn thành...
                    </span>
                  </>
                ) : (
                  <>
                    <RiCheckboxCircleLine />

                    <span>
                      {isReceiptCompleted
                        ? "Đã hoàn thành"
                        : "Hoàn thành"}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportOrderInspectionModal;