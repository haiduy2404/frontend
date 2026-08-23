import {
  RiEyeLine,
  RiBox3Line,
  RiFileList3Line,
  RiInboxArchiveLine,
} from "react-icons/ri";

function ImportOrderGoodsSummary({
  detailRows = [],

  detailTotalAmount,

  detailVat0Amount,
  detailVat5Amount,
  detailVat8Amount,
  detailVat10Amount,

  detailGrandTotal,

  parseMoney,
  formatViNumber,

  onViewDetail,
}) {
  const toNumber = (value) => {
    if (parseMoney) {
      return parseMoney(value);
    }

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  /* =================================
     TỔNG SỐ LƯỢNG YÊU CẦU
  ================================= */
  const totalRequestedQuantity =
    detailRows.reduce(
      (sum, item) =>
        sum +
        toNumber(
          item.request_quantity ??
            item.requested_quantity ??
            0
        ),
      0
    );

  /* =================================
     TỔNG SỐ LƯỢNG THỰC NHẬP
  ================================= */
  const totalActualQuantity =
    detailRows.reduce(
      (sum, item) =>
        sum +
        toNumber(
          item.original_quantity ??
            0
        ),
      0
    );

  const formatQuantity = (
    value
  ) => {
    if (formatViNumber) {
      return formatViNumber(
        value,
        2
      );
    }

    return toNumber(
      value
    ).toLocaleString(
      "vi-VN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatMoney = (
    value
  ) => {
    if (formatViNumber) {
      return formatViNumber(
        value,
        0
      );
    }

    return toNumber(
      value
    ).toLocaleString(
      "vi-VN",
      {
        maximumFractionDigits: 0,
      }
    );
  };

  return (
    <section className="import-order-goods-summary">
      {/* =================================
          HEADER
      ================================= */}
      <div className="import-order-goods-summary-header">
        <div>
          <h3>
            Hàng hóa
          </h3>

          <span>
            Tổng quan số lượng và
            giá trị hàng hóa của
            phiếu nhập
          </span>
        </div>

        <button
          type="button"
          className="import-order-goods-detail-btn"
          onClick={onViewDetail}
          disabled={
            detailRows.length === 0
          }
        >
          <RiEyeLine />

          <span>
            Xem chi tiết
          </span>
        </button>
      </div>

      {/* =================================
          QUANTITY SUMMARY
      ================================= */}
      <div className="import-order-goods-quantity-grid">
        <div className="import-order-goods-stat">
          <div className="import-order-goods-stat-icon">
            <RiBox3Line />
          </div>

          <div className="import-order-goods-stat-content">
            <span>
              Tổng lượng hàng hóa
            </span>

            <strong>
              {
                detailRows.length
              }
            </strong>

            <small>
              mặt hàng
            </small>
          </div>
        </div>

        <div className="import-order-goods-stat">
          <div className="import-order-goods-stat-icon">
            <RiFileList3Line />
          </div>

          <div className="import-order-goods-stat-content">
            <span>
              Tổng số lượng yêu cầu
            </span>

            <strong>
              {formatQuantity(
                totalRequestedQuantity
              )}
            </strong>
          </div>
        </div>

        <div className="import-order-goods-stat">
          <div className="import-order-goods-stat-icon">
            <RiInboxArchiveLine />
          </div>

          <div className="import-order-goods-stat-content">
            <span>
              Tổng SL thực nhập
            </span>

            <strong>
              {formatQuantity(
                totalActualQuantity
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* =================================
          MONEY SUMMARY
      ================================= */}
      <div className="import-order-goods-money">
        <div className="import-order-goods-money-row pre-total">
        <span>
            Tổng trước thuế
        </span>

        <strong>
            {formatMoney(
            detailTotalAmount
            )}{" "}
            VND
        </strong>
        </div>

        <div className="import-order-goods-money-row">
          <span>
            Thuế VAT 0%
          </span>

          <strong>
            {formatMoney(
              detailVat0Amount
            )}{" "}
            VND
          </strong>
        </div>

        <div className="import-order-goods-money-row">
          <span>
            Thuế VAT 5%
          </span>

          <strong>
            {formatMoney(
              detailVat5Amount
            )}{" "}
            VND
          </strong>
        </div>

        <div className="import-order-goods-money-row">
          <span>
            Thuế VAT 8%
          </span>

          <strong>
            {formatMoney(
              detailVat8Amount
            )}{" "}
            VND
          </strong>
        </div>

        <div className="import-order-goods-money-row">
          <span>
            Thuế VAT 10%
          </span>

          <strong>
            {formatMoney(
              detailVat10Amount
            )}{" "}
            VND
          </strong>
        </div>

        <div className="import-order-goods-money-row grand-total">
          <span>
            Tổng sau thuế
          </span>

          <strong>
            {formatMoney(
              detailGrandTotal
            )}{" "}
            VND
          </strong>
        </div>
      </div>
    </section>
  );
}

export default ImportOrderGoodsSummary;