import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/WarehouseTransferPage.css";

import { getWarehouseTransfersPageable } from "../../../services/warehouseTransferService";

export default function WarehouseTransferPage() {
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [timeRange, setTimeRange] = useState("month");
  const [pageSize, setPageSize] = useState(20);

  const unwrapList = (data) => {
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.data?.results)
      ? data.data.results
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data?.items)
      ? data.data.items
      : [];
  };

  const loadTransfers = async () => {
    try {
      const data = await getWarehouseTransfersPageable({
        search: keyword,
        status: status || undefined,
        time_range: timeRange,
        page_size: pageSize,
      });

      const results = unwrapList(data);
      setTransfers(results);
    } catch (err) {
      console.error("Load warehouse transfers error:", err);
      setTransfers([]);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [keyword, status, timeRange, pageSize]);

  const handleAdd = () => {
    navigate("/dashboard/activity/transfer/detail/new");
  };

  const handleOpenDetail = (transfer) => {
    const code =
      transfer.code ||
      transfer.transfer_code ||
      transfer.warehouse_transfer_code;

    if (!code) {
      console.error("Không tìm thấy mã phiếu điều chuyển:", transfer);
      return;
    }

    navigate(`/dashboard/activity/transfer/detail/${code}`);
  };

  return (
    <div className="warehouse-transfer-list-page">
      <div className="transfer-tabs">
        <button type="button">Yêu cầu điều chuyển</button>
        <button type="button" className="active">
          Điều chuyển
        </button>
      </div>

      <div className="transfer-list-card">
        <div className="transfer-toolbar">
          <input
            className="search-input"
            placeholder="🔍  Tìm kiếm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="month">Thời gian: Tháng này</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="all">Tất cả</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tình trạng thực hiện: Tất cả</option>
            <option value="DRAFT">Nháp</option>
            <option value="WAITING_RECEIVE">Chờ nhập kho</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <div className="toolbar-spacer" />

          <button type="button" className="icon-btn" onClick={loadTransfers}>
            ↻
          </button>

          <button type="button" className="add-btn" onClick={handleAdd}>
            + Thêm
          </button>
        </div>

        <div className="transfer-table-wrap">
          <table>
            <thead>
              <tr>
                <th className="check-col">
                  <input type="checkbox" />
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
              {transfers.map((item, index) => (
                <tr key={item.id || item.code || index}>
                  <td>
                    <input type="checkbox" />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="code-link"
                      onClick={() => handleOpenDetail(item)}
                    >
                      {item.code ||
                        item.transfer_code ||
                        item.warehouse_transfer_code ||
                        "-"}
                    </button>
                  </td>

                  <td>
                    {item.transfer_date || item.created_at || item.date || "-"}
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
                    <span className="status-badge">{item.status || "-"}</span>
                  </td>
                </tr>
              ))}

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
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <b>{transfers.length ? `1 - ${transfers.length}` : "0 - 0"}</b>
          </div>
        </div>
      </div>
    </div>
  );
}