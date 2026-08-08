import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/WarehouseTransferPage.css";
import { useAuth } from "../../../contexts/AuthContext";
import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiLoader4Line,
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
  const canDeleteAdmin = canDo("delete_warehouse_transfer_admin");
  const [transfers, setTransfers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [timeRange, setTimeRange] = useState("last_3_months");
  const [pageSize, setPageSize] = useState(20);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [completing, setCompleting] = useState(false);

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

  const handleToggleSelection = (transferId) => {
    setSelectedTransfer((currentId) =>
      currentId === transferId ? null : transferId
    );
  };
  const getTransferStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "Đang điều chuyển";
      case "COMPLETED":
        return "Đã hoàn thành";
      case "CANCELLED":
        return "Đang điều chuyển";
      default:
        return "-";
    }
  };
  const handleComplete = async (transfer) => {
    if (completing || rejecting) return;

    if (!canUpdate) {
      alert("Bạn không có quyền hoàn thành phiếu điều chuyển");
      return;
    }

    if (!transfer?.id) {
      alert("Vui lòng chọn phiếu điều chuyển");
      return;
    }

    if (transfer.status !== "PENDING") {
      alert("Chỉ được hoàn thành phiếu đang điều chuyển");
      return;
    }

    const transferCode = getTransferCode(transfer) || transfer.id;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hoàn thành phiếu ${transferCode} không?`
    );

    if (!confirmed) return;

    try {
      setCompleting(true);

      // Đợi React hiển thị vòng loading và nội dung nút.
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // Loading ngẫu nhiên từ 0,7 giây đến 1,5 giây.
      const randomLoadingTime =
        Math.floor(Math.random() * (1500 - 700 + 1)) + 700;

      // Hết thời gian loading mới gửi API về backend.
      await new Promise((resolve) =>
        setTimeout(resolve, randomLoadingTime)
      );

      await updateWarehouseTransferStatus(
        transfer.id,
        "complete"
      );

      setSelectedTransfer(null);
      await loadTransfers();

      alert(`Hoàn thành phiếu ${transferCode} thành công.`);
    } catch (error) {
      console.error(
        "COMPLETE TRANSFER ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          `Không thể hoàn thành phiếu ${transferCode}`
      );
    } finally {
      setCompleting(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const params = {
        search: keyword,
        status: status || undefined,
        page_size: pageSize,
      };

      if (timeRange === "last_3_months") {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        params.start_date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
        params.end_date = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
      } else {
        params.time_range = timeRange;
      }

      const data = await getWarehouseTransfersPageable(params);

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

      navigate(`/dashboard/activity/transfer/detail/${code}?mode=print`);
  };

  const handleOpenEdit = (transfer) => {
    const code = getTransferCode(transfer);
    if (!code) return;
    navigate(`/dashboard/activity/transfer/detail/${code}?mode=edit`);
  };

  const handleReject = async (transfer) => {
    if (rejecting || completing) return;

    if (!canDeleteAdmin) {
      alert(
        'Bạn cần quyền "delete_warehouse_admin" để từ chối phiếu đã hoàn thành'
      );
      return;
    }

    if (!transfer?.id) {
      alert("Vui lòng chọn phiếu điều chuyển cần từ chối");
      return;
    }

    if (transfer.status !== "COMPLETED") {
      alert("Chỉ được từ chối phiếu ở trạng thái Đã hoàn thành");
      return;
    }

    const transferCode = getTransferCode(transfer) || transfer.id;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn từ chối phiếu ${transferCode} không?`
    );

    if (!confirmed) return;

    try {
      setRejecting(true);

      // Đợi React hiển thị vòng loading và nội dung nút.
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // Loading ngẫu nhiên từ 0,7 giây đến 1,5 giây.
      const randomLoadingTime =
        Math.floor(Math.random() * (1500 - 700 + 1)) + 700;

      // Hết thời gian loading mới gửi API về backend.
      await new Promise((resolve) =>
        setTimeout(resolve, randomLoadingTime)
      );

      await updateWarehouseTransferStatus(
        transfer.id,
        "pending"
      );

      setSelectedTransfer(null);
      await loadTransfers();

      alert(`Đưa phiếu ${transferCode} về trạng thái đang điều chuyển thành công.`);
    } catch (error) {
      console.error(
        "REJECT TRANSFER ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          `Không thể từ chối phiếu ${transferCode}`
      );
    } finally {
      setRejecting(false);
    }
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
            <option value="last_3_months">Thời gian: 3 tháng gần nhất</option>
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
              {canUpdate && (
                <button
                  type="button"
                  className="edit-btn"
                  disabled={!selectedRow || selectedRow.status !== "PENDING"}
                  onClick={() => {
                    if (!selectedRow) {
                      alert("Vui lòng chọn phiếu cần chỉnh sửa");
                      return;
                    }

                    if (selectedRow.status !== "PENDING") {
                      alert("Chỉ được chỉnh sửa phiếu đang điều chuyển.");
                      return;
                    }

                    handleOpenEdit(selectedRow);
                  }}
                >
                  <RiEdit2Line />
                  <span>Chỉnh sửa</span>
                </button>
              )}

              {canDeleteAdmin && (
                <button
                  type="button"
                  className="delete-toolbar-btn"
                  disabled={
                    rejecting ||
                    completing ||
                    !selectedRow ||
                    selectedRow.status !== "COMPLETED"
                  }
                  onClick={() => handleReject(selectedRow)}
                  title={
                    selectedRow && selectedRow.status !== "COMPLETED"
                      ? "Chỉ được từ chối phiếu đã hoàn thành"
                      : ""
                  }
                >
                  {rejecting ? (
                    <RiLoader4Line className="transfer-action-loading-icon" />
                  ) : (
                    <RiCloseCircleLine />
                  )}

                  <span>
                    {rejecting ? "Đang từ chối..." : "Từ chối"}
                  </span>
                </button>
              )}

              {canUpdate && (
                <button
                  type="button"
                  className="complete-toolbar-btn"
                  disabled={
                    completing ||
                    rejecting ||
                    !selectedRow ||
                    selectedRow.status !== "PENDING"
                  }
                  onClick={() => handleComplete(selectedRow)}
                >
                  {completing ? (
                    <RiLoader4Line className="transfer-action-loading-icon" />
                  ) : (
                    <RiCheckboxCircleLine />
                  )}

                  <span>
                    {completing ? "Đang hoàn thành..." : "Hoàn thành"}
                  </span>
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
                    className={selectedTransfer === item.id ? "selected" : ""}
                    onClick={() => handleToggleSelection(item.id)}
                >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTransfer === item.id}
                    onChange={() => handleToggleSelection(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>

                  <td>
                    {canView ? (
                    <button
                        type="button"
                        className="code-link"
                        onClick={(e) => {
                          e.stopPropagation();
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