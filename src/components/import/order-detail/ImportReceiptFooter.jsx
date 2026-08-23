import {
  RiPrinterLine,
} from "react-icons/ri";

function ImportReceiptFooter({
  isPrintMode,

  canSave,
  canComplete,

  canPrintReceipt,
  canPrintTransfer,

  onCancel,

  onSaveAndAdd,
  onSaveDraft,
  onComplete,

  onPrintReceipt,
  onPrintTransfer,
}) {
  return (
    <div className="import-order-detail-footer">
      <button
        className="cancel-footer-btn"
        onClick={onCancel}
      >
        {isPrintMode
          ? "Quay lại"
          : "Hủy"}
      </button>

      {!isPrintMode &&
        canSave && (
          <button
            className="save-draft-btn"
            onClick={
              onSaveAndAdd
            }
          >
            Lưu và thêm
          </button>
        )}

      {isPrintMode ? (
        <>
        </>
      ) : (
        <>
          {canSave && (
            <button
              className="save-draft-btn"
              onClick={
                onSaveDraft
              }
            >
              Lưu tạm
            </button>
          )}

          {canComplete && (
            <button
              className="complete-btn"
              onClick={
                onComplete
              }
            >
              Hoàn thành
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default ImportReceiptFooter;