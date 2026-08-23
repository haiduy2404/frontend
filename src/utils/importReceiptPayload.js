import { convertDateToISO } from "./dateUtils";

const parseConversionRatio = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 1;
  }

  if (typeof value === "number") {
    return value;
  }

  const text = String(value).trim();

  if (text.includes(",")) {
    return Number(
      text
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  // Dạng 1.000 / 10.000 / 100.000
  // hiểu là hàng nghìn kiểu VN
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(
      text.replace(/\./g, "")
    );
  }

  return Number(text);
};

export const buildImportReceiptPayload = ({
  headerData,
  items,
  deletedItems,
  status,
  parseNumber,
  vatAmountSummary,
}) => {
  const inventoryPayloadItems = [
    ...items.map((item) => ({
      ...item,
      is_delete: false,
    })),

    ...deletedItems.map((item) => ({
      ...item,
      is_delete: true,
    })),
  ];

  return {
    terms:
      headerData.terms || null,

    receipt_date:
      convertDateToISO(
        headerData.inward_date
      ),

    warehouse_id:
      headerData.warehouse_id,

    delivery_persion:
      headerData.delivery_person || null,

    contract_code:
      headerData.invoice_symbol || null,

    invoice_code:
      headerData.invoice_no || null,

    invoice_date:
      headerData.invoice_date
        ? convertDateToISO(
            headerData.invoice_date
          )
        : null,

    company_code:
      headerData.supplier_code,

    company_name:
      headerData.supplier_name,

    company_address:
      headerData.address || null,

    company_tax_code:
      headerData.tax_code,

    description:
      headerData.description || null,

    inventory: inventoryPayloadItems
      .filter((item) => item.goods_id)
      .map((item, index) => ({
        inventory_id:
          item.inventory_id || null,

        goods_id:
          item.goods_id,

        goods_unit_id:
          item.unit_id || null,

        goods_name_display:
          item.goods_name || null,

        requested_quantity:
          parseNumber(
            item.requested_quantity
          ),

        original_quantity:
          parseNumber(
            item.actual_quantity ||
              item.requested_quantity
          ),

        unit_price:
          parseNumber(
            item.unit_price
          ),

        conversion_ratio:
          parseConversionRatio(
            item.conversion_ratio || 1
          ),

        vat:
          Number(item.vat || 0),

        is_delete:
          Boolean(item.is_delete),

        sort_order:
          index + 1,
      })),

    bank_account_id:
      headerData.bank_account_id || null,

    bank_name:
      headerData.bank_account_name.trim(),

    bank_account_name:
      headerData.bank_account_name.trim(),

    bank_account_number:
      headerData.bank_account_number.trim(),

    vat_amount_summary:
      vatAmountSummary,

    status,
  };
};