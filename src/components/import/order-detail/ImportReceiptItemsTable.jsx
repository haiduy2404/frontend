import {
  RiAddLine,
  RiDeleteBin6Line,
  RiSearchLine,
} from "react-icons/ri";

import {
  parseNumber,
  formatViNumber,
  formatViQuantity,
} from "../../../utils/importReceiptNumber";

function ImportReceiptItemsTable({
  items,

  isPrintMode,

  activeGoodsRowId,
  showGoodsDropdown,

  goodsList,
  goodsLoading,

  totalAmount,

  onEnterMoveNext,
  onUnitPriceEnter,

  onOpenGoodsDropdown,
  onSearchGoodsForRow,
  onToggleGoodsDropdown,
  onGoodsDropdownScroll,

  onOpenAddGoodsModal,
  onSelectGoods,

  onChangeItemField,
  onChangeItemUnit,

  onAddRow,
  onDeleteRow,
}) {
  return (
    <>
      <div className="detail-search">
        <RiSearchLine />
        <input placeholder="Tìm kiếm" />
      </div>

      <div className="order-detail-table-wrapper">
        <table className="order-detail-table">
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
            <col className="col-action" />
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
              <th>SL yêu cầu</th>
              <th>SL thực nhập</th>
              <th>Đánh dấu đủ</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
              <th>Thuế VAT</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map(
              (item, index) => (
                <tr
                  key={item.id}
                  className={[
                    "goods-row",

                    String(
                      activeGoodsRowId
                    ) ===
                    String(item.id)
                      ? "goods-dropdown-active-row"
                      : "",

                    item.is_delete
                      ? "deleted-goods-row"
                      : "",
                  ].join(" ")}
                >
                  <td>
                    {index + 1}
                  </td>

                  <td className="goods-code-dropdown-cell">
                    <div className="goods-code-dropdown-box">
                      <input
                        data-enter-next="true"
                        data-goods-code-row-id={String(
                          item.id
                        )}
                        value={
                          item.goods_code
                        }
                        placeholder="Chọn mã hàng"
                        onKeyDown={
                          onEnterMoveNext
                        }
                        onFocus={() =>
                          onOpenGoodsDropdown(
                            item.id,
                            item.goods_code ||
                              ""
                          )
                        }
                        onChange={(
                          event
                        ) => {
                          const value =
                            event.target
                              .value;

                          onChangeItemField(
                            item.id,
                            "goods_code",
                            value
                          );

                          onSearchGoodsForRow(
                            item.id,
                            value
                          );
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          onToggleGoodsDropdown(
                            item.id,
                            item.goods_code ||
                              ""
                          )
                        }
                      >
                        ▾
                      </button>

                      {showGoodsDropdown &&
                        String(
                          activeGoodsRowId
                        ) ===
                          String(
                            item.id
                          ) && (
                          <div
                            className="goods-code-dropdown-list"
                            onScroll={
                              onGoodsDropdownScroll
                            }
                          >
                            <div className="goods-code-dropdown-header">
                              <span>
                                Mã hàng
                              </span>

                              <span>
                                Tên hàng
                              </span>

                              <button
                                type="button"
                                className="goods-code-add-btn"
                                title="Thêm hàng hóa"
                                onMouseDown={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  onOpenAddGoodsModal();
                                }}
                                disabled={
                                  isPrintMode
                                }
                              >
                                +
                              </button>
                            </div>

                            {goodsList.map(
                              (goods) => (
                                <div
                                  key={
                                    goods.id
                                  }
                                  className="goods-code-dropdown-item"
                                  onClick={() =>
                                    onSelectGoods(
                                      goods
                                    )
                                  }
                                >
                                  <span>
                                    {goods.code ||
                                      goods.goods_code}
                                  </span>

                                  <span>
                                    {goods.name ||
                                      goods.goods_name}
                                  </span>

                                  <span></span>
                                </div>
                              )
                            )}

                            {goodsLoading && (
                              <div className="goods-code-dropdown-status">
                                Đang tải...
                              </div>
                            )}

                            {!goodsLoading &&
                              goodsList.length ===
                                0 && (
                                <div className="goods-code-dropdown-status">
                                  Không có
                                  dữ liệu
                                </div>
                              )}
                          </div>
                        )}
                    </div>
                  </td>

                  <td>
                    <input
                      data-enter-next="true"
                      className="table-text-input"
                      value={
                        item.goods_name ||
                        ""
                      }
                      onKeyDown={
                        onEnterMoveNext
                      }
                      placeholder="Tên hàng"
                      onChange={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "goods_name",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        isPrintMode ||
                        !item.goods_id
                      }
                    />
                  </td>

                  <td>
                    <select
                      data-enter-next="true"
                      className="table-unit-select"
                      value={
                        item.unit_id || ""
                      }
                      onKeyDown={
                        onEnterMoveNext
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeItemUnit(
                          item.id,
                          event.target
                            .value
                        )
                      }
                      disabled={
                        isPrintMode ||
                        !item.goods_id
                      }
                    >
                      {item.unit_options &&
                      item.unit_options
                        .length > 0 ? (
                        item.unit_options.map(
                          (unitItem) => (
                            <option
                              key={
                                unitItem.unit_id
                              }
                              value={
                                unitItem.unit_id
                              }
                            >
                              {
                                unitItem.unit_name
                              }
                            </option>
                          )
                        )
                      ) : (
                        <option value="">
                          {item.unit ||
                            "Chọn ĐVT"}
                        </option>
                      )}
                    </select>
                  </td>

                  <td className="number-col">
                    <input
                      className="table-number-input"
                      value={
                        item.conversion_ratio ||
                        ""
                      }
                      readOnly
                      disabled
                    />
                  </td>

                  <td className="number-col">
                    <input
                      data-enter-next="true"
                      className="table-number-input"
                      value={
                        item.requested_quantity
                      }
                      onKeyDown={
                        onEnterMoveNext
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "requested_quantity",
                          event.target
                            .value
                        )
                      }
                      onBlur={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "requested_quantity",
                          formatViQuantity(
                            event.target
                              .value
                          )
                        )
                      }
                      disabled={
                        isPrintMode
                      }
                    />
                  </td>

                  <td className="number-col">
                    <input
                      data-enter-next="true"
                      className="table-number-input"
                      value={
                        item.actual_quantity
                      }
                      onKeyDown={
                        onEnterMoveNext
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "actual_quantity",
                          event.target
                            .value
                        )
                      }
                      onBlur={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "actual_quantity",
                          formatViQuantity(
                            event.target
                              .value
                          )
                        )
                      }
                      disabled={
                        isPrintMode
                      }
                    />
                  </td>

                  <td className="center-col">
                    <input
                      type="checkbox"
                      checked={
                        item.marked_old
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "marked_old",
                          event.target
                            .checked
                        )
                      }
                      disabled={
                        isPrintMode
                      }
                    />
                  </td>

                  <td className="number-col">
                    <input
                      data-enter-next="true"
                      className="table-number-input"
                      value={
                        item.unit_price
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "unit_price",
                          event.target
                            .value
                        )
                      }
                      onBlur={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "unit_price",
                          formatViNumber(
                            event.target
                              .value,
                            3
                          )
                        )
                      }
                      onKeyDown={(
                        event
                      ) =>
                        onUnitPriceEnter(
                          event,
                          item.id
                        )
                      }
                      disabled={
                        isPrintMode
                      }
                    />
                  </td>

                  <td className="number-col">
                    {item.amount}
                  </td>

                  <td>
                    <select
                      className="table-vat-select"
                      value={
                        item.vat || "0"
                      }
                      onChange={(
                        event
                      ) =>
                        onChangeItemField(
                          item.id,
                          "vat",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        isPrintMode
                      }
                    >
                      <option value="0">
                        0%
                      </option>

                      <option value="5">
                        5%
                      </option>

                      <option value="8">
                        8%
                      </option>

                      <option value="10">
                        10%
                      </option>
                    </select>
                  </td>

                  <td className="delete-row-col">
                    <div className="detail-action-row add-row-action">
                      <button
                        type="button"
                        className="goods-code-add-btn"
                        onClick={() =>
                          onAddRow(
                            item.id
                          )
                        }
                        disabled={
                          isPrintMode
                        }
                      >
                        <RiAddLine />
                      </button>

                      <button
                        type="button"
                        className="delete-row-btn"
                        onClick={() =>
                          onDeleteRow(
                            item.id
                          )
                        }
                        disabled={
                          isPrintMode
                        }
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            <tr className="table-total-row">
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>

              <td className="number-col">
                {formatViQuantity(
                  items.reduce(
                    (
                      sum,
                      item
                    ) =>
                      sum +
                      parseNumber(
                        item.requested_quantity
                      ),
                    0
                  )
                )}
              </td>

              <td className="number-col">
                {formatViQuantity(
                  items.reduce(
                    (
                      sum,
                      item
                    ) =>
                      sum +
                      parseNumber(
                        item.actual_quantity
                      ),
                    0
                  )
                )}
              </td>

              <td></td>
              <td></td>

              <td className="number-col">
                {formatViNumber(
                  totalAmount,
                  0
                )}
              </td>

              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ImportReceiptItemsTable;