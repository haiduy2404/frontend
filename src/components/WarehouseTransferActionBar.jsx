import { formatISOToViDate } from "../../../utils/dateUtils";
import {
  getTransferCode,
  getTransferStatusText,
} from "./utils/warehouseTransferUtils";

export default function WarehouseTransferListPanel({
  transfers,
  selectedTransfer,
  handleToggleSelection,
  canView,
  handleOpenView,
  pageSize,
  setPageSize,
}) {
  return (
    <>
      <div className="transfer-table-wrap">
        <table>
          <thead>
            <tr>
              <th className="check-col">
                <input type="checkbox" disabled />
              </th>
              <th>Số phiếu điều chuyển</th>
              <th>Ngày điều chuyển</th>
              <th>Lý do điều chuyển</th>
              <th>Kho xuất</th>
              <th>Kho nhập</th>
              <th>Tình trạng</th>
            </tr>
          </thead>

          <tbody>
            {transfers.map((item, index) => {
              const code = getTransferCode(item) || "-";

              return (
                <tr
                  key={item.id || item.code || index}
                  className={selectedTransfer === item.id ? "selected" : ""}
                  onClick={() => handleToggleSelection(item.id)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTransfer === item.id}
                      onChange={() => handleToggleSelection(item.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </td>

                  <td>
                    {canView ? (
                      <button
                        type="button"
                        className="code-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenView(item);
                        }}
                      >
                        {code}
                      </button>
                    ) : (
                      code
                    )}
                  </td>

                  <td>
                    {formatISOToViDate(
                      item.transfer_date || item.created_at || item.date
                    ) || "-"}
                  </td>

                  <td>{item.reason || "-"}</td>

                  <td>
                    {item.from_warehouse_name ||
                      item.source_warehouse_name ||
                      item.from_warehouse?.name ||
                      item.from_warehouse?.warehouse_name ||
                      "-"}
                  </td>

                  <td>
                    {item.to_warehouse_name ||
                      item.destination_warehouse_name ||
                      item.to_warehouse?.name ||
                      item.to_warehouse?.warehouse_name ||
                      "-"}
                  </td>

                  <td>
                    <span className="status-badge">
                      {getTransferStatusText(item.status)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {transfers.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-row">
                  Không có phiếu điều chuyển
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="transfer-footer">
        <span>Tổng số: {transfers.length}</span>

        <div className="footer-right">
          <span>Số dòng/trang</span>

          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <b>{transfers.length ? `1 - ${transfers.length}` : "0 - 0"}</b>
        </div>
      </div>
    </>
  );
}
