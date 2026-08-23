import { useState } from "react";

const useImportTransferPrint = ({
  bankAccountOptions = [],
  companyId,
  createBankAccount,
}) => {
  const [
    showPrintReasonModal,
    setShowPrintReasonModal,
  ] = useState(false);

  const [
    printReason,
    setPrintReason,
  ] = useState("");

  const [
    transferBankId,
    setTransferBankId,
  ] = useState("");

  const [
    transferBankName,
    setTransferBankName,
  ] = useState("");

  const [
    transferBankAccountNumber,
    setTransferBankAccountNumber,
  ] = useState("");

  const openTransferPrintModal = (
    headerData
  ) => {
    setPrintReason("");

    setTransferBankId(
      headerData?.bank_account_id ||
        ""
    );

    setTransferBankName(
      headerData
        ?.bank_account_name || ""
    );

    setTransferBankAccountNumber(
      headerData
        ?.bank_account_number || ""
    );

    setShowPrintReasonModal(true);
  };

  const closeTransferPrintModal =
    () => {
      setShowPrintReasonModal(false);
    };

  const selectTransferBank = (
    bankId
  ) => {
    setTransferBankId(bankId);

    const selectedBank =
      bankAccountOptions.find(
        (bank) =>
          String(bank.id) ===
          String(bankId)
      );

    setTransferBankName(
      selectedBank
        ?.bank_account_name || ""
    );

    setTransferBankAccountNumber(
      selectedBank
        ?.bank_account_number || ""
    );
  };

  const changeTransferBankName = (
    value
  ) => {
    setTransferBankName(value);
    setTransferBankId("");
  };

  const changeTransferBankAccountNumber =
    (value) => {
      setTransferBankAccountNumber(
        value
      );

      setTransferBankId("");
    };

  const buildTransferPrintState =
    async () => {
      if (!printReason.trim()) {
        return {
          valid: false,
          message:
            "Vui lòng nhập lý do in phiếu",
          state: null,
        };
      }

      let finalBankId =
        transferBankId;

      let finalBankName =
        transferBankName.trim();

      let finalBankAccountNumber =
        transferBankAccountNumber.trim();

      if (
        !finalBankName ||
        !finalBankAccountNumber
      ) {
        return {
          valid: false,
          message:
            "Vui lòng chọn tài khoản ngân hàng hoặc nhập đầy đủ tài khoản mới",
          state: null,
        };
      }

      const selectedBank =
        bankAccountOptions.find(
          (bank) =>
            String(bank.id) ===
            String(transferBankId)
        );

      if (selectedBank) {
        finalBankId =
          selectedBank.id || "";

        finalBankName =
          selectedBank
            .bank_account_name ||
          "";

        finalBankAccountNumber =
          selectedBank
            .bank_account_number ||
          "";
      } else if (companyId) {
        try {
          const newBank =
            await createBankAccount({
              bankName:
                finalBankName,

              bankAccountNumber:
                finalBankAccountNumber,
            });

          if (newBank) {
            finalBankId =
              newBank.id || "";

            finalBankName =
              newBank
                .bank_account_name ||
              finalBankName;

            finalBankAccountNumber =
              newBank
                .bank_account_number ||
              finalBankAccountNumber;
          }
        } catch (error) {
          console.error(
            "CREATE BANK ACCOUNT ERROR:",
            error.response?.data ||
              error
          );

          // Không lưu được DB
          // vẫn cho phép dùng dữ liệu nhập tay để in.
          finalBankId = "";

          finalBankName =
            transferBankName.trim();

          finalBankAccountNumber =
            transferBankAccountNumber.trim();
        }
      } else {
        finalBankId = "";

        finalBankName =
          transferBankName.trim();

        finalBankAccountNumber =
          transferBankAccountNumber.trim();
      }

      return {
        valid: true,
        message: "",
        state: {
          printReason:
            printReason.trim(),

          transferBankId:
            finalBankId,

          transferBankName:
            finalBankName,

          transferBankAccountNumber:
            finalBankAccountNumber,
        },
      };
    };

  return {
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
  };
};

export default useImportTransferPrint;