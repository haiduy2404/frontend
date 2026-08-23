function WarehouseReleaseSummary({
  selectedRow,
  detailRows,
  parseNumber,
  formatViNumber,
}) {
  if (!selectedRow) return null;

  const totalRequested = detailRows.reduce(
    (sum, item) =>
      sum + parseNumber(item.requested_quantity),
    0
  );

  const totalActual = detailRows.reduce(
    (sum, item) =>
      sum + parseNumber(item.actual_quantity),
    0
  );

  const warehouseName =
    selectedRow.warehouse_name ||
    selectedRow.warehouse?.name ||
    selectedRow.warehouse ||
    "-";

  const receiverUnit =
    selectedRow.receiver_unit?.name ||
    selectedRow.receiver_unit ||
    "-";

  return (
    <section className="warehouse-release-summary-grid">
      <div className="warehouse-release-summary-item total">
        <span>SL YÊU CẦU</span>
        <strong>
          {formatViNumber(totalRequested, 2)}
        </strong>
        <small>{detailRows.length} mặt hàng</small>
      </div>

      <div className="warehouse-release-summary-item actual">
        <span>SL THỰC XUẤT</span>
        <strong>
          {formatViNumber(totalActual, 2)}
        </strong>
        <small>Số lượng đã nhập</small>
      </div>

      <div className="warehouse-release-summary-item">
        <span>KHO XUẤT</span>
        <strong title={warehouseName}>
          {warehouseName}
        </strong>
        <small>Kho thực hiện xuất</small>
      </div>

      <div className="warehouse-release-summary-item">
        <span>ĐƠN VỊ LĨNH</span>
        <strong title={receiverUnit}>
          {receiverUnit}
        </strong>
        <small>Đơn vị nhận vật tư</small>
      </div>
    </section>
  );
}

export default WarehouseReleaseSummary;
