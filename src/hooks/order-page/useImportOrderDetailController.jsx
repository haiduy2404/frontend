import {
  useMemo,
  useState,
} from "react";

import {
  getWarehouseReceiptByCode,
} from "../../services/warehouseReceiptService";

import {
  calculateImportOrderTotals,
} from "../../utils/importOrderTotals";

import {
  unwrapData,
} from "../../utils/apiUtils";


const parseMoney = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const text =
    String(value).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    return (
      Number(
        text
          .replace(/\./g, "")
          .replace(",", ".")
      ) || 0
    );
  }

  if (text.includes(",")) {
    return (
      Number(
        text.replace(",", ".")
      ) || 0
    );
  }

  return Number(text) || 0;
};


const formatViNumber = (
  value,
  fractionDigits = 2
) => {
  return parseMoney(
    value
  ).toLocaleString(
    "vi-VN",
    {
      minimumFractionDigits:
        fractionDigits,

      maximumFractionDigits:
        fractionDigits,
    }
  );
};


const formatViQuantity = (
  value
) => {
  return parseMoney(
    value
  ).toLocaleString(
    "vi-VN",
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 5,
    }
  );
};


function useImportOrderDetailController() {
  const [
    detailSearch,
    setDetailSearch,
  ] = useState("");

  const [
    detailRows,
    setDetailRows,
  ] = useState([]);

  const [
    selectedReceiptDetail,
    setSelectedReceiptDetail,
  ] = useState(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);


  /* =========================================================
     FILTER DETAIL
     ========================================================= */

  const filteredDetailRows =
    useMemo(() => {
      const keyword =
        detailSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return detailRows;
      }

      return detailRows.filter(
        (item) => {
          const goodsCode =
            String(
              item.goods_code || ""
            ).toLowerCase();

          const goodsName =
            String(
              item.goods_name || ""
            ).toLowerCase();

          const unitName =
            String(
              item.unit_name || ""
            ).toLowerCase();

          return (
            goodsCode.includes(
              keyword
            ) ||
            goodsName.includes(
              keyword
            ) ||
            unitName.includes(
              keyword
            )
          );
        }
      );
    }, [
      detailRows,
      detailSearch,
    ]);


  /* =========================================================
     LOAD DETAIL
     ========================================================= */

  const fetchImportOrderDetail =
    async (code) => {
      if (!code) {
        setDetailRows([]);

        setSelectedReceiptDetail(
          null
        );

        return;
      }

      try {
        setDetailLoading(true);

        const response =
          await getWarehouseReceiptByCode(
            code
          );

        const data =
          unwrapData(response);

        const rawRows =
          data?.inventory_lines ||
          data?.inventory ||
          data?.items ||
          data?.details ||
          [];

        const mappedRows =
          Array.isArray(rawRows)
            ? rawRows.map(
                (line) => {
                  const selectedUnit =
                    Array.isArray(
                      line.units
                    )
                      ? line.units.find(
                          (unitItem) =>
                            String(
                              unitItem.unit_id
                            ) ===
                            String(
                              line.goods_unit_id
                            )
                        )
                      : null;

                  return {
                    ...line,

                    unit_name:
                      selectedUnit
                        ?.unit_name ||
                      line.unit_name ||
                      "",

                    conversion_ratio:
                      selectedUnit
                        ?.conversion_ratio !==
                        null &&
                      selectedUnit
                        ?.conversion_ratio !==
                        undefined
                        ? String(
                            selectedUnit
                              .conversion_ratio
                          )
                        : line
                              .conversion_ratio !==
                            null &&
                          line
                              .conversion_ratio !==
                            undefined
                        ? String(
                            line
                              .conversion_ratio
                          )
                        : "",
                  };
                }
              )
            : [];

        setSelectedReceiptDetail(
          data
        );

        setDetailRows(
          mappedRows
        );
      } catch (error) {
        console.error(
          "LOAD IMPORT ORDER DETAIL ERROR:",
          error.response?.data ||
            error
        );

        setSelectedReceiptDetail(
          null
        );

        setDetailRows([]);

        alert(
          "Không tải được chi tiết hàng hóa"
        );
      } finally {
        setDetailLoading(false);
      }
    };


  const clearImportOrderDetail =
    () => {
      setDetailRows([]);

      setSelectedReceiptDetail(
        null
      );
    };


  /* =========================================================
     TOTAL
     ========================================================= */

  const {
    totalAmount:
      detailTotalAmount,

    vatSummary:
      detailAutoVatSummary,
  } =
    calculateImportOrderTotals(
      detailRows,
      {
        getQty: (item) =>
          parseMoney(
            item.original_quantity ||
              item.quantity ||
              0
          ),

        getPrice: (item) =>
          parseMoney(
            item.unit_price ||
              0
          ),

        getVat: (item) =>
          String(
            Number(
              item.vat || 0
            )
          ),
      }
    );


  const detailVatAmountSummary =
    selectedReceiptDetail
      ?.vat_amount_summary ||
    {};


  const detailVat0Amount =
    detailVatAmountSummary
      .vat0amount !== null &&
    detailVatAmountSummary
      .vat0amount !== undefined
      ? parseMoney(
          detailVatAmountSummary
            .vat0amount
        )
      : parseMoney(
          detailAutoVatSummary[
            "0"
          ] || 0
        );


  const detailVat5Amount =
    detailVatAmountSummary
      .vat5amount !== null &&
    detailVatAmountSummary
      .vat5amount !== undefined
      ? parseMoney(
          detailVatAmountSummary
            .vat5amount
        )
      : parseMoney(
          detailAutoVatSummary[
            "5"
          ] || 0
        );


  const detailVat8Amount =
    detailVatAmountSummary
      .vat8amount !== null &&
    detailVatAmountSummary
      .vat8amount !== undefined
      ? parseMoney(
          detailVatAmountSummary
            .vat8amount
        )
      : parseMoney(
          detailAutoVatSummary[
            "8"
          ] || 0
        );


  const detailVat10Amount =
    detailVatAmountSummary
      .vat10amount !== null &&
    detailVatAmountSummary
      .vat10amount !== undefined
      ? parseMoney(
          detailVatAmountSummary
            .vat10amount
        )
      : parseMoney(
          detailAutoVatSummary[
            "10"
          ] || 0
        );


  const detailVatTotalAmount =
    detailVat0Amount +
    detailVat5Amount +
    detailVat8Amount +
    detailVat10Amount;


  const detailGrandTotal =
    Math.round(
      detailTotalAmount +
        detailVatTotalAmount
    );


  return {
    detailSearch,
    setDetailSearch,

    detailRows,
    filteredDetailRows,

    selectedReceiptDetail,

    detailLoading,

    fetchImportOrderDetail,
    clearImportOrderDetail,

    detailTotalAmount,

    detailVat0Amount,
    detailVat5Amount,
    detailVat8Amount,
    detailVat10Amount,

    detailGrandTotal,

    parseMoney,
    formatViNumber,
    formatViQuantity,
  };
}


export default useImportOrderDetailController;