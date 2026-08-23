import { useMemo, useState } from "react";
import { calculateImportOrderTotals } from "../../utils/importOrderTotals";

const EMPTY_VAT_SUMMARY = {
  0: "",
  5: "",
  8: "",
  10: "",
};

const VAT_RATES = ["0", "5", "8", "10"];

const useImportReceiptVat = (
  items,
  parseNumber
) => {
  const [manualVatSummary, setManualVatSummary] =
    useState({
      ...EMPTY_VAT_SUMMARY,
    });

  const {
    totalAmount,
    vatSummary,
  } = useMemo(
    () =>
      calculateImportOrderTotals(items, {
        getQty: (item) =>
          parseNumber(item.actual_quantity),

        getPrice: (item) =>
          parseNumber(item.unit_price),

        getVat: (item) =>
          String(item.vat || "0"),
      }),
    [items, parseNumber]
  );

  const getFinalVat = (rate) => {
    if (manualVatSummary[rate] !== "") {
      return parseNumber(
        manualVatSummary[rate],
        {
          viThousands: true,
        }
      );
    }

    return parseNumber(
      vatSummary[rate] || 0
    );
  };

  const finalVat0 = getFinalVat("0");
  const finalVat5 = getFinalVat("5");
  const finalVat8 = getFinalVat("8");
  const finalVat10 = getFinalVat("10");

  const finalVatAmount =
    finalVat0 +
    finalVat5 +
    finalVat8 +
    finalVat10;

  const finalGrandTotal = Math.round(
    totalAmount + finalVatAmount
  );

  const buildVatAmountSummaryPayload = () => ({
    vat0amount: Math.round(finalVat0),
    vat5amount: Math.round(finalVat5),
    vat8amount: Math.round(finalVat8),
    vat10amount: Math.round(finalVat10),
  });

  const handleChangeManualVat = (
    rate,
    value
  ) => {
    setManualVatSummary((prev) => ({
      ...prev,
      [rate]: value,
    }));
  };

  const handleBlurManualVat = (
    rate,
    value
  ) => {
    const text = String(
      value || ""
    ).trim();

    if (!text) {
      setManualVatSummary((prev) => ({
        ...prev,
        [rate]: "",
      }));

      return;
    }

    const formatted = parseNumber(
      text,
      {
        viThousands: true,
      }
    ).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    setManualVatSummary((prev) => ({
      ...prev,
      [rate]: formatted,
    }));
  };

  const resetVat = () => {
    setManualVatSummary({
      ...EMPTY_VAT_SUMMARY,
    });
  };

  const loadVatSummary = (
    vatAmountSummary,
    formatViNumber
  ) => {
    const summary =
      vatAmountSummary || {};

    const nextSummary = {};

    VAT_RATES.forEach((rate) => {
      const key = `vat${rate}amount`;
      const value = summary[key];

      nextSummary[rate] =
        value !== null &&
        value !== undefined
          ? formatViNumber(value, 0)
          : "";
    });

    setManualVatSummary(nextSummary);
  };

  return {
    manualVatSummary,

    totalAmount,
    vatSummary,

    finalVat0,
    finalVat5,
    finalVat8,
    finalVat10,
    finalVatAmount,
    finalGrandTotal,

    buildVatAmountSummaryPayload,

    handleChangeManualVat,
    handleBlurManualVat,

    resetVat,
    loadVatSummary,
  };
};

export default useImportReceiptVat;