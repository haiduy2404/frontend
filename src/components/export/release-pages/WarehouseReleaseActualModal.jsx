import {
  RiCheckboxCircleLine,
  RiCloseLine,
  RiLoader4Line,
  RiSave3Line,
} from "react-icons/ri";

function WarehouseReleaseActualModal({
  controller,
}) {
  const {
    open,
    loading,
    saving,
    completing,

    canSaveActual,
    canComplete,

    headerData,
    items,
    fillActualQuantity,

    closeActualModal,
    handleChangeActualQuantity,
    handleFillActualToggle,
    handleSaveActualQuantity,
    handleCompleteRelease,

    parseNumber,
    formatViNumber,
  } = controller;

  if (!open) return null;

  const totalRequested = items.reduce(
    (sum, item) =>
      sum +
      parseNumber(item.requested_quantity),
    0
  );

  const totalActual = items.reduce(
    (sum, item) =>
      sum +
      parseNumber(item.actual_quantity),
    0
  );

  return (
    <div className="warehouse-release-modal-overlay">
      <div className="warehouse-release-actual-modal">
        <div className="warehouse-release-modal-header warehouse-release-actual-modal-header">
          <div>
            <h3>
              Nhập số lượng thực xuất
              {headerData.code
                ? ` - ${headerData.code}`
                : ""}
            </h3>

            <span>
              Kiểm tra số lượng yêu cầu và nhập số lượng thực tế xuất khỏi kho
            </span>
          </div>

          <button
            type="button"
            onClick={closeActualModal}
            disabled={saving || completing}
          >
            <RiCloseLine />
          </button>
        </div>

        {loading ? (
          <div className="warehouse-release-modal-loading">
            <RiLoader4Line className="spin" />
            <span>
              Đang tải dữ liệu xuất kho...
            </span>
          </div>
        ) : (
          <>
            <div className="warehouse-release-actual-content">
              <div className="warehouse-release-actual-info-grid">
                <div>
                  <span>KHO XUẤT</span>
                  <strong>
                    {headerData.warehouse_name || "-"}
                  </strong>
                </div>

                <div>
                  <span>ĐƠN VỊ LĨNH</span>
                  <strong>
                    {headerData.receiver_unit || "-"}
                  </strong>
                </div>

                <div>
                  <span>ĐỐI TƯỢNG XUẤT</span>
                  <strong>
                    {headerData.release_target || "-"}
                  </strong>
                </div>

                <div>
                  <span>NGÀY XUẤT</span>
                  <strong>
                    {headerData.release_date || "-"}
                  </strong>
                </div>
              </div>

              {canSaveActual && (
                <div className="warehouse-release-fill-actual-row">
                  <label className="warehouse-release-fill-actual">
                    <input
                      type="checkbox"
                      checked={fillActualQuantity}
                      onChange={(event) =>
                        handleFillActualToggle(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      Nhập đầy đủ số lượng thực xuất
                    </span>
                  </label>

                  <small>
                    Tự động lấy SL yêu cầu làm SL thực xuất cho toàn bộ vật tư
                  </small>
                </div>
              )}

              <div className="warehouse-release-actual-table-card">
                <div className="warehouse-release-actual-table-title">
                  <div>
                    <strong>
                      Danh sách hàng hóa xuất
                    </strong>
                    <span>
                      {items.length} mặt hàng
                    </span>
                  </div>

                  <div className="warehouse-release-actual-total-summary">
                    <span>
                      Yêu cầu:
                      <strong>
                        {formatViNumber(
                          totalRequested,
                          2
                        )}
                      </strong>
                    </span>

                    <span>
                      Thực xuất:
                      <strong>
                        {formatViNumber(
                          totalActual,
                          2
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="warehouse-release-actual-table-wrap">
                  <table className="warehouse-release-actual-table">
                    <colgroup>
                      <col className="warehouse-release-actual-col-stt" />
                      <col className="warehouse-release-actual-col-code" />
                      <col className="warehouse-release-actual-col-name" />
                      <col className="warehouse-release-actual-col-unit" />
                      <col className="warehouse-release-actual-col-ratio" />
                      <col className="warehouse-release-actual-col-requested" />
                      <col className="warehouse-release-actual-col-actual" />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Mã VT</th>
                        <th>Tên hàng</th>
                        <th>ĐVT</th>
                        <th>Tỷ lệ chuyển đổi</th>
                        <th>SL yêu cầu</th>
                        <th>SL thực xuất</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!items.length && (
                        <tr>
                          <td
                            className="warehouse-release-actual-empty"
                            colSpan={7}
                          >
                            Không có chi tiết hàng hóa
                          </td>
                        </tr>
                      )}

                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>

                          <td>
                            <strong className="warehouse-release-actual-goods-code">
                              {item.goods_code || "-"}
                            </strong>
                          </td>

                          <td
                            className="warehouse-release-actual-goods-name"
                            title={item.goods_name || ""}
                          >
                            {item.goods_name || "-"}
                          </td>

                          <td>
                            {item.goods_unit_name || "-"}
                          </td>

                          <td className="number-col">
                            {formatViNumber(
                              item.conversion_ratio,
                              3
                            )}
                          </td>

                          <td className="number-col warehouse-release-requested-quantity">
                            {item.requested_quantity}
                          </td>

                          <td className="number-col">
                            <input
                              className="warehouse-release-actual-input"
                              value={item.actual_quantity}
                              onChange={(event) =>
                                handleChangeActualQuantity(
                                  item.id,
                                  event.target.value
                                )
                              }
                              disabled={!canSaveActual}
                            />
                          </td>
                        </tr>
                      ))}

                      {!!items.length && (
                        <tr className="warehouse-release-total-row">
                          <td colSpan={5}>
                            Tổng
                          </td>

                          <td className="number-col">
                            {formatViNumber(
                              totalRequested,
                              2
                            )}
                          </td>

                          <td className="number-col">
                            {formatViNumber(
                              totalActual,
                              2
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="warehouse-release-modal-footer warehouse-release-actual-modal-footer">
              <button
                type="button"
                onClick={closeActualModal}
                disabled={saving || completing}
              >
                Hủy
              </button>

              {canSaveActual && (
                <button
                  type="button"
                  className="primary"
                  onClick={handleSaveActualQuantity}
                  disabled={saving || completing}
                >
                  <RiSave3Line />

                  {saving
                    ? "Đang lưu..."
                    : "Lưu SL thực xuất"}
                </button>
              )}

              {(canComplete || canSaveActual) && (
                <button
                  type="button"
                  className="success"
                  onClick={handleCompleteRelease}
                  disabled={saving || completing}
                >
                  {completing ? (
                    <RiLoader4Line className="spin" />
                  ) : (
                    <RiCheckboxCircleLine />
                  )}

                  {completing
                    ? "Đang hoàn thành..."
                    : "Hoàn thành"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WarehouseReleaseActualModal;
