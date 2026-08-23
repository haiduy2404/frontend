import { RiCloseLine } from "react-icons/ri";

function ImportReceiptPageHeader({
  id,
  isCreateMode,
  onClose,
}) {
  return (
    <div className="import-order-detail-header">
      <div className="detail-header-left">
        <h2>
          {isCreateMode
            ? "Lệnh nhập kho mua hàng"
            : `Lệnh nhập kho mua hàng ${id}`}
        </h2>

        <select
          className="header-select"
          defaultValue="purchase"
        >
          <option value="purchase">
            Nhập kho mua hàng
          </option>

          <option value="goods">
            Nhập kho hàng hóa
          </option>
        </select>
      </div>

      <div className="detail-header-actions">
        <button
          className="header-icon-btn"
          onClick={onClose}
        >
          <RiCloseLine />
        </button>
      </div>
    </div>
  );
}

export default ImportReceiptPageHeader;