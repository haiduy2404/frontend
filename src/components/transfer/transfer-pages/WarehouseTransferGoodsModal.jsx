import { RiCloseLine } from "react-icons/ri";

import {
  formatQuantity,
  getItemActualQuantity,
  getItemCode,
  getItemName,
  getItemRequestedQuantity,
  getItemUnit,
} from "./utils/warehouseTransferUtils";

export default function WarehouseTransferGoodsModal({
  open,
  detail,
  onClose,
}) {
  if (!open || !detail) return null;

  return (
    <div
      className="warehouse-transfer-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="warehouse-transfer-goods-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="warehouse-transfer-modal-header">
          <div>
            <h2>Chi tiết hàng hóa</h2>
            <p>Phiếu điều chuyển {detail.code}</p>
          </div>

          <button
            type="button"
            className="warehouse-transfer-modal-close"
            onClick={onClose}
          >
            <RiCloseLine />
          </button>
        </div>

        <div className="warehouse-transfer-modal-body">
          <div className="warehouse-transfer-goods-table-wrap">
            <table className="warehouse-transfer-goods-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã hàng</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th className="number">SL điều chuyển</th>
                  <th className="number">
                    SL điều chuyển theo ĐVT chính
                  </th>
                </tr>
              </thead>

              <tbody>
                {detail.items.map((item, index) => (
                  <tr
                    key={
                      item.id ||
                      `${getItemCode(item)}-${index}`
                    }
                  >
                    <td>{index + 1}</td>

                    <td>{getItemCode(item)}</td>

                    <td>{getItemName(item)}</td>

                    <td>{getItemUnit(item)}</td>

                    <td className="number">
                      {formatQuantity(
                        getItemRequestedQuantity(item)
                      )}
                    </td>

                    <td className="number">
                      {formatQuantity(
                        getItemActualQuantity(item)
                      )}
                    </td>
                  </tr>
                ))}

                {detail.items.length === 0 && (
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
            </table>
          </div>
        </div>

        <div className="warehouse-transfer-modal-footer">
          <button
            type="button"
            className="warehouse-transfer-outline-btn"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}