import {
  useCallback,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../../../contexts/AuthContext";

import {
  getWarehouseReceiptByCode,
} from "../../../../services/warehouseReceiptService";

import {
  unwrapData,
} from "../../../../utils/apiUtils";

import {
  createEmptyImportReceiptHeader,
  mapImportReceiptHeader,
  mapImportReceiptItems,
} from "../../../../utils/importReceiptMapper";

import {
  parseNumber,
  formatViNumber,
  formatViQuantity,
} from "../../../../utils/importReceiptNumber";

import useImportSupplierBank from "../../../../hooks/order-detail/useImportSupplierBank.js";
import useImportReceiptPrint from "../../../../hooks/order-detail/useImportReceiptPrint.js";
import useImportTransferPrint from "../../../../hooks/order-detail/useImportTransferPrint.js";
import {
  getUsersBySignerField,
} from "../../../../utils/signerUtils";

function useImportOrderPrintController({
  selectedRow,
} = {}) {
  const navigate =
    useNavigate();

  const {
    canDo,
  } = useAuth();


  /* =========================================================
     PERMISSION
     ========================================================= */

  const canPrintTransfer =
    canDo(
      "print_transfer_request"
    );

  const canPrintReceipt =
    canDo(
      "print_warehouse_receipt"
    );


  /* =========================================================
     CURRENT RECEIPT
     ========================================================= */

  const receiptCode =
    selectedRow?.code ||
    selectedRow?.receipt_code ||
    selectedRow
      ?.warehouse_receipt_code ||
    selectedRow?.invoice_code ||
    "";


  /* =========================================================
     PRINT DATA
     ========================================================= */

  const [
    headerData,
    setHeaderData,
  ] = useState(
    () =>
      createEmptyImportReceiptHeader()
  );

  const [
    printItems,
    setPrintItems,
  ] = useState([]);

  const [
    loadingPrintData,
    setLoadingPrintData,
  ] = useState(false);


  /* =========================================================
     SUPPLIER / BANK
     ========================================================= */

  const {
    companyId,

    bankAccountOptions,

    loadCompanyBanks,
    createBankAccount,
  } =
    useImportSupplierBank();


  /* =========================================================
     RECEIPT PRINT HOOK
     ========================================================= */

  const {
    showReceiptPrintModal,

    receiptUsers,
    receiptUsersLoading,

    receiptSigners,

    receiptAttachedDocumentNumber,
    setReceiptAttachedDocumentNumber,

    changeReceiptSigner,

    openReceiptPrintModal,
    closeReceiptPrintModal,
    loadReceiptSignerUsers,

    buildReceiptPrintState,
  } =
    useImportReceiptPrint();

const warehouseKeeperUsers =
  getUsersBySignerField(
    receiptUsers,
    "thuKho"
  );

  /* =========================================================
     TRANSFER PRINT HOOK
     ========================================================= */

  const {
    showPrintReasonModal,

    printReason,
    setPrintReason,

    transferBankId,
    transferBankName,
    transferBankAccountNumber,

    openTransferPrintModal,
    closeTransferPrintModal,

    selectTransferBank,

    changeTransferBankName,
    changeTransferBankAccountNumber,

    buildTransferPrintState,
  } =
    useImportTransferPrint({
      bankAccountOptions,
      companyId,
      createBankAccount,
    });


  /* =========================================================
     INSPECTION PRINT
     ========================================================= */

  const [
    showInspectionPrintModal,
    setShowInspectionPrintModal,
  ] = useState(false);

  const [
    warehouseKeeperName,
    setWarehouseKeeperName,
  ] = useState("");

  const [
    inspectionOpinion,
    setInspectionOpinion,
  ] = useState(
    "Số lượng đủ, đạt yêu cầu"
  );


  /* =========================================================
     LOAD PRINT DATA

     Chỉ gọi khi user bấm một trong các nút In.
     Không làm nặng ImportOrderPage khi đổi selectedRow.
     ========================================================= */

  const loadPrintData =
    useCallback(
      async () => {
        if (!receiptCode) {
          alert(
            "Không tìm thấy mã phiếu nhập kho"
          );

          return null;
        }

        try {
          setLoadingPrintData(
            true
          );

          const response =
            await getWarehouseReceiptByCode(
              receiptCode
            );

          const data =
            unwrapData(
              response
            );

          if (!data) {
            alert(
              "Không tải được dữ liệu phiếu nhập kho"
            );

            return null;
          }


          /* =============================
             HEADER
          ============================= */

          const mappedHeader =
            mapImportReceiptHeader(
              data
            );

          setHeaderData(
            mappedHeader
          );


          /* =============================
             GOODS
          ============================= */

          const mappedItems =
            mapImportReceiptItems(
              data,
              {
                parseNumber,
                formatViNumber,
                formatViQuantity,
              }
            );

          setPrintItems(
            mappedItems
          );


          /* =============================
             SUPPLIER BANK
          ============================= */

          loadCompanyBanks(
            data?.company
          );


          return {
            data,
            header:
              mappedHeader,

            items:
              mappedItems,
          };
        } catch (error) {
          console.error(
            "LOAD IMPORT ORDER PRINT DATA ERROR:",
            error.response?.data ||
              error
          );

          alert(
            "Không tải được dữ liệu phục vụ in phiếu"
          );

          return null;
        } finally {
          setLoadingPrintData(
            false
          );
        }
      },
      [
        receiptCode,
        loadCompanyBanks,
      ]
    );


  /* =========================================================
     TRANSFER REQUEST PRINT
     ========================================================= */

  const openTransfer =
    useCallback(
      async () => {
        if (
          !canPrintTransfer
        ) {
          alert(
            "Bạn không có quyền in giấy đề nghị chuyển tiền"
          );

          return;
        }

        if (!receiptCode) {
          alert(
            "Vui lòng chọn phiếu nhập kho cần in"
          );

          return;
        }

        const result =
          await loadPrintData();

        if (!result) {
          return;
        }

        /*
         * Quan trọng:
         * dùng mapped header vừa load,
         * không dùng headerData state ngay vì setState async.
         */
        openTransferPrintModal(
          result.header
        );
      },
      [
        canPrintTransfer,
        receiptCode,
        loadPrintData,
        openTransferPrintModal,
      ]
    );


  const confirmTransfer =
    useCallback(
      async () => {
        if (!receiptCode) {
          return;
        }

        const {
          valid,
          message,
          state,
        } =
          await buildTransferPrintState();

        if (!valid) {
          alert(
            message
          );

          return;
        }

        navigate(
          `/dashboard/activity/import/order/${receiptCode}/transfer-request-print`,
          {
            state: {
              ...state,

              transferTaxCode:
                headerData.tax_code,

              transferCompanyName:
                headerData.supplier_name,

              transferCompanyAddress:
                headerData.address,
            },
          }
        );
      },
      [
        receiptCode,
        buildTransferPrintState,
        navigate,
        headerData,
      ]
    );


  /* =========================================================
     WAREHOUSE RECEIPT PRINT
     ========================================================= */

  const openReceipt =
    useCallback(
      async () => {
        if (
          !canPrintReceipt
        ) {
          alert(
            "Bạn không có quyền in phiếu nhập kho"
          );

          return;
        }

        if (!receiptCode) {
          alert(
            "Vui lòng chọn phiếu nhập kho cần in"
          );

          return;
        }

        const result =
          await loadPrintData();

        if (!result) {
          return;
        }

        /*
         * Hook cũ tự load danh sách người ký.
         */
        await openReceiptPrintModal();
      },
      [
        canPrintReceipt,
        receiptCode,
        loadPrintData,
        openReceiptPrintModal,
      ]
    );


  const confirmReceipt =
    useCallback(
      () => {
        if (!receiptCode) {
          return;
        }

        const {
          valid,
          message,
          state:
            printState,
        } =
          buildReceiptPrintState();

        if (!valid) {
          alert(
            message
          );

          return;
        }


        /*
         * Giữ nguyên logic cũ:
         * có VAT -> mẫu VAT
         * không VAT -> mẫu không VAT
         */
        const hasVat =
          printItems.some(
            (item) =>
              Number(
                item.vat || 0
              ) > 0
          );


        if (hasVat) {
          navigate(
            `/dashboard/activity/import/order/${receiptCode}/receipt-print-vat`,
            {
              state:
                printState,
            }
          );

          return;
        }


        navigate(
          `/dashboard/activity/import/order/${receiptCode}/receipt-print-no-vat`,
          {
            state:
              printState,
          }
        );
      },
      [
        receiptCode,
        buildReceiptPrintState,
        printItems,
        navigate,
      ]
    );


  /* =========================================================
     INSPECTION PRINT
     ========================================================= */

  const openInspection =
    useCallback(
      async () => {
        if (!receiptCode) {
          alert(
            "Vui lòng chọn phiếu nhập kho cần in"
          );

          return;
        }

        setWarehouseKeeperName("");

        setInspectionOpinion(
          "Số lượng đủ, đạt yêu cầu"
        );

        setShowInspectionPrintModal(
          true
        );

        if (
          receiptUsers.length === 0
        ) {
          await loadReceiptSignerUsers();
        }
      },
      [
        receiptCode,
        receiptUsers.length,
        loadReceiptSignerUsers,
      ]
    );


  const closeInspection =
    useCallback(
      () => {
        setShowInspectionPrintModal(
          false
        );
      },
      []
    );


  const confirmInspection =
    useCallback(
      () => {
        if (!receiptCode) {
          alert(
            "Không tìm thấy phiếu nhập kho tham chiếu"
          );

          return;
        }

        if (
          !warehouseKeeperName.trim()
        ) {
          alert(
            "Vui lòng nhập người thủ kho"
          );

          return;
        }

        setShowInspectionPrintModal(
          false
        );

        navigate(
          `/dashboard/activity/import/inspection/${receiptCode}/print`,
          {
            state: {
              warehouseKeeperName:
                warehouseKeeperName.trim(),

              inspectionOpinion:
                inspectionOpinion.trim(),
            },
          }
        );
      },
      [
        receiptCode,
        warehouseKeeperName,
        inspectionOpinion,
        navigate,
      ]
    );


  /* =========================================================
     RETURN
     ========================================================= */

  return {
    /* =========================
       COMMON
    ========================= */

    receiptCode,

    loadingPrintData,

    headerData,
    printItems,


    /* =========================
       TRANSFER
    ========================= */

    canPrintTransfer,

    showPrintReasonModal,

    printReason,

    transferBankId,
    transferBankName,
    transferBankAccountNumber,

    bankAccountOptions,

    openTransfer,
    closeTransferPrintModal,
    confirmTransfer,

    setPrintReason,

    selectTransferBank,

    changeTransferBankName,
    changeTransferBankAccountNumber,


    /* =========================
       RECEIPT
    ========================= */

    canPrintReceipt,

    showReceiptPrintModal,

    receiptUsers,
    receiptUsersLoading,

    receiptSigners,

    receiptAttachedDocumentNumber,

    setReceiptAttachedDocumentNumber,

    changeReceiptSigner,

    openReceipt,
    closeReceiptPrintModal,
    confirmReceipt,


    /* =========================
      INSPECTION
    ========================= */

    showInspectionPrintModal,

    warehouseKeeperUsers,
    warehouseKeeperUsersLoading:
      receiptUsersLoading,

    warehouseKeeperName,
    setWarehouseKeeperName,

    inspectionOpinion,
    setInspectionOpinion,

    openInspection,
    closeInspection,
    confirmInspection,
  };
}


export default useImportOrderPrintController;