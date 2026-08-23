function ReleaseOrderSummary({
  selectedRow,
  detailRows,
  parseNumber,
  formatViNumber,
}) {
  if (!selectedRow) {
    return null;
  }


  const totalRequested =
    detailRows.reduce(
      (sum, item) =>
        sum +
        parseNumber(
          item.requested_quantity ||
          0
        ),
      0
    );


  const receiverUnit =
    selectedRow.receiver_unit?.name ||
    selectedRow.receiver_unit_name ||
    selectedRow.receiver_unit ||
    "-";


  const releaseTarget =
    selectedRow.release_target?.name ||
    selectedRow.release_target_name ||
    selectedRow.release_target ||
    "-";


  const warehouseName =
    selectedRow.warehouse_name ||
    selectedRow.warehouse?.name ||
    selectedRow.warehouse ||
    "-";


  return (
    <section className="release-order-summary-grid">
      <div className="release-order-summary-item release-order-summary-total">
        <span>
          TỔNG SỐ LƯỢNG YÊU CẦU
        </span>

        <strong>
          {formatViNumber(
            totalRequested,
            2
          )}
        </strong>

        <small>
          Tổng SL • {detailRows.length} mặt hàng
        </small>
      </div>


      <div className="release-order-summary-item">
        <span>
          ĐỐI TƯỢNG XUẤT KHO
        </span>

        <strong title={releaseTarget}>
          {releaseTarget}
        </strong>

        <small>
          Đối tượng nhận hàng
        </small>
      </div>


      <div className="release-order-summary-item">
        <span>
          ĐƠN VỊ LĨNH
        </span>

        <strong title={receiverUnit}>
          {receiverUnit}
        </strong>

        <small>
          Đơn vị lĩnh vật tư
        </small>
      </div>


      <div className="release-order-summary-item">
        <span>
          KHO XUẤT
        </span>

        <strong title={warehouseName}>
          {warehouseName}
        </strong>

        <small>
          Kho thực hiện xuất
        </small>
      </div>
    </section>
  );
}


export default ReleaseOrderSummary;