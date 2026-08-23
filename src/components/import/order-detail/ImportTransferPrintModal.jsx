function ImportTransferPrintModal({
  open,

  headerData,
  bankAccountOptions,

  transferBankId,
  transferBankName,
  transferBankAccountNumber,

  printReason,

  onSelectBank,
  onChangeBankName,
  onChangeBankAccountNumber,
  onChangeReason,

  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="print-reason-modal-overlay">
      <div className="print-reason-modal">
        <div className="print-reason-modal-header">
          <h3>
            Nhập thông tin in giấy
            đề nghị chuyển tiền
          </h3>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="print-reason-modal-body">
          <div className="transfer-info-grid">
            <div className="form-group">
              <label>MST</label>

              <input
                value={
                  headerData.tax_code
                }
                readOnly
                disabled
              />
            </div>

            <div className="form-group">
              <label>
                Tên công ty
              </label>

              <input
                value={
                  headerData.supplier_name
                }
                readOnly
                disabled
              />
            </div>

            <div className="form-group transfer-full-row">
              <label>
                Địa chỉ
              </label>

              <input
                value={
                  headerData.address
                }
                readOnly
                disabled
              />
            </div>

            <div className="form-group transfer-full-row">
              <label>
                Chọn tài khoản ngân
                hàng đã lưu
              </label>

              <select
                value={
                  transferBankId
                }
                onChange={(
                  event
                ) =>
                  onSelectBank(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Không chọn / Nhập
                  tay
                </option>

                {bankAccountOptions.map(
                  (bank) => (
                    <option
                      key={bank.id}
                      value={bank.id}
                    >
                      {
                        bank.bank_account_name
                      }{" "}
                      -{" "}
                      {
                        bank.bank_account_number
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group transfer-full-row">
              <label>
                Tên ngân hàng
              </label>

              <input
                value={
                  transferBankName
                }
                onChange={(
                  event
                ) =>
                  onChangeBankName(
                    event.target
                      .value
                  )
                }
                placeholder="Nhập tên ngân hàng"
              />
            </div>

            <div className="form-group transfer-full-row">
              <label>
                Số tài khoản ngân
                hàng
              </label>

              <input
                value={
                  transferBankAccountNumber
                }
                onChange={(
                  event
                ) =>
                  onChangeBankAccountNumber(
                    event.target
                      .value
                  )
                }
                placeholder="Nhập số tài khoản ngân hàng"
              />
            </div>
          </div>

          <label>Lý do</label>

          <textarea
            value={printReason}
            onChange={(event) =>
              onChangeReason(
                event.target.value
              )
            }
            placeholder="Nhập lý do in phiếu"
            rows={4}
          />
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
          >
            Đồng ý in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportTransferPrintModal;