import {
  RiCalendarLine,
  RiLoader4Line,
} from "react-icons/ri";

import {
  formatPickerDateToViDate,
  convertViDateToPickerDate,
  autoFillYear,
} from "../../../utils/dateUtils";

function ImportReceiptHeader({
  id,

  headerData,
  setHeaderData,

  warehouseList,
  warehouseLoading,

  companyLoading,

  isPrintMode,
  isLockedWhenReceived,
  isLockedOnlyPrint,

  onHeaderChange,
  onLoadCompanyByTaxCode,
  onEnterMoveNext,
}) {
  const openDatePicker = (event) => {
    const picker =
      event.currentTarget.querySelector(
        ".calendar-native-input"
      );

    if (
      !picker ||
      picker.disabled
    ) {
      return;
    }

    if (
      typeof picker.showPicker ===
      "function"
    ) {
      picker.showPicker();
      return;
    }

    picker.click();
  };

  return (
    <>
      <div className="info-section-title">
        Thông tin phiếu nhập kho
      </div>

      <div className="import-voucher-card">
        <div className="voucher-grid">
          <div className="form-group">
            <label>Kỳ</label>

            <input
              data-enter-next="true"
              name="terms"
              value={headerData.terms}
              onKeyDown={onEnterMoveNext}
              onChange={onHeaderChange}
              placeholder="Nhập kỳ"
              disabled={
                isLockedWhenReceived
              }
            />
          </div>

          <div className="form-group">
            <label>Số phiếu NK</label>

            <input
              value={
                id && id !== "new"
                  ? id
                  : "Tự động tạo khi hoàn thành"
              }
              readOnly
              disabled={isPrintMode}
            />
          </div>

          <div className="form-group">
            <label>
              Ngày, tháng, năm NK{" "}
              <span>*</span>
            </label>

            <div className="input-with-icon">
              <input
                data-enter-next="true"
                className="date-text-input"
                name="inward_date"
                value={
                  headerData.inward_date
                }
                onKeyDown={
                  onEnterMoveNext
                }
                onChange={
                  onHeaderChange
                }
                onBlur={(event) =>
                  setHeaderData(
                    (previous) => ({
                      ...previous,

                      inward_date:
                        autoFillYear(
                          event.target
                            .value
                        ),
                    })
                  )
                }
                placeholder="dd/mm/yyyy"
                disabled={
                  isLockedWhenReceived
                }
              />

              <button
                type="button"
                disabled={
                  isLockedWhenReceived
                }
                onClick={openDatePicker}
              >
                <RiCalendarLine />

                <input
                  type="date"
                  className="calendar-native-input"
                  value={convertViDateToPickerDate(
                    headerData.inward_date
                  )}
                  disabled={
                    isLockedWhenReceived
                  }
                  onChange={(event) =>
                    setHeaderData(
                      (previous) => ({
                        ...previous,

                        inward_date:
                          formatPickerDateToViDate(
                            event.target
                              .value
                          ),
                      })
                    )
                  }
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>
              Nhập kho <span>*</span>
            </label>

            <select
              data-enter-next="true"
              name="warehouse_id"
              value={
                headerData.warehouse_id
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              disabled={
                isLockedWhenReceived
              }
            >
              <option value="">
                {warehouseLoading
                  ? "Đang tải danh sách kho..."
                  : "Chọn kho nhập"}
              </option>

              {warehouseList.map(
                (warehouse) => (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.code} -{" "}
                    {warehouse.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label>
              Người giao hàng
            </label>

            <input
              data-enter-next="true"
              name="delivery_person"
              value={
                headerData.delivery_person
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              placeholder="Nhập người giao hàng"
              disabled={
                isLockedOnlyPrint
              }
            />
          </div>

          <div className="form-group">
            <label>Ký hiệu HĐ</label>

            <input
              data-enter-next="true"
              name="invoice_symbol"
              value={
                headerData.invoice_symbol
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              placeholder="Nhập ký hiệu hóa đơn"
              disabled={
                isLockedOnlyPrint
              }
            />
          </div>

          <div className="form-group">
            <label>Số hóa đơn</label>

            <input
              data-enter-next="true"
              name="invoice_no"
              value={
                headerData.invoice_no
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              placeholder="Nhập số hóa đơn"
              disabled={
                isLockedOnlyPrint
              }
            />
          </div>

          <div className="form-group">
            <label>
              Ngày, tháng, năm hóa đơn
            </label>

            <div className="input-with-icon">
              <input
                data-enter-next="true"
                className="date-text-input"
                name="invoice_date"
                value={
                  headerData.invoice_date
                }
                onKeyDown={
                  onEnterMoveNext
                }
                onChange={
                  onHeaderChange
                }
                onBlur={(event) =>
                  setHeaderData(
                    (previous) => ({
                      ...previous,

                      invoice_date:
                        autoFillYear(
                          event.target
                            .value
                        ),
                    })
                  )
                }
                placeholder="dd/mm/yyyy"
                disabled={
                  isLockedOnlyPrint
                }
              />

              <button
                type="button"
                disabled={
                  isLockedOnlyPrint
                }
                onClick={openDatePicker}
              >
                <RiCalendarLine />

                <input
                  type="date"
                  className="calendar-native-input"
                  value={convertViDateToPickerDate(
                    headerData.invoice_date
                  )}
                  disabled={
                    isLockedOnlyPrint
                  }
                  onChange={(event) =>
                    setHeaderData(
                      (previous) => ({
                        ...previous,

                        invoice_date:
                          formatPickerDateToViDate(
                            event.target
                              .value
                          ),
                      })
                    )
                  }
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>MST</label>

            <div className="tax-code-load-row">
              <input
                data-enter-next="true"
                name="tax_code"
                value={
                  headerData.tax_code
                }
                onKeyDown={
                  onEnterMoveNext
                }
                onChange={
                  onHeaderChange
                }
                placeholder="Nhập mã số thuế"
                disabled={
                  isLockedOnlyPrint
                }
              />

              <button
                type="button"
                className="load-company-btn"
                title="Load công ty theo MST"
                onClick={
                  onLoadCompanyByTaxCode
                }
                disabled={
                  companyLoading ||
                  isLockedOnlyPrint
                }
              >
                <RiLoader4Line
                  className={
                    companyLoading
                      ? "loading-icon"
                      : ""
                  }
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Mã KH</label>

            <input
              data-enter-next="true"
              name="supplier_code"
              value={
                headerData.supplier_code
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              placeholder="Nhập mã khách hàng / NCC"
              disabled={
                isLockedOnlyPrint
              }
            />
          </div>

          <div className="form-group supplier-name-group">
            <label>
              Tên đơn vị cung cấp
            </label>

            <input
              data-enter-next="true"
              name="supplier_name"
              value={
                headerData.supplier_name
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              placeholder="Nhập tên đơn vị cung cấp"
              disabled={
                isLockedOnlyPrint
              }
            />
          </div>

          <div className="form-group description-group">
            <label>Diễn giải</label>

            <input
              data-enter-next="true"
              name="description"
              value={
                headerData.description
              }
              onKeyDown={
                onEnterMoveNext
              }
              onChange={onHeaderChange}
              placeholder="Nhập diễn giải"
              disabled={isPrintMode}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ImportReceiptHeader;