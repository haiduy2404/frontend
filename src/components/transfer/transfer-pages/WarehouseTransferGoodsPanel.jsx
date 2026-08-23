import {
  formatQuantity,
  getItemCode,
  getItemName,
  getItemTransferQuantity,
  getItemMainQuantity,
  getItemUnit,
} from "./utils/warehouseTransferUtils";

export default function WarehouseTransferGoodsPanel({
  detail,
  onOpenView,
}) {
  const items = Array.isArray(detail?.items)
    ? detail.items
    : [];

  return (
    <section className="warehouse-transfer-card warehouse-transfer-goods-card">
      <div className="warehouse-transfer-section-title-row">
        <div>
          <h3>HÀNG HÓA</h3>
          <p>
            Danh sách hàng hóa trong phiếu điều chuyển
          </p>
        </div>

        <button
          type="button"
          className="warehouse-transfer-outline-btn"
          onClick={onOpenView}
        >
          ◉ Xem chi tiết
        </button>
      </div>

      <div className="warehouse-transfer-goods-summary">
        <div className="warehouse-transfer-mini-stat">
          <span className="warehouse-transfer-mini-icon">
            ▣
          </span>

          <div>
            <small>Tổng số mặt hàng</small>

            <strong>
              {formatQuantity(detail.totalItems)}
            </strong>

            <span>mặt hàng</span>
          </div>
        </div>

        <div className="warehouse-transfer-mini-stat">
          <span className="warehouse-transfer-mini-icon">
            ♙
          </span>

          <div>
            <small>Tổng SL điều chuyển</small>

            <strong>
              {formatQuantity(detail.totalRequested)}
            </strong>

            <span>Đơn vị tính</span>
          </div>
        </div>

        <div className="warehouse-transfer-mini-stat">
          <span className="warehouse-transfer-mini-icon">
            ▤
          </span>

          <div>
            <small>Tổng SL theo ĐVT chính</small>

            <strong>
              {formatQuantity(detail.totalActual)}
            </strong>

            <span>Đơn vị tính chính</span>
          </div>
        </div>
      </div>

      <div className="warehouse-transfer-goods-table-wrap">
        <table className="warehouse-transfer-goods-table">
          <thead>
            <tr>
              <th>#</th>

              <th>Mã hàng</th>

              <th>Tên hàng</th>

              <th>ĐVT</th>

              <th className="number">
                SL điều chuyển
              </th>

              <th className="number">
                SL điều chuyển theo ĐVT chính
              </th>
            </tr>
          </thead>

          <tbody>
            {items
              .slice(0, 5)
              .map((item, index) => (
                <tr
                  key={
                    item.id ||
                    item.item_id ||
                    `${getItemCode(item)}-${index}`
                  }
                >
                  <td>{index + 1}</td>

                  <td>
                    {getItemCode(item)}
                  </td>

                  <td>
                    {getItemName(item)}
                  </td>

                  <td>
                    {getItemUnit(item)}
                  </td>

                  <td className="number">
                    {formatQuantity(
                      getItemTransferQuantity(item)
                    )}
                  </td>

                  <td className="number">
                    {formatQuantity(
                      getItemMainQuantity(item)
                    )}
                  </td>
                </tr>
              ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="warehouse-transfer-empty-table"
                >
                  Chưa có hàng hóa trong phiếu điều chuyển.
                </td>
              </tr>
            )}
          </tbody>

          {items.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="4">
                  Tổng cộng
                </td>

                <td className="number">
                  {formatQuantity(
                    detail.totalRequested
                  )}
                </td>

                <td className="number">
                  {formatQuantity(
                    detail.totalActual
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}