import {
  RiCloseLine,
  RiLoader4Line,
  RiPrinterLine,
} from "react-icons/ri";

function WarehouseReleasePrintModal({
  controller,
}) {
  const {
    open,
    printSigners,
    printFormName,

    signerUsersLoading,
    activeSignerFields,

    closePrintModal,
    handleChangePrintSigner,
    handleConfirmPrint,
    getUsersBySignerField,
  } = controller;

  if (!open) return null;

  return (
    <div className="warehouse-release-modal-overlay">
      <div className="warehouse-release-print-modal">
        <div className="warehouse-release-modal-header warehouse-release-print-modal-header">
          <div>
            <h3>Chọn người ký</h3>
            <span>{printFormName}</span>
          </div>

          <button
            type="button"
            onClick={closePrintModal}
            disabled={signerUsersLoading}
          >
            <RiCloseLine />
          </button>
        </div>

        {signerUsersLoading ? (
          <div className="warehouse-release-modal-loading">
            <RiLoader4Line className="spin" />
            <span>
              Đang tải danh sách người ký...
            </span>
          </div>
        ) : (
          <div className="warehouse-release-signer-grid warehouse-release-signer-grid-only">
            {activeSignerFields.map((field) => {
              const users =
                getUsersBySignerField(field);

              return (
                <div
                  className="warehouse-release-signer-field"
                  key={field.key}
                >
                  <label>{field.label}</label>

                  <select
                    value={
                      printSigners[field.key] || ""
                    }
                    onChange={(event) =>
                      handleChangePrintSigner(
                        field.key,
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Chọn {field.label.toLowerCase()}
                    </option>

                    {users.map((user) => (
                      <option
                        key={
                          user.id ||
                          user.username ||
                          `${field.key}-${user.full_name}`
                        }
                        value={user.full_name}
                      >
                        {user.full_name}
                      </option>
                    ))}
                  </select>

                  {!users.length && (
                    <small>
                      Không có người dùng thuộc position này
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="warehouse-release-modal-footer">
          <button
            type="button"
            onClick={closePrintModal}
            disabled={signerUsersLoading}
          >
            Hủy
          </button>

          <button
            type="button"
            className="primary"
            onClick={handleConfirmPrint}
            disabled={signerUsersLoading}
          >
            <RiPrinterLine />
            In phiếu
          </button>
        </div>
      </div>
    </div>
  );
}

export default WarehouseReleasePrintModal;
