function ImportOrderDetailTable({
  detailLoading,

  detailRows,
  filteredDetailRows,

  detailTotalAmount,

  parseMoney,
  formatViNumber,
  formatViQuantity,
}) {
  return (
    <div className="import-list-detail-table-wrapper">
      <table className="import-list-detail-table">
        <colgroup>
          <col className="col-stt" />
          <col className="col-code" />
          <col className="col-name" />
          <col className="col-unit" />
          <col className="col-qty" />
          <col className="col-qty" />
          <col className="col-qty" />
          <col className="col-check" />
          <col className="col-price" />
          <col className="col-amount" />
          <col className="col-vat" />
        </colgroup>

        <thead>
          <tr>
            <th>#</th>
            <th>Mã hàng</th>
            <th>Tên hàng</th>
            <th>ĐVT</th>

            <th>
              Tỷ lệ chuyển đổi
            </th>

            <th>
              SL yêu cầu
            </th>

            <th>
              SL thực nhập
            </th>

            <th>
              Đánh dấu đủ
            </th>

            <th>Đơn giá</th>

            <th>
              Thành tiền
            </th>

            <th>
              Thuế VAT
            </th>
          </tr>
        </thead>

        <tbody>
          {detailLoading && (
            <tr>
              <td colSpan={11}>
                Đang tải chi tiết...
              </td>
            </tr>
          )}

          {!detailLoading &&
            filteredDetailRows.length ===
              0 && (
              <tr>
                <td colSpan={11}>
                  Không có chi tiết
                  hàng hóa
                </td>
              </tr>
            )}

          {!detailLoading &&
            filteredDetailRows.map(
              (item, index) => {
                const requestedQuantity =
                  parseMoney(
                    item.request_quantity ||
                      item.requested_quantity ||
                      0
                  );

                const originalQuantity =
                  parseMoney(
                    item.original_quantity ||
                      0
                  );

                const unitPrice =
                  parseMoney(
                    item.unit_price || 0
                  );

                const amount =
                  originalQuantity *
                  unitPrice;

                return (
                  <tr
                    key={
                      item.inventory_id ||
                      item.goods_id ||
                      index
                    }
                  >
                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {item.goods_code ||
                        "-"}
                    </td>

                    <td>
                      {item.goods_name ||
                        "-"}
                    </td>

                    <td>
                      {item.unit_name ||
                        "-"}
                    </td>

                    <td className="number-col">
                      {formatViNumber(
                        item.conversion_ratio ||
                          1,
                        3
                      )}
                    </td>

                    <td className="number-col">
                      {formatViQuantity(
                        requestedQuantity
                      )}
                    </td>

                    <td className="number-col">
                      {formatViQuantity(
                        originalQuantity
                      )}
                    </td>

                    <td className="center-col">
                      <input
                        type="checkbox"
                        checked={
                          requestedQuantity ===
                          originalQuantity
                        }
                        readOnly
                        disabled
                      />
                    </td>

                    <td className="number-col">
                      {formatViNumber(
                        unitPrice,
                        3
                      )}
                    </td>

                    <td className="number-col">
                      {formatViNumber(
                        amount,
                        0
                      )}
                    </td>

                    <td className="number-col">
                      {Number(
                        item.vat || 0
                      )}
                      %
                    </td>
                  </tr>
                );
              }
            )}

          {!detailLoading &&
            filteredDetailRows.length >
              0 && (
              <tr className="table-total-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>

                <td className="number-col">
                  {formatViQuantity(
                    filteredDetailRows.reduce(
                      (
                        sum,
                        item
                      ) =>
                        sum +
                        parseMoney(
                          item.request_quantity ||
                            item.requested_quantity ||
                            0
                        ),
                      0
                    )
                  )}
                </td>

                <td className="number-col">
                  {formatViQuantity(
                    detailRows.reduce(
                      (
                        sum,
                        item
                      ) =>
                        sum +
                        parseMoney(
                          item.original_quantity ||
                            0
                        ),
                      0
                    )
                  )}
                </td>

                <td></td>
                <td></td>

                <td className="number-col">
                  {formatViNumber(
                    detailTotalAmount,
                    0
                  )}
                </td>

                <td></td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}

export default ImportOrderDetailTable;