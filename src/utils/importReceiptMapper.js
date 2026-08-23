import {
  formatISOToViDate,
  getCurrentTerms,
  getTodayViDate,
} from "./dateUtils";

export const createEmptyImportReceiptHeader = () => ({
  terms: getCurrentTerms(),
  inward_date: getTodayViDate(),
  warehouse_id: "",
  delivery_person: "",
  invoice_symbol: "",
  invoice_no: "",
  invoice_date: "",
  supplier_code: "",
  supplier_name: "",
  tax_code: "",
  address: "",
  description: "",
  bank_account_id: "",
  bank_account_name: "",
  bank_account_number: "",
});

export const mapImportReceiptHeader = (data) => ({
  terms: data?.terms || "",

  inward_date:
    formatISOToViDate(data?.receipt_date),

  warehouse_id:
    data?.warehouse_id ||
    data?.warehouse?.id ||
    "",

  delivery_person:
    data?.delivery_persion || "",

  invoice_symbol:
    data?.contract_code || "",

  invoice_no:
    data?.invoice_code || "",

  invoice_date:
    formatISOToViDate(data?.invoice_date),

  supplier_code:
    data?.company?.code || "",

  supplier_name:
    data?.company?.name || "",

  tax_code:
    data?.company?.tax_office_code || "",

  address:
    data?.company?.address ||
    data?.company?.address_tax_office ||
    "",

  description:
    data?.description || "",

  bank_account_id:
    data?.bank_account_id ||
    data?.bank_account?.id ||
    data?.company?.bank_account_id ||
    "",

  bank_account_name:
    data?.bank_account_name ||
    data?.company?.bank_account_name ||
    "",

  bank_account_number:
    data?.bank_account_number ||
    data?.company?.bank_account_number ||
    "",
});

export const createEmptyImportReceiptItem = (
  id = Date.now()
) => ({
  id,
  inventory_id: "",
  goods_id: "",
  goods_code: "",
  goods_name: "",
  unit_id: "",
  unit: "",
  unit_options: [],
  conversion_ratio: "",
  requested_quantity: "1,00000",
  actual_quantity: "0,00000",
  marked_old: false,
  unit_price: "0,00",
  amount: "0,00",
  vat: "0",
  is_delete: false,
});

export const mapImportReceiptItems = (
  data,
  {
    parseNumber,
    formatViNumber,
    formatViQuantity,
  }
) => {
  const lines = Array.isArray(
    data?.inventory_lines
  )
    ? data.inventory_lines
    : [];

  if (lines.length === 0) {
    return [
      createEmptyImportReceiptItem(1),
    ];
  }

  return lines.map((line, index) => {
    const requestedQuantity =
      parseNumber(
        line.request_quantity || 0
      );

    const originalQuantity =
      parseNumber(
        line.original_quantity || 0
      );

    const unitPrice =
      parseNumber(
        line.unit_price || 0
      );

    const selectedUnit =
      Array.isArray(line.units)
        ? line.units.find(
            (unitItem) =>
              String(unitItem.unit_id) ===
              String(line.goods_unit_id)
          )
        : null;

    const unitOptions =
      Array.isArray(line.units)
        ? line.units.map(
            (unitItem) => ({
              unit_id:
                unitItem.unit_id || "",

              unit_name:
                unitItem.unit_name || "",

              conversion_ratio:
                unitItem.conversion_ratio ||
                "",

              last_unit_price:
                unitItem.last_unit_price ||
                0,

              is_default:
                Boolean(
                  unitItem.is_default
                ),
            })
          )
        : [];

    return {
      id:
        line.inventory_id ||
        line.id ||
        index + 1,

      inventory_id:
        line.inventory_id ||
        line.id ||
        "",

      goods_id:
        line.goods_id || "",

      goods_code:
        line.goods_code || "",

      goods_name:
        line.goods_name || "",

      unit_id:
        line.goods_unit_id || "",

      unit:
        selectedUnit?.unit_name ||
        line.unit_name ||
        "",

      unit_options:
        unitOptions,

      conversion_ratio:
        selectedUnit?.conversion_ratio !==
          null &&
        selectedUnit?.conversion_ratio !==
          undefined
          ? String(
              selectedUnit.conversion_ratio
            )
          : "",

      requested_quantity:
        formatViQuantity(
          requestedQuantity
        ),

      actual_quantity:
        formatViQuantity(
          originalQuantity
        ),

      marked_old:
        requestedQuantity ===
        originalQuantity,

      unit_price:
        formatViNumber(
          unitPrice,
          3
        ),

      amount:
        formatViNumber(
          Math.round(
            originalQuantity *
              unitPrice
          ),
          0
        ),

      vat:
        String(
          Number(line.vat || 0)
        ),

      is_delete: false,
    };
  });
};