import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/WarehouseTransferPage.css";
import { useAuth } from "../../../contexts/AuthContext";
import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import {
  getWarehouseTransfersPageable,
  deleteWarehouseTransfer,
  updateWarehouseTransferStatus,
} from "../../../services/warehouseTransferService";

export default function WarehouseTransferPage() {
  const navigate = useNavigate();
  const { canDo } = useAuth();
  const canView = canDo("view_warehouse_transfer");
  const canUpdate = canDo("update_warehouse_transfer");
  const canDelete = canDo("delete_warehouse_transfer");
  const canCreate = canDo("create_warehouse_transfer");
  const [transfers, setTransfers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [timeRange, setTimeRange] = useState("month");
  const [pageSize, setPageSize] = useState(20);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
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
  const selectedRow = transfers.find((item) => item.id === selectedTransfer);
  const getTransferStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "Đang điều chuyển";
      case "COMPLETED":
        return "Đã hoàn thành";
      default:
        return "-";
    }
  };
  const handleComplete = async (transfer) => {
  if (!transfer?.id) {
    alert("Vui lòng chọn phiếu điều chuyển");
    return;
  }

  if (transfer.status === "COMPLETED") {
    alert("Phiếu đã hoàn thành");
    return;
  }

  const confirmed = window.confirm(
    `Bạn có chắc muốn hoàn thành phiếu ${getTransferCode(transfer)} không?`
  );

  if (!confirmed) return;

  try {
    await updateWarehouseTransferStatus(transfer.id, {
      action: "complete",
      status: "COMPLETED",
    });

    setSelectedTransfer(null);
    await loadTransfers();
    alert("Hoàn thành phiếu điều chuyển thành công");
  } catch (error) {
    console.error("COMPLETE TRANSFER ERROR:", error.response?.data || error);
    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Hoàn thành phiếu điều chuyển thất bại"
    );
  }
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

  const getTransferCode = (transfer) =>
    transfer.code ||
    transfer.transfer_code ||
    transfer.warehouse_transfer_code ||
  "";

  const handleOpenView = (transfer) => {
    const code = getTransferCode(transfer);

    if (!code) return;

    navigate(`/dashboard/activity/transfer/detail/${code}?mode=view`);
  };

  const handleOpenEdit = (transfer) => {
    const code = getTransferCode(transfer);
    if (!code) return;
    navigate(`/dashboard/activity/transfer/detail/${code}?mode=edit`);
  };

  const handleDelete = async (transfer) => {
      if (!transfer.id) return;
      if (!window.confirm("Bạn có chắc muốn xóa?")) {
        return;
    }
    try {
      await deleteWarehouseTransfer(transfer.id);
      setSelectedTransfer(null);
      await loadTransfers();
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại");
    }
  };

  return (
    <div className="warehouse-transfer-list-page">
      <div className="transfer-tabs">
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
            <option value="PENDING">Đang điều chuyển</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
            <div className="toolbar-spacer" />
              <button type="button" className="icon-btn" onClick={loadTransfers}>
                ↻
              </button>

              {canUpdate && (
                <button
                  type="button"
                  className="edit-btn"
                  disabled={!selectedRow || selectedRow.status === "COMPLETED"}
                  onClick={() => {
                    if (!selectedRow) {
                      alert("Vui lòng chọn phiếu cần chỉnh sửa");
                      return;
                    }

                    if (selectedRow.status === "COMPLETED") {
                      alert("Phiếu đã hoàn thành, không được chỉnh sửa.");
                      return;
                    }

                    handleOpenEdit(selectedRow);
                  }}
                >
                  <RiEdit2Line />
                  <span>Chỉnh sửa</span>
                </button>
              )}

              {canUpdate && (
                <button
                  type="button"
                  className="complete-toolbar-btn"
                  disabled={!selectedRow || selectedRow.status === "COMPLETED"}
                  onClick={() => handleComplete(selectedRow)}
                >
                  <RiCheckboxCircleLine />
                  <span>Hoàn thành</span>
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  className="delete-toolbar-btn"
                  disabled={!selectedRow}
                  onClick={() => {
                    if (!selectedRow) {
                      alert("Vui lòng chọn phiếu cần xóa");
                      return;
                    }

                    handleDelete(selectedRow);
                  }}
                >
                  <RiDeleteBin6Line />
                  <span>Xóa</span>
                </button>
              )}

              {canCreate && (
                <button type="button" className="add-btn" onClick={handleAdd}>
                  <RiAddLine />
                  <span>Thêm</span>
                </button>
              )}
        </div>

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
                >
                <td>
                    <input
                      type="checkbox"
                      checked={selectedTransfer === item.id}
                      onChange={() =>
                        setSelectedTransfer(
                          selectedTransfer === item.id ? null : item.id
                        )
                      }
                    />
                </td>

                  <td>
                    {canView ? (
                      <button
                        type="button"
                        className="code-link"
                        onClick={() => handleOpenView(item)}
                      >
                        {code}
                      </button>
                    ) : (
                      code
                    )}
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