import { useAuth } from "../../../../contexts/AuthContext";
import {
  deleteReleaseOrder,
  submitReleaseOrder,
} from "../../../../services/releaseOrderService";

function useReleaseOrderActionController({
  navigate,
  releaseOrders,
  selectedRow,
  selectedIds,
  setSelectedId,
  setSelectedIds,
  fetchReleaseOrders,
  clearReleaseOrderDetail,
} = {}) {
  const { canDo } = useAuth();

  const handleCompleteRelease = async (row) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn trình duyệt lệnh ${
        row.code || row.release_code || ""
      } không?`
    );
    if (!confirmed) return;
    try {
      await submitReleaseOrder(row.id);
      await fetchReleaseOrders();
      alert("Trình duyệt lệnh xuất kho thành công");
    } catch (error) {
      console.error(
        "SUBMIT RELEASE ORDER ERROR:",
        error.response?.data || error
      );
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Trình duyệt lệnh xuất kho thất bại"
      );
    }
  };

  const handleCompleteSelectedReleases = async () => {
    const submittable = releaseOrders.filter(
      (row) => selectedIds.includes(row.id) && row.status === "PENDING"
    );
    const skipped = selectedIds.length - submittable.length;

    if (submittable.length === 0) {
      alert("Không có lệnh nào ở trạng thái Nháp để trình duyệt.");
      return;
    }

    const message =
      skipped > 0
        ? `Trình duyệt ${submittable.length} lệnh (bỏ qua ${skipped} lệnh không ở trạng thái Nháp)?`
        : `Bạn có chắc muốn trình duyệt ${submittable.length} lệnh đã chọn không?`;
    if (!window.confirm(message)) return;

    const results = await Promise.allSettled(
      submittable.map((row) => submitReleaseOrder(row.id))
    );
    const failed = results.filter((result) => result.status === "rejected");

    setSelectedIds([]);
    await fetchReleaseOrders();

    if (failed.length === 0) {
      alert(`Trình duyệt ${submittable.length} lệnh xuất kho thành công`);
    } else {
      alert(
        `Trình duyệt ${submittable.length - failed.length}/${submittable.length} thành công. ` +
          `${failed.length} lệnh thất bại.`
      );
    }
  };

  const handleCloneReleaseOrder = (row) => {
    if (!row) {
      alert("Vui lòng chọn phiếu cần nhân bản");
      return;
    }

    const code = row.code || row.release_code;

    if (!code) {
      alert("Không tìm thấy số phiếu để nhân bản");
      return;
    }

    navigate(
      `/dashboard/activity/export/order-detail/new?clone_from=${encodeURIComponent(
        code
      )}`
    );
  };

  const handleDeleteRelease = async (row) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phiếu ${row.code || row.release_code || ""} không?`
    );

    if (!confirmed) return;

    try {
      await deleteReleaseOrder(row.id);

      setSelectedId(null);
      clearReleaseOrderDetail();

      await fetchReleaseOrders();
      alert("Xóa phiếu xuất kho thành công");
    } catch (error) {
      console.error(
        "DELETE RELEASE ORDER ERROR:",
        error.response?.data || error
      );
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa phiếu xuất kho thất bại"
      );
    }
  };

  const handleDeleteSelectedReleases = async () => {
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một phiếu cần xóa");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} phiếu xuất kho đã chọn không?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteReleaseOrder(id)));

      setSelectedIds([]);
      setSelectedId(null);
      clearReleaseOrderDetail();

      await fetchReleaseOrders();

      alert("Xóa các phiếu xuất kho đã chọn thành công");
    } catch (error) {
      console.error(
        "DELETE SELECTED RELEASE ORDERS ERROR:",
        error.response?.data || error
      );
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa các phiếu xuất kho đã chọn thất bại"
      );
    }
  };

  const handleEditReleaseOrder = () => {
    if (!selectedRow) {
      alert("Vui lòng chọn phiếu cần chỉnh sửa");
      return;
    }
    if (selectedRow.status === "WAIT_TO_APPROVE") {
      alert("Phiếu đang chờ duyệt, không được chỉnh sửa.");
      return;
    }
    if (selectedRow.status === "COMPLETED") {
      alert("Phiếu đã hoàn thành, không được chỉnh sửa.");
      return;
    }
    navigate(
      `/dashboard/activity/export/order-detail/${
        selectedRow.code || selectedRow.release_code || selectedRow.id
      }`
    );
  };

  const handleCompleteFromSelection = () => {
    if (selectedIds.length > 1) {
      handleCompleteSelectedReleases();
      return;
    }
    if (!selectedRow) {
      alert("Vui lòng chọn phiếu cần trình duyệt");
      return;
    }
    handleCompleteRelease(selectedRow);
  };

  return {
    canCreate: canDo("create_warehouse_release"),
    canUpdate:
      canDo("update_warehouse_release") &&
      canDo("update_actual_released_quantity"),
    canComplete: canDo("complete_warehouse_release"),
    canDelete: canDo("delete_warehouse_release"),
    handleCompleteRelease,
    handleCompleteSelectedReleases,
    handleCompleteFromSelection,
    handleCloneReleaseOrder,
    handleDeleteRelease,
    handleDeleteSelectedReleases,
    handleEditReleaseOrder,
  };
}

export default useReleaseOrderActionController;
