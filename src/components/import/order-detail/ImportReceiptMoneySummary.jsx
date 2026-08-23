import {
  formatViNumber,
} from "../../../utils/importReceiptNumber";

const VAT_RATES = [
  "0",
  "5",
  "8",
  "10",
];

function ImportReceiptMoneySummary({
  manualVatSummary,
  vatSummary,
  finalGrandTotal,

  isPrintMode,

  onResetVat,
  onChangeManualVat,
  onBlurManualVat,
}) {
  const canReset =
    manualVatSummary["0"] !== "" ||
    manualVatSummary["5"] !== "" ||
    manualVatSummary["8"] !== "" ||
    manualVatSummary["10"] !== "";

  return (
    <div className="money-summary-wrap">
      {!isPrintMode && (
        <button
          type="button"
          className="recalculate-vat-btn"
          onClick={onResetVat}
          disabled={!canReset}
        >
          Tính lại Thuế
        </button>
      )}

      <div className="money-summary">
        {VAT_RATES.map(
          (rate) => (
            <div
              className="money-row"
              key={rate}
            >
              <span>
                Thuế VAT {rate}%

                {manualVatSummary[
                  rate
                ] !== "" && (
                  <em className="manual-vat-label"></em>
                )}
              </span>

              <div className="money-vat-edit">
                <input
                  value={
                    manualVatSummary[
                      rate
                    ] !== ""
                      ? manualVatSummary[
                          rate
                        ]
                      : formatViNumber(
                          vatSummary[
                            rate
                          ],
                          0
                        )
                  }
                  onChange={(
                    event
                  ) =>
                    onChangeManualVat(
                      rate,
                      event.target
                        .value
                    )
                  }
                  onBlur={(
                    event
                  ) =>
                    onBlurManualVat(
                      rate,
                      event.target
                        .value
                    )
                  }
                  disabled={
                    isPrintMode
                  }
                />
              </div>
            </div>
          )
        )}

        <div className="money-row total">
          <span>Tổng cộng</span>

          <strong>
            {formatViNumber(
              finalGrandTotal,
              0
            )}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default ImportReceiptMoneySummary;