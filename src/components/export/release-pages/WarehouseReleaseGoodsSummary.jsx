import { RiEyeLine } from "react-icons/ri";

function WarehouseReleaseGoodsSummary({
  detailRows,
  detailLoading,
  formatViNumber,
  onViewDetail,
}) {
  const previewRows = detailRows.slice(0, 5);

  return (
    <section className="warehouse-release-goods-summary">
      <div className="warehouse-release-goods-header">
        <div>
          <h3>DANH SÁCH HÀNG HÓA XUẤT</h3>
          <span>{detailRows.length} mặt hàng</span>
        </div>

        <button
          type="button"
          disabled={!detailRows.length}
          onClick={onViewDetail}
        >
          <RiEyeLine />
          Xem chi tiết
        </button>
      </div>

      <div className="warehouse-release-goods-table-wrap">
        <table className="warehouse-release-goods-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã VT</th>
              <th>Tên hàng</th>
              <th>ĐVT</th>
              <th>SL yêu cầu</th>
              <th>SL thực xuất</th>
            </tr>
          </thead>

          <tbody>
            {detailLoading && (
              <tr>
                <td colSpan={6}>Đang tải chi tiết...</td>
              </tr>
            )}

            {!detailLoading && !previewRows.length && (
              <tr>
                <td colSpan={6}>Không có chi tiết hàng hóa</td>
              </tr>
            )}

            {!detailLoading &&
              previewRows.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.goods_code || "-"}</td>
                  <td>{item.goods_name || "-"}</td>
                  <td>{item.unit_name || "-"}</td>
                  <td className="number-col">
                    {item.requested_quantity}
                  </td>
                  <td className="number-col">
                    {item.actual_quantity || "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default WarehouseReleaseGoodsSummary;
