import "../../../styles/ImportOrderPage.css";

function ImportInspectionPrintModal({
  open,

  users = [],
  loading,

  warehouseKeeperName,
  inspectionOpinion,

  onChangeWarehouseKeeper,
  onChangeOpinion,

  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="inspection-print-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="inspection-print-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="inspection-print-modal-header">
          <h3>
            Nhập thêm thông tin
          </h3>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="inspection-print-modal-body">
          <label>
            Người thủ kho
          </label>
            <select
              className="inspection-print-warehouse-select"
              value={
                warehouseKeeperName
              }
              onChange={(event) =>
                onChangeWarehouseKeeper(
                  event.target.value
                )
              }
              disabled={loading}
              autoFocus
            >
              <option value="">
                {loading
                  ? "Đang tải danh sách thủ kho..."
                  : "Chọn người thủ kho"}
              </option>

              {users.map((user) => (
                <option
                  key={
                    user.id ||
                    user.username ||
                    user.full_name
                  }
                  value={
                    user.full_name || ""
                  }
                >
                  {user.full_name || "-"}
                </option>
              ))}
            </select>
          <label className="inspection-opinion-label">
            Ý kiến của Ban kiểm nghiệm
          </label>

          <textarea
            className="inspection-print-opinion"
            value={
              inspectionOpinion
            }
            onChange={(event) =>
              onChangeOpinion(
                event.target.value
              )
            }
            placeholder="Nhập ý kiến của Ban kiểm nghiệm"
            rows={3}
          />
        </div>

        <div className="inspection-print-modal-footer">
          <button
            type="button"
            className="inspection-print-cancel-btn"
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="button"
            className="inspection-print-confirm-btn"
            onClick={onConfirm}
          >
            Đồng ý in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportInspectionPrintModal;