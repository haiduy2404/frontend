import { useState } from "react";
import { RiAddLine } from "react-icons/ri";

import WarehouseTransferGoodsPanel from "./WarehouseTransferGoodsPanel";
import WarehouseTransferGoodsModal from "./WarehouseTransferGoodsModal";
import WarehouseTransferProcessPanel from "./WarehouseTransferProcessPanel";
import WarehouseTransferSidePanel from "./WarehouseTransferSidePanel";

import {
  formatDateTimeVi,
  formatQuantity,
} from "./utils/warehouseTransferUtils";

export default function WarehouseTransferDetailPanel({ detail, actions }) {
  const [goodsModalOpen, setGoodsModalOpen] = useState(false);

  if (!detail) {
    return (
      <section className="warehouse-transfer-detail-empty">
        <div>
          <strong>Chưa có phiếu điều chuyển</strong>
          <span>Chọn một phiếu ở danh sách bên trái để xem chi tiết.</span>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="warehouse-transfer-detail-panel">
        <div className="warehouse-transfer-detail-head">
          <div>
            <div className="warehouse-transfer-detail-code-row">
              <h2>{detail.code}</h2>

              <span
                className={`warehouse-transfer-status-badge ${detail.statusClass}`}
              >
                {detail.statusText}
              </span>
            </div>

            <p>
              ▣ Tạo bởi: <strong>{detail.createdBy}</strong> -{" "}
              {formatDateTimeVi(detail.createdAt)}
            </p>
          </div>

          {actions.canCreate && (
            <button
              type="button"
              className="warehouse-transfer-add-btn"
              onClick={actions.handleAdd}
            >
              <RiAddLine />
              <span>Thêm</span>
            </button>
          )}
        </div>

        <div className="warehouse-transfer-summary-grid">
          <div className="warehouse-transfer-summary-cell warehouse">
            <small>KHO XUẤT</small>

            <div className="warehouse-transfer-warehouse-summary-row">
              <div>
                <strong>{detail.fromWarehouse}</strong>
                <span>Địa chỉ: {detail.fromAddress}</span>
              </div>

              <span className="warehouse-transfer-route-arrow">→</span>
            </div>
          </div>

          <div className="warehouse-transfer-summary-cell warehouse">
            <small>KHO NHẬP</small>
            <strong>{detail.toWarehouse}</strong>
            <span>Địa chỉ: {detail.toAddress}</span>
          </div>

          <div className="warehouse-transfer-summary-cell">
            <small>TỔNG SỐ LƯỢNG</small>
            <strong>{formatQuantity(detail.totalItems)}</strong>
            <span>mặt hàng</span>
          </div>

          <div className="warehouse-transfer-summary-cell">
            <small>TỔNG SL YÊU CẦU</small>
            <strong>{formatQuantity(detail.totalRequested)}</strong>
            <span>Đơn vị tính</span>
          </div>

          <div className="warehouse-transfer-summary-cell">
            <small>NGƯỜI TẠO</small>
            <strong>{detail.createdBy}</strong>
            <span>Lý do: {detail.reason}</span>
          </div>
        </div>

        <div className="warehouse-transfer-detail-content-grid">
          <div className="warehouse-transfer-main-column">
            <WarehouseTransferProcessPanel detail={detail} />

            <WarehouseTransferGoodsPanel
              detail={detail}
              onOpenView={() => setGoodsModalOpen(true)}
            />
          </div>

          <WarehouseTransferSidePanel
            detail={detail}
            actions={actions}
          />
        </div>
      </section>

      <WarehouseTransferGoodsModal
        open={goodsModalOpen}
        detail={detail}
        onClose={() => setGoodsModalOpen(false)}
      />
    </>
  );
}