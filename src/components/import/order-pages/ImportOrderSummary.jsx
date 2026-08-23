function ImportOrderSummary({
  selectedRow,

  detailRows,
  detailGrandTotal,

  formatViNumber,
}) {
  if (!selectedRow) {
    return null;
  }

  const getSupplierName = () =>
    selectedRow.supplier_name ||
    selectedRow.vendor_name ||
    selectedRow.partner_name ||
    selectedRow.company_name ||
    selectedRow.supplier?.name ||
    "-";

  const getSupplierTaxCode = () =>
    selectedRow.supplier_tax_code ||
    selectedRow.tax_code ||
    selectedRow.supplier?.tax_code ||
    "-";

  const getWarehouseName = () =>
    selectedRow.warehouse_name ||
    selectedRow.warehouse?.name ||
    selectedRow.warehouse ||
    "-";

  const getWarehouseCode = () =>
    selectedRow.warehouse_code ||
    selectedRow.warehouse?.code ||
    "-";

  const getInvoiceCode = () =>
    selectedRow.invoice_code ||
    selectedRow.invoice_number ||
    selectedRow.invoice_no ||
    selectedRow.contract_code ||
    "-";

  const getCreatorName = () =>
    selectedRow.created_by_admin_name ||
    selectedRow.created_by?.name ||
    selectedRow.creator_name ||
    selectedRow.importer ||
    "-";

  const getCreatorDepartment = () =>
    selectedRow.department_name ||
    selectedRow.department?.name ||
    selectedRow.created_by?.department_name ||
    "-";

  const totalQuantity =
    detailRows.reduce(
      (total, row) => {
        const quantity =
          Number(
            row.actual_quantity ??
            row.received_quantity ??
            row.original_quantity ??
            row.quantity ??
            0
          );

        return (
          total +
          (
            Number.isFinite(
              quantity
            )
              ? quantity
              : 0
          )
        );
      },
      0
    );

  const formatMoney = (value) => {
    const number =
      Number(value || 0);

    return (
      number.toLocaleString(
        "vi-VN"
      ) + " VND"
    );
  };

  return (
    <div className="import-order-summary-grid">
      {/* TỔNG GIÁ TRỊ */}
      <div className="import-order-summary-item total">
        <div className="import-order-summary-label">
          Tổng giá trị nhập
        </div>

        <div className="import-order-summary-total">
          {formatMoney(
            detailGrandTotal
          )}
        </div>

        <div className="import-order-summary-sub">
          Tổng SL:{" "}
          <strong>
            {formatViNumber
              ? formatViNumber(
                  totalQuantity
                )
              : totalQuantity}
          </strong>

          <span>•</span>

          <span>
            {detailRows.length} mặt hàng
          </span>
        </div>
      </div>

      {/* MÃ HÓA ĐƠN */}
      <div className="import-order-summary-item">
        <div className="import-order-summary-label">
          Mã hóa đơn
        </div>

        <div className="import-order-summary-value">
          {getInvoiceCode()}
        </div>

        <div className="import-order-summary-sub">
          Ký hiệu:{" "}
          {selectedRow.invoice_symbol ||
            selectedRow.invoice_series ||
            "-"}
        </div>
      </div>

      {/* NHÀ CUNG CẤP */}
      <div className="import-order-summary-item">
        <div className="import-order-summary-label">
          Nhà cung cấp
        </div>

        <div
          className="import-order-summary-value"
          title={
            getSupplierName()
          }
        >
          {getSupplierName()}
        </div>

        <div className="import-order-summary-sub">
          MST:{" "}
          {getSupplierTaxCode()}
        </div>
      </div>

      {/* KHO */}
      <div className="import-order-summary-item">
        <div className="import-order-summary-label">
          Kho nhập
        </div>

        <div
          className="import-order-summary-value"
          title={
            getWarehouseName()
          }
        >
          {getWarehouseName()}
        </div>

        <div className="import-order-summary-sub">
          Mã kho:{" "}
          {getWarehouseCode()}
        </div>
      </div>

      {/* NGƯỜI TẠO */}
      <div className="import-order-summary-item">
        <div className="import-order-summary-label">
          Người tạo
        </div>

        <div className="import-order-summary-value">
          {getCreatorName()}
        </div>

        <div className="import-order-summary-sub">
          Phòng:{" "}
          {getCreatorDepartment()}
        </div>
      </div>
    </div>
  );
}

export default ImportOrderSummary;