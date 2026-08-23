import { useMemo, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  deleteReleaseOrder,
  updateWarehouseReleaseStatus,
} from "../../../../services/releaseOrderService";

const getRowCode = (row) => row?.code || row?.release_code || "";

function useWarehouseReleaseActionController({
  releaseOrders,
  selectedIds,
  selectedOrder,
  clearSelection,
  clearDetail,
  refreshList,
}) {
  const { canDo } = useAuth();

  const canUpdateRelease = canDo("update_warehouse_release");
  const canInputActualQuantity = canDo("update_actual_released_quantity");
  const canUseReleaseActualPage =
    canUpdateRelease || canInputActualQuantity;

  const canDelete = canDo("delete_warehouse_release");
  const canDeleteAdmin = canDo("delete_warehouse_release_admin");

  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const actionOrder = useMemo(() => {
    if (selectedIds.length === 1) {
      return (
        releaseOrders.find((row) => row.id === selectedIds[0]) || null
      );
    }

    return selectedOrder;
  }, [releaseOrders, selectedIds, selectedOrder]);

  const canDeleteReleaseByStatus = (status) =>
    status === "PENDING" || status === "WAIT_TO_APPROVE";

  const canRejectReleaseByStatus = (status) => {
    if (status === "WAIT_TO_APPROVE") {
      return canUpdateRelease;
    }

    if (status === "COMPLETED") {
      return canDeleteAdmin;
    }

    return false;
  };

  const handleRejectRelease = async () => {
    if (rejecting) return;

    if (!canUpdateRelease && !canDeleteAdmin) {
      alert("Bạn không có quyền từ chối lệnh xuất kho");
      return;
    }

    if (selectedIds.length > 1) {
      alert("Chỉ được từ chối 1 lệnh xuất kho tại một thời điểm");
      return;
    }

    const order = actionOrder;

    if (!order) {
      alert("Vui lòng chọn lệnh xuất kho cần từ chối");
      return;
    }

    if (!canRejectReleaseByStatus(order.status)) {
      if (order.status === "COMPLETED" && !canDeleteAdmin) {
        alert(
          'Bạn cần quyền "delete_warehouse_release_admin" để từ chối lệnh đã hoàn thành'
        );
        return;
      }

      if (order.status === "WAIT_TO_APPROVE" && !canUpdateRelease) {
        alert(
          'Bạn cần quyền "update_warehouse_release" để từ chối lệnh chờ duyệt'
        );
        return;
      }

      alert(
        "Chỉ được từ chối lệnh ở trạng thái Chờ duyệt hoặc Hoàn thành"
      );
      return;
    }

    const warehouseReleaseId =
      order.warehouse_release_id || order.release_id || order.id;

    if (!warehouseReleaseId) {
      alert("Không tìm thấy ID lệnh xuất kho");
      return;
    }

    const releaseCode = getRowCode(order) || warehouseReleaseId;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn từ chối phiếu ${releaseCode} không?`
      )
    ) {
      return;
    }

    try {
      setRejecting(true);

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const randomLoadingTime =
        Math.floor(Math.random() * (1500 - 700 + 1)) + 700;

      await new Promise((resolve) =>
        setTimeout(resolve, randomLoadingTime)
      );

      await updateWarehouseReleaseStatus(
        warehouseReleaseId,
        "cancel"
      );

      clearSelection?.();
      clearDetail?.();

      await refreshList?.({ page: 1 });

      alert(`Từ chối phiếu ${releaseCode} thành công.`);
    } catch (error) {
      console.error(
        "REJECT WAREHOUSE RELEASE ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          `Không thể từ chối phiếu ${releaseCode}`
      );
    } finally {
      setRejecting(false);
    }
  };

  const deleteOrdersByIds = async (ids) => {
    if (!ids || ids.length === 0 || deleting) return;

    const confirmMessage =
      ids.length === 1
        ? "Bạn có chắc muốn xóa lệnh xuất kho đã chọn không?"
        : `Bạn có chắc muốn xóa ${ids.length} lệnh xuất kho đã chọn không?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setDeleting(true);

      const results = await Promise.allSettled(
        ids.map((id) => deleteReleaseOrder(id))
      );

      const failed = results.filter(
        (result) => result.status === "rejected"
      );

      clearSelection?.();
      clearDetail?.();

      await refreshList?.({ page: 1 });

      if (failed.length === 0) {
        alert(
          ids.length === 1
            ? "Xóa lệnh xuất kho thành công"
            : `Xóa ${ids.length} lệnh xuất kho thành công`
        );
      } else {
        alert(
          `Xóa ${ids.length - failed.length}/${ids.length} thành công. ` +
            `${failed.length} lệnh thất bại.`
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteRelease = () => {
    if (!canDelete) {
      alert("Bạn không có quyền xóa lệnh xuất kho");
      return;
    }

    if (selectedIds.length > 0) {
      const selectedRows = releaseOrders.filter((row) =>
        selectedIds.includes(row.id)
      );

      const invalidRows = selectedRows.filter(
        (row) => !canDeleteReleaseByStatus(row.status)
      );

      if (invalidRows.length > 0) {
        alert(
          "Chỉ được xóa lệnh xuất kho ở trạng thái Nháp hoặc Chờ duyệt."
        );
        return;
      }

      deleteOrdersByIds(selectedIds);
      return;
    }

    if (!selectedOrder) {
      alert("Vui lòng chọn lệnh cần xóa");
      return;
    }

    if (!canDeleteReleaseByStatus(selectedOrder.status)) {
      alert("Phiếu đã hoàn thành, không được xóa.");
      return;
    }

    deleteOrdersByIds([selectedOrder.id]);
  };

  return {
    actionOrder,

    canUpdateRelease,
    canInputActualQuantity,
    canUseReleaseActualPage,
    canDelete,
    canDeleteAdmin,

    rejecting,
    deleting,

    canDeleteReleaseByStatus,
    canRejectReleaseByStatus,

    handleRejectRelease,
    handleDeleteRelease,
  };
}

export default useWarehouseReleaseActionController;
