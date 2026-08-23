import {
  useEffect,
} from "react";

import {
  RiCloseLine,
} from "react-icons/ri";

import ImportOrderDetailTable from "./ImportOrderDetailTable";
import ImportOrderDetailMoneySummary from "./ImportOrderDetailMoneySummary";

function ImportOrderGoodsDetailModal({
  open,
  onClose,

  selectedRow,

  detailSearch,
  onDetailSearchChange,

  detailLoading,

  detailRows,
  filteredDetailRows,

  detailTotalAmount,

  detailVat0Amount,
  detailVat5Amount,
  detailVat8Amount,
  detailVat10Amount,

  detailGrandTotal,

  parseMoney,
  formatViNumber,
  formatViQuantity,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown =
      (event) => {
        if (
          event.key === "Escape"
        ) {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="import-order-goods-modal-overlay"
      onMouseDown={
        onClose
      }
    >
      <div
        className="import-order-goods-modal"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {/* ================================
            HEADER
        ================================ */}
        <div className="import-order-goods-modal-header">
          <div>
            <h2>
              Chi tiết hàng hóa
            </h2>

            <span>
              Phiếu nhập:{" "}
              <strong>
                {selectedRow?.code ||
                  "-"}
              </strong>
            </span>
          </div>

          <button
            type="button"
            className="import-order-goods-modal-close"
            onClick={
              onClose
            }
            title="Đóng"
          >
            <RiCloseLine />
          </button>
        </div>

        {/* ================================
            BODY
        ================================ */}
        <div className="import-order-goods-modal-body">
          <div className="import-order-goods-modal-toolbar">
            <div className="detail-search">
              <span>🔍</span>

              <input
                placeholder="Tìm mã hàng, tên hàng, ĐVT"
                value={
                  detailSearch
                }
                onChange={(
                  event
                ) =>
                  onDetailSearchChange(
                    event.target
                      .value
                  )
                }
              />
            </div>

            <div className="import-order-goods-modal-count">
              Tổng{" "}
              <strong>
                {
                  filteredDetailRows.length
                }
              </strong>{" "}
              mặt hàng
            </div>
          </div>

          {/* BẢNG ĐẦY ĐỦ - KHÔNG BỎ CỘT */}
          <div className="import-order-goods-modal-table">
            <ImportOrderDetailTable
              detailLoading={
                detailLoading
              }
              detailRows={
                detailRows
              }
              filteredDetailRows={
                filteredDetailRows
              }
              detailTotalAmount={
                detailTotalAmount
              }
              parseMoney={
                parseMoney
              }
              formatViNumber={
                formatViNumber
              }
              formatViQuantity={
                formatViQuantity
              }
            />
          </div>

          {/* SUMMARY TIỀN */}
          <div className="import-order-goods-modal-bottom">
            <div className="import-order-goods-modal-row-count">
              Tổng số:{" "}
              <strong>
                {
                  filteredDetailRows.length
                }
              </strong>
            </div>

            <ImportOrderDetailMoneySummary
              detailLoading={
                detailLoading
              }
              detailRowCount={
                detailRows.length
              }
              detailTotalAmount={
                detailTotalAmount
              }
              detailVat0Amount={
                detailVat0Amount
              }
              detailVat5Amount={
                detailVat5Amount
              }
              detailVat8Amount={
                detailVat8Amount
              }
              detailVat10Amount={
                detailVat10Amount
              }
              detailGrandTotal={
                detailGrandTotal
              }
              formatViNumber={
                formatViNumber
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportOrderGoodsDetailModal;