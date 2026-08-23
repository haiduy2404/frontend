import { RiCloseLine } from "react-icons/ri";

function ReleaseOrderGoodsDetailModal({
  open,
  onClose,
  detailSearch,
  onDetailSearchChange,
  detailLoading,
  detailRows,
  filteredDetailRows,
  parseNumber,
  formatViNumber,
}) {
  if (!open) return null;

  return (
    <div className="release-order-goods-modal-overlay" onMouseDown={onClose}>
      <div
        className="release-order-goods-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="release-order-goods-modal-header">
          <div>
            <h3>Chi tiết hàng hóa xuất kho</h3>
            <span>Tổng số: {detailRows.length}</span>
          </div>
          <button type="button" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>

        <div className="release-order-goods-modal-search">
          <span>🔍</span>
          <input
            placeholder="Tìm mã hàng, tên hàng, đơn vị tính"
            value={detailSearch}
            onChange={(event) => onDetailSearchChange(event.target.value)}
          />
        </div>

        <div className="release-order-goods-modal-table-wrapper">
          <table className="release-order-goods-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mã hàng</th>
                <th>Tên hàng</th>
                <th>ĐVT</th>
                <th>Tỷ lệ chuyển đổi</th>
                <th>SL yêu cầu</th>
              </tr>
            </thead>
            <tbody>
              {detailLoading && (
                <tr>
                  <td colSpan={6}>Đang tải chi tiết...</td>
                </tr>
              )}

              {!detailLoading && filteredDetailRows.length === 0 && (
                <tr>
                  <td colSpan={6}>Không tìm thấy hàng hóa phù hợp</td>
                </tr>
              )}

              {!detailLoading &&
                filteredDetailRows.map((item, index) => {
                  const requestedQuantity = parseNumber(item.requested_quantity);
                  const conversionRatio =
                    item.conversion_ratio ??
                    item.goods_conversion_ratio ??
                    item.unit_conversion_ratio ??
                    item.goods_unit?.conversion_ratio ??
                    item.conversion_rate ??
                    1;

                  return (
                    <tr key={item.release_inventory_id || item.goods_id || index}>
                      <td>{index + 1}</td>
                      <td>{item.goods_code || ""}</td>
                      <td>{item.goods_name || ""}</td>
                      <td>{item.goods_unit_name || ""}</td>
                      <td className="release-order-number-col">
                        {formatViNumber(conversionRatio, 3)}
                      </td>
                      <td className="release-order-number-col">
                        {formatViNumber(requestedQuantity, 2)}
                      </td>
                    </tr>
                  );
                })}

              {!detailLoading && filteredDetailRows.length > 0 && (
                <tr className="release-order-goods-total-row">
                  <td colSpan={5}>Tổng</td>
                  <td className="release-order-number-col">
                    {formatViNumber(
                      filteredDetailRows.reduce(
                        (sum, item) =>
                          sum + parseNumber(item.requested_quantity || 0),
                        0
                      ),
                      2
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="release-order-goods-modal-footer">
          <div>
            Tổng số: <strong>{filteredDetailRows.length}</strong>
          </div>
          <div>
            <span>Số dòng/trang</span>
            <select defaultValue={20}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <strong>
              {filteredDetailRows.length > 0 ? 1 : 0} - {filteredDetailRows.length}
            </strong>
            <button type="button" disabled>‹</button>
            <button type="button" disabled>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseOrderGoodsDetailModal;
