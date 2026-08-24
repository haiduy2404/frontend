import {
  useEffect,
  useState,
} from "react";

import { getUserNames } from "../../services/authService";

import {
  IMPORT_RECEIPT_SIGNER_KEYS,
  getSignerFields,
  prepareSignerUsers,
} from "../../utils/signerUtils";

export const RECEIPT_SIGNER_FIELDS =
  getSignerFields(
    IMPORT_RECEIPT_SIGNER_KEYS
  );

const EMPTY_RECEIPT_SIGNERS =
  Object.fromEntries(
    RECEIPT_SIGNER_FIELDS.map(
      (field) => [
        field.key,
        "",
      ]
    )
  );

const STORAGE_KEY =
  "import-receipt-signers-session";

const getStoredSelection = () => {
  try {
    const rawValue =
      sessionStorage.getItem(
        STORAGE_KEY
      );

    if (!rawValue) {
      return {
        signers: {
          ...EMPTY_RECEIPT_SIGNERS,
        },
        attachedDocumentNumber: "",
      };
    }

    const parsedValue =
      JSON.parse(rawValue);

    return {
      signers: {
        ...EMPTY_RECEIPT_SIGNERS,
        ...(parsedValue?.signers ||
          {}),
      },

      attachedDocumentNumber:
        String(
          parsedValue
            ?.attachedDocumentNumber ||
            ""
        ),
    };
  } catch (error) {
    console.error(
      "READ IMPORT RECEIPT SIGNERS STORAGE ERROR:",
      error
    );

    return {
      signers: {
        ...EMPTY_RECEIPT_SIGNERS,
      },
      attachedDocumentNumber: "",
    };
  }
};

const useImportReceiptPrint = () => {
  const [
    showReceiptPrintModal,
    setShowReceiptPrintModal,
  ] = useState(false);

  const [
    receiptUsers,
    setReceiptUsers,
  ] = useState([]);

  const [
    receiptUsersLoading,
    setReceiptUsersLoading,
  ] = useState(false);

  const [
    receiptSigners,
    setReceiptSigners,
  ] = useState(
    () =>
      getStoredSelection().signers
  );

  const [
    receiptAttachedDocumentNumber,
    setReceiptAttachedDocumentNumber,
  ] = useState(
    () =>
      getStoredSelection()
        .attachedDocumentNumber
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          signers:
            receiptSigners,

          attachedDocumentNumber:
            receiptAttachedDocumentNumber,
        })
      );
    } catch (error) {
      console.error(
        "SAVE IMPORT RECEIPT SIGNERS STORAGE ERROR:",
        error
      );
    }
  }, [
    receiptSigners,
    receiptAttachedDocumentNumber,
  ]);

  const loadReceiptSignerUsers =
    async () => {
      try {
        setReceiptUsersLoading(
          true
        );

        const response =
          await getUserNames();

        setReceiptUsers(
          prepareSignerUsers(
            response
          )
        );
      } catch (error) {
        console.error(
          "LOAD RECEIPT SIGNER USERS ERROR:",
          error.response?.data ||
            error
        );

        setReceiptUsers([]);

        alert(
          error.response?.data
            ?.message ||
            "Không tải được danh sách người ký"
        );
      } finally {
        setReceiptUsersLoading(
          false
        );
      }
    };

  const changeReceiptSigner = (
    key,
    fullName
  ) => {
    setReceiptSigners(
      (previous) => ({
        ...previous,
        [key]: fullName,
      })
    );
  };

  const openReceiptPrintModal =
    async () => {
      setShowReceiptPrintModal(
        true
      );

      if (
        receiptUsers.length === 0
      ) {
        await loadReceiptSignerUsers();
      }
    };

  const closeReceiptPrintModal =
    () => {
      setShowReceiptPrintModal(
        false
      );
    };

  const buildReceiptPrintState =
    () => {
      if (
        !receiptSigners.thuKho
          ?.trim()
      ) {
        return {
          valid: false,
          message:
            "Vui lòng chọn người thủ kho",
          state: null,
        };
      }

      return {
        valid: true,
        message: "",
        state: {
          signerCungTieu:
            receiptSigners.cungTieu
              ?.trim() || "",

          signerThuKho:
            receiptSigners.thuKho
              ?.trim() || "",

          signerVatLieuVien:
            receiptSigners
              .vatLieuVien
              ?.trim() || "",

          signerPhoPhongKHVT:
            receiptSigners
              .phoPhongKHVT
              ?.trim() || "",

          signerTruongPhongKHVT:
            receiptSigners
              .truongPhongKHVT
              ?.trim() || "",

          signerGiamDoc:
            receiptSigners.giamDoc
              ?.trim() || "",

          attachedDocumentNumber:
            receiptAttachedDocumentNumber
              .trim(),
        },
      };
    };

  return {
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
  };
};

export default useImportReceiptPrint;