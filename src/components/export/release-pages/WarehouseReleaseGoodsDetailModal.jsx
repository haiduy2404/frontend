import { RiCloseLine, RiSearchLine } from "react-icons/ri";

function WarehouseReleaseGoodsDetailModal({
  open,
  onClose,

  detailSearch,
  onDetailSearchChange,

  detailLoading,
  filteredDetailRows,

  parseNumber,
  formatViNumber,
}) {
  if (!open) return null;

  const totalRequested = filteredDetailRows.reduce(
    (sum, item) =>
      sum + parseNumber(item.requested_quantity),
    0
  );

  const totalActual = filteredDetailRows.reduce(
    (sum, item) =>
      sum + parseNumber(item.actual_quantity),
    0
  );

  return (
    <div
      className="warehouse-release-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="warehouse-release-goods-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="warehouse-release-modal-header">
          <div>
            <h3>Chi tiết hàng hóa xuất kho</h3>
            <span>
              Tổng số: {filteredDetailRows.length}
            </span>
          </div>

          <button type="button" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>

        <div className="warehouse-release-modal-search">
          <RiSearchLine />
          <input
            placeholder="Tìm mã hàng, tên hàng, đơn vị tính"
            value={detailSearch}
            onChange={onDetailSearchChange}
          />
        </div>

        <div className="warehouse-release-modal-table-wrap">
          <table className="warehouse-release-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã VT</th>
                <th>Tên hàng</th>
                <th>ĐVT</th>
                <th>Tỷ lệ</th>
                <th>SL yêu cầu</th>
                <th>SL thực xuất</th>
              </tr>
            </thead>

            <tbody>
              {detailLoading && (
                <tr>
                  <td colSpan={7}>Đang tải chi tiết...</td>
                </tr>
              )}

              {!detailLoading &&
                filteredDetailRows.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.goods_code || "-"}</td>
                    <td>{item.goods_name || "-"}</td>
                    <td>{item.unit_name || "-"}</td>
                    <td className="number-col">
                      {formatViNumber(
                        item.conversion_ratio || 1,
                        3
                      )}
                    </td>
                    <td className="number-col">
                      {item.requested_quantity}
                    </td>
                    <td className="number-col">
                      {item.actual_quantity || "-"}
                    </td>
                  </tr>
                ))}

              {!detailLoading &&
                filteredDetailRows.length > 0 && (
                  <tr className="warehouse-release-total-row">
                    <td colSpan={5}>Tổng</td>
                    <td className="number-col">
                      {formatViNumber(totalRequested, 2)}
                    </td>
                    <td className="number-col">
                      {formatViNumber(totalActual, 2)}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WarehouseReleaseGoodsDetailModal;
