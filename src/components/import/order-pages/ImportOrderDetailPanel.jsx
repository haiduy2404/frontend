import {
  useState,
} from "react";

import ImportOrderWorkflow from "./ImportOrderWorkflow.jsx";
import ImportOrderDetailHeader from "./ImportOrderDetailHeader.jsx";
import ImportOrderSummary from "./ImportOrderSummary.jsx";
import ImportOrderSidePanel from "./ImportOrderSidePanel.jsx";

import ImportOrderGoodsSummary from "./ImportOrderGoodsSummary.jsx";
import ImportOrderGoodsDetailModal from "./ImportOrderGoodsDetailModal.jsx";

import ImportOrderInspectionModal from "./ImportOrderInspectionModal.jsx";

import useImportOrderInspectionController from "./controllers/useImportOrderInspectionController.jsx";

import useImportOrderPrintController
  from "./controllers/useImportOrderPrintController.jsx";

import ImportTransferPrintModal
  from "../order-detail/ImportTransferPrintModal.jsx";

import ImportReceiptSignerModal
  from "../order-detail/ImportReceiptSignerModal.jsx";

import ImportInspectionPrintModal
  from "./ImportInspectionPrintModal.jsx";

function ImportOrderDetailPanel({
  selectedRow,
  getReceiptStatusText,

  canCreate,
  onAdd,

  completing,
  rejecting,

  canApprove,
  onApprove,

  canUpdate,
  onReject,
  canDelete,

  onEdit,
  onDelete,

  /*
   * Callback này sẽ được ImportOrderPage truyền xuống.
   * Sau khi Hoàn thành kiểm nghiệm:
   * refresh list + detail hiện tại.
   */
  onInspectionCompleted,

  detailSearch,
  onPrintTransfer,
  onPrintReceipt,
  onPrintInspection,
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
  /* =========================================================
     GOODS MODAL
     ========================================================= */

  const [
    goodsModalOpen,
    setGoodsModalOpen,
  ] = useState(false);


  /* =========================================================
     INSPECTION
     ========================================================= */

  const inspection =
    useImportOrderInspectionController({
      selectedRow,

      onCompleted:
        async () => {
          if (
            typeof onInspectionCompleted ===
            "function"
          ) {
            await onInspectionCompleted();
          }
        },
    });

  const print =
  useImportOrderPrintController({
    selectedRow,
  });


  return (
    <div className="warehouse-import-detail">
      {/* =================================
          HEADER
      ================================= */}
      <ImportOrderDetailHeader
        selectedRow={
          selectedRow
        }

        getReceiptStatusText={
          getReceiptStatusText
        }

        canCreate={
          canCreate
        }

        onAdd={
          onAdd
        }
      />


      {/* =================================
          SUMMARY
      ================================= */}
      <ImportOrderSummary
        selectedRow={
          selectedRow
        }

        detailRows={
          detailRows
        }

        detailGrandTotal={
          detailGrandTotal
        }

        formatViNumber={
          formatViNumber
        }
      />


      {/* =================================
          BODY
      ================================= */}
      <div className="import-order-detail-body-layout">
        <div className="import-order-detail-main-content">
          {/* =============================
              WORKFLOW
          ============================= */}
          <ImportOrderWorkflow
            selectedRow={
              selectedRow
            }

            approving={
              completing
            }

            canApprove={
              canApprove
            }

            onApprove={
              onApprove
            }
          />


          {/* =============================
              GOODS SUMMARY
          ============================= */}
          <ImportOrderGoodsSummary
            detailRows={
              detailRows
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

            parseMoney={
              parseMoney
            }

            formatViNumber={
              formatViNumber
            }

            onViewDetail={() =>
              setGoodsModalOpen(
                true
              )
            }
          />
        </div>


        <ImportOrderSidePanel
          selectedRow={selectedRow}

          completing={completing}
          rejecting={rejecting}

          canApprove={canApprove}
          canUpdate={canUpdate}
          canDelete={canDelete}

          onApprove={onApprove}
          onEdit={onEdit}
          onDelete={onDelete}
          onReject={onReject}

          onInspection={
            inspection.openInspection
          }

          /* PRINT */
          onPrintTransfer={
            print.openTransfer
          }

          onPrintReceipt={
            print.openReceipt
          }

          onPrintInspection={
            print.openInspection
          }
        />
      </div>


      {/* =================================
          GOODS DETAIL MODAL
      ================================= */}
      <ImportOrderGoodsDetailModal
        open={
          goodsModalOpen
        }

        onClose={() =>
          setGoodsModalOpen(
            false
          )
        }

        selectedRow={
          selectedRow
        }

        detailSearch={
          detailSearch
        }

        onDetailSearchChange={
          onDetailSearchChange
        }

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


      {/* =================================
          INSPECTION MODAL
      ================================= */}
      <ImportOrderInspectionModal
        open={
          inspection.inspectionModalOpen
        }

        onClose={
          inspection.closeInspection
        }

        receiptCode={
          inspection.receiptCode
        }

        inspectionCode={
          inspection.inspectionCode
        }

        rows={
          inspection.inspectionRows
        }

        loading={
          inspection.loadingInspection
        }

        savingAction={
          inspection.savingInspectionAction
        }

        canUpdate={
          inspection.canUpdateInspection
        }

        canComplete={
          inspection.canCompleteInspection
        }

        isReceiptCompleted={
          inspection.isReceiptCompleted
        }

        onChangeAccepted={
          inspection.changeAcceptedQuantity
        }

        onBlurAccepted={
          inspection.blurAcceptedQuantity
        }

        onSaveDraft={
          inspection.saveInspectionDraft
        }

        onComplete={
          inspection.completeInspection
        }
      />
      <ImportTransferPrintModal
        open={
          print.showPrintReasonModal
        }

        headerData={
          print.headerData
        }

        bankAccountOptions={
          print.bankAccountOptions
        }

        transferBankId={
          print.transferBankId
        }

        transferBankName={
          print.transferBankName
        }

        transferBankAccountNumber={
          print.transferBankAccountNumber
        }

        printReason={
          print.printReason
        }

        onSelectBank={
          print.selectTransferBank
        }

        onChangeBankName={
          print.changeTransferBankName
        }

        onChangeBankAccountNumber={
          print.changeTransferBankAccountNumber
        }

        onChangeReason={
          print.setPrintReason
        }

        onClose={
          print.closeTransferPrintModal
        }

        onConfirm={
          print.confirmTransfer
        }
      />

      <ImportReceiptSignerModal
        open={
          print.showReceiptPrintModal
        }

        users={
          print.receiptUsers
        }

        loading={
          print.receiptUsersLoading
        }

        signers={
          print.receiptSigners
        }

        attachedDocumentNumber={
          print.receiptAttachedDocumentNumber
        }

        onChangeSigner={
          print.changeReceiptSigner
        }

        onChangeAttachedDocumentNumber={
          print.setReceiptAttachedDocumentNumber
        }

        onClose={
          print.closeReceiptPrintModal
        }

        onConfirm={
          print.confirmReceipt
        }
      />
      {/* =================================
          INSPECTION PRINT MODAL
      ================================= */}
      <ImportInspectionPrintModal
        open={
          print.showInspectionPrintModal
        }

        users={
          print.warehouseKeeperUsers
        }

        loading={
          print.warehouseKeeperUsersLoading
        }

        warehouseKeeperName={
          print.warehouseKeeperName
        }

        inspectionOpinion={
          print.inspectionOpinion
        }

        onChangeWarehouseKeeper={
          print.setWarehouseKeeperName
        }

        onChangeOpinion={
          print.setInspectionOpinion
        }

        onClose={
          print.closeInspection
        }

        onConfirm={
          print.confirmInspection
        }
      />
    </div>
  );
}


export default ImportOrderDetailPanel;