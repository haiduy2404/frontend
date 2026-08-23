function ImportOrderDetailMoneySummary({
  detailLoading,
  detailRowCount,

  detailTotalAmount,

  detailVat0Amount,
  detailVat5Amount,
  detailVat8Amount,
  detailVat10Amount,

  detailGrandTotal,

  formatViNumber,
}) {
  if (
    detailLoading ||
    detailRowCount === 0
  ) {
    return null;
  }

  return (
    <div className="import-list-money-summary">
      <div className="money-row">
        <span>Cộng</span>

        <strong>
          {formatViNumber(
            detailTotalAmount,
            0
          )}
        </strong>
      </div>

      <div className="money-row">
        <span>
          Thuế VAT 0%
        </span>

        <strong>
          {formatViNumber(
            detailVat0Amount,
            0
          )}
        </strong>
      </div>

      <div className="money-row">
        <span>
          Thuế VAT 5%
        </span>

        <strong>
          {formatViNumber(
            detailVat5Amount,
            0
          )}
        </strong>
      </div>

      <div className="money-row">
        <span>
          Thuế VAT 8%
        </span>

        <strong>
          {formatViNumber(
            detailVat8Amount,
            0
          )}
        </strong>
      </div>

      <div className="money-row">
        <span>
          Thuế VAT 10%
        </span>

        <strong>
          {formatViNumber(
            detailVat10Amount,
            0
          )}
        </strong>
      </div>

      <div className="money-row total">
        <span>
          Tổng cộng
        </span>

        <strong>
          {formatViNumber(
            detailGrandTotal,
            0
          )}
        </strong>
      </div>
    </div>
  );
}

export default ImportOrderDetailMoneySummary;