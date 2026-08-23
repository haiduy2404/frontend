import { useState } from "react";

import { unwrapData } from "../../utils/apiUtils";

import {
  mapImportReceiptHeader,
  mapImportReceiptItems,
} from "../../utils/importReceiptMapper";

import {
  parseNumber,
  formatViNumber,
  formatViQuantity,
} from "../../utils/importReceiptNumber";

import {
  buildImportReceiptPayload,
} from "../../utils/importReceiptPayload";

import {
  validateImportReceipt,
} from "../../utils/importReceiptValidation";

import {
  createWarehouseReceipt,
  updateWarehouseReceipt,
  getWarehouseReceiptByCode,
} from "../../services/warehouseReceiptService";

const useImportReceiptController = ({
  receiptCode,

  headerData,
  items,
  deletedItems,

  setHeaderData,
  setItems,

  loadVatSummary,
  loadCompanyBanks,

  buildVatAmountSummaryPayload,
}) => {
  const [
    receiptId,
    setReceiptId,
  ] = useState(null);

  const loadReceiptDetail = async (
    code
  ) => {
    if (
      !code ||
      code === "new"
    ) {
      return;
    }

    try {
      const response =
        await getWarehouseReceiptByCode(
          code
        );

      const data =
        unwrapData(response);

      setReceiptId(
        data?.id || null
      );

      loadVatSummary(
        data?.vat_amount_summary,
        formatViNumber
      );

      loadCompanyBanks(
        data?.company
      );

      setHeaderData(
        mapImportReceiptHeader(data)
      );

      setItems(
        mapImportReceiptItems(
          data,
          {
            parseNumber,
            formatViNumber,
            formatViQuantity,
          }
        )
      );

      return data;
    } catch (error) {
      console.error(
        "LOAD RECEIPT DETAIL ERROR:",
        error.response?.data ||
          error
      );

      alert(
        "Không tải được chi tiết phiếu nhập"
      );

      return null;
    }
  };

  const saveReceiptData = async ({
    status,
  }) => {
    const validationMessage =
      validateImportReceipt({
        headerData,
        items,
      });

    if (validationMessage) {
      return {
        saved: false,
        validationMessage,
      };
    }

    const payload =
      buildImportReceiptPayload({
        headerData,
        items,
        deletedItems,
        status,
        parseNumber,

        vatAmountSummary:
          buildVatAmountSummaryPayload(),
      });

    if (
      receiptCode &&
      receiptCode !== "new" &&
      receiptId
    ) {
      await updateWarehouseReceipt(
        receiptId,
        payload
      );
    } else {
      const response =
        await createWarehouseReceipt(
          payload
        );

      const data =
        unwrapData(response);

      if (data?.id) {
        setReceiptId(data.id);
      }
    }

    return {
      saved: true,
      validationMessage: "",
    };
  };

  const resetReceiptController =
    () => {
      setReceiptId(null);
    };

  return {
    receiptId,

    loadReceiptDetail,
    saveReceiptData,

    resetReceiptController,
  };
};

export default useImportReceiptController;