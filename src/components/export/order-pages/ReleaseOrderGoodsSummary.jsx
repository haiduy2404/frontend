import {
  RiEyeLine,
} from "react-icons/ri";


function ReleaseOrderGoodsSummary({
  detailRows,
  detailLoading,
  parseNumber,
  formatViNumber,
  onViewDetail,
}) {
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


  const previewRows =
    detailRows.slice(
      0,
      5
    );


  return (
    <section className="release-order-goods-summary">
      <div className="release-order-goods-header">
        <div>
          <h3>
            DANH SÁCH HÀNG HÓA XUẤT
          </h3>

          <span>
            Tổng {detailRows.length} mặt hàng
          </span>
        </div>


        <button
          type="button"
          className="release-order-view-goods-btn"
          disabled={
            detailRows.length ===
            0
          }
          onClick={
            onViewDetail
          }
        >
          <RiEyeLine />

          <span>
            Xem chi tiết
          </span>
        </button>
      </div>


      <div className="release-order-goods-table-wrapper">
        <table className="release-order-goods-table">
          <colgroup>
            <col className="goods-col-stt" />
            <col className="goods-col-code" />
            <col />
            <col className="goods-col-unit" />
            <col className="goods-col-ratio" />
            <col className="goods-col-quantity" />
          </colgroup>

          <thead>
            <tr>
              <th>STT</th>
              <th>Mã hàng</th>
              <th>Tên hàng</th>
              <th>ĐVT</th>
              <th>Tỷ lệ chuyển đổi</th>
              <th>SL yêu cầu</th>
            </tr>
          </thead>


          <tbody>
            {detailLoading && (
              <tr>
                <td colSpan={6}>
                  Đang tải chi tiết...
                </td>
              </tr>
            )}


            {!detailLoading &&
              previewRows.length ===
                0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="release-order-goods-empty"
                  >
                    Không có hàng hóa
                  </td>
                </tr>
              )}


            {!detailLoading &&
              previewRows.map(
                (
                  item,
                  index
                ) => {
                  const ratio =
                    item.conversion_ratio ??
                    item.goods_conversion_ratio ??
                    item.unit_conversion_ratio ??
                    1;

                  return (
                    <tr
                      key={
                        item.item_id ||
                        item.release_inventory_id ||
                        item.goods_id ||
                        index
                      }
                    >
                      <td>
                        {index +
                          1}
                      </td>

                      <td>
                        {item.goods_code ||
                          "-"}
                      </td>

                      <td
                        title={
                          item.goods_name ||
                          ""
                        }
                      >
                        {item.goods_name ||
                          "-"}
                      </td>

                      <td>
                        {item.goods_unit_name ||
                          item.unit_name ||
                          "-"}
                      </td>

                      <td className="number-col">
                        {formatViNumber(
                          ratio,
                          3
                        )}
                      </td>

                      <td className="number-col">
                        {formatViNumber(
                          item.requested_quantity,
                          2
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
          </tbody>


          {detailRows.length >
            0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={5}
                  className="release-order-goods-total-label"
                >
                  Tổng
                </td>

                <td className="number-col">
                  {formatViNumber(
                    totalRequested,
                    2
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}


export default ReleaseOrderGoodsSummary;