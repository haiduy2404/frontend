import {
  RiLoader4Line,
  RiPrinterLine,
} from "react-icons/ri";

import {
  RECEIPT_SIGNER_FIELDS,
} from "../../../hooks/order-detail/useImportReceiptPrint";

import {
  getUsersBySignerField,
} from "../../../utils/signerUtils";

function ImportReceiptSignerModal({
  open,

  users,
  loading,

  signers,
  attachedDocumentNumber,

  onChangeSigner,
  onChangeAttachedDocumentNumber,

  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="print-reason-modal-overlay">
      <div className="print-reason-modal receipt-signer-modal">
        <div className="print-reason-modal-header">
          <h3>
            Chọn người ký phiếu
            nhập kho
          </h3>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="print-reason-modal-body">
          {loading ? (
            <div className="receipt-signer-loading">
              <RiLoader4Line className="loading-icon" />

              <span>
                Đang tải danh sách
                người ký...
              </span>
            </div>
          ) : (
            <div className="receipt-signer-grid">
              {RECEIPT_SIGNER_FIELDS.map(
                (field) => {
                  const fieldUsers =
                    getUsersBySignerField(
                      users,
                      field
                    );

                  return (
                    <div
                      className="receipt-signer-field"
                      key={
                        field.key
                      }
                    >
                      <label>
                        {field.label}

                        {field.required && (
                          <span className="receipt-required">
                            {" "}*
                          </span>
                        )}
                      </label>

                      <select
                        value={
                          signers[
                            field.key
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          onChangeSigner(
                            field.key,
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Chọn{" "}
                          {field.label.toLowerCase()}
                        </option>

                        {fieldUsers.map(
                          (user) => (
                            <option
                              key={
                                user.id ||
                                user.username ||
                                `${field.key}-${user.full_name}`
                              }
                              value={
                                user.full_name
                              }
                            >
                              {
                                user.full_name
                              }
                            </option>
                          )
                        )}
                      </select>

                      {fieldUsers.length ===
                        0 && (
                        <small className="receipt-no-user">
                          Không có người
                          dùng thuộc
                          position này
                        </small>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}

          <div className="receipt-document-field">
            <label>
              Số chứng từ kèm theo
            </label>

            <input
              value={
                attachedDocumentNumber
              }
              onChange={(
                event
              ) =>
                onChangeAttachedDocumentNumber(
                  event.target
                    .value
                )
              }
              placeholder="Nhập số chứng từ kèm theo"
            />
          </div>
        </div>

        <div className="print-reason-modal-footer">
          <button
            type="button"
            className="print-reason-cancel-btn"
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="button"
            className="print-reason-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            <RiPrinterLine />
            Đồng ý in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportReceiptSignerModal;