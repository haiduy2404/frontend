import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  deleteWarehouseTransfer,
  updateWarehouseTransferStatus,
} from "../../../../services/warehouseTransferService";
import {
  getTransferCode,
  isPendingTransferStatus,
} from "../utils/warehouseTransferUtils";

const waitForLoadingPaint = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

const waitRandomLoadingTime = () => {
  const delay = Math.floor(Math.random() * (1500 - 700 + 1)) + 700;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

export default function useWarehouseTransferActionController({
  loadTransfers,
  clearSelection,
}) {
  const navigate = useNavigate();
  const { canDo } = useAuth();

  const [rejecting, setRejecting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const permissions = {
    canView: canDo("view_warehouse_transfer"),
    canUpdate: canDo("update_warehouse_transfer"),
    canDelete: canDo("delete_warehouse_transfer"),
    canCreate: canDo("create_warehouse_transfer"),
    canDeleteAdmin: canDo("delete_warehouse_transfer_admin"),
  };

  const handleAdd = () => {
    navigate("/dashboard/activity/transfer/detail/new");
  };

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

  const handleComplete = async (transfer) => {
    if (completing || rejecting || deleting) return;

    if (!permissions.canUpdate) {
      alert("Bạn không có quyền hoàn thành phiếu điều chuyển");
      return;
    }

    if (!transfer?.id) {
      alert("Vui lòng chọn phiếu điều chuyển");
      return;
    }

    if (!isPendingTransferStatus(transfer.status)) {
      alert("Chỉ được hoàn thành phiếu đang điều chuyển");
      return;
    }

    const transferCode = getTransferCode(transfer) || transfer.id;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn hoàn thành phiếu ${transferCode} không?`
      )
    ) {
      return;
    }

    try {
      setCompleting(true);
      await waitForLoadingPaint();
      await waitRandomLoadingTime();
      await updateWarehouseTransferStatus(transfer.id, "complete");

      clearSelection();
      await loadTransfers();
      alert(`Hoàn thành phiếu ${transferCode} thành công.`);
    } catch (error) {
      console.error("COMPLETE TRANSFER ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          `Không thể hoàn thành phiếu ${transferCode}`
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleReject = async (transfer) => {
    if (rejecting || completing || deleting) return;

    if (!permissions.canDeleteAdmin) {
      alert(
        'Bạn cần quyền "delete_warehouse_transfer_admin" để từ chối phiếu đã hoàn thành'
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

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn từ chối phiếu ${transferCode} không?`
      )
    ) {
      return;
    }

    try {
      setRejecting(true);
      await waitForLoadingPaint();
      await waitRandomLoadingTime();
      await updateWarehouseTransferStatus(transfer.id, "cancel");

      clearSelection();
      await loadTransfers();
      alert(
        `Đưa phiếu ${transferCode} về trạng thái đang điều chuyển thành công.`
      );
    } catch (error) {
      console.error("REJECT TRANSFER ERROR:", error.response?.data || error);
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
    if (rejecting || completing || deleting || !transfer?.id) return;

    if (!permissions.canDelete) {
      alert("Bạn không có quyền xóa phiếu điều chuyển");
      return;
    }

    const transferCode = getTransferCode(transfer) || transfer.id;

    if (!window.confirm(`Bạn có chắc muốn xóa phiếu ${transferCode}?`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteWarehouseTransfer(transfer.id);
      clearSelection();
      await loadTransfers();
    } catch (error) {
      console.error("DELETE TRANSFER ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa thất bại"
      );
    } finally {
      setDeleting(false);
    }
  };

  return {
    ...permissions,
    rejecting,
    completing,
    deleting,
    handleAdd,
    handleOpenView,
    handleOpenEdit,
    handleComplete,
    handleReject,
    handleDelete,
  };
}
