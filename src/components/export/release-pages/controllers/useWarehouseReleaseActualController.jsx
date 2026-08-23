import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { unwrapData } from "../../../../utils/apiUtils";
import {
  getReleaseOrderByCode,
  updateReleaseOrder,
  completeReleaseOrder,
} from "../../../../services/releaseOrderService";

const EMPTY_HEADER = {
  code: "",
  terms: "",
  release_date: "",
  warehouse_id: "",
  warehouse_name: "",
  receiver_unit: "",
  release_target: "",
  contract_number: "",
  description: "",
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : value;
  }

  const text = String(value).trim();
  if (!text) return 0;

  let normalized = text;

  if (text.includes(",")) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if ((text.match(/\./g) || []).length > 1) {
    normalized = text.replace(/\./g, "");
  }

  const number = Number(normalized);
  return Number.isNaN(number) ? 0 : number;
};

const formatViNumber = (value, fractionDigits = 2) => {
  if (value === null || value === undefined || value === "") return "";

  return parseNumber(value).toLocaleString("vi-VN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

function useWarehouseReleaseActualController({ onSuccess } = {}) {
  const { canDo } = useAuth();

  const canSaveActual =
    canDo("update_actual_released_quantity") ||
    canDo("update_warehouse_release");

  const canComplete = canDo("complete_warehouse_release");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [releaseId, setReleaseId] = useState(null);
  const [headerData, setHeaderData] = useState(EMPTY_HEADER);
  const [items, setItems] = useState([]);
  const [fillActualQuantity, setFillActualQuantity] = useState(false);

  const fetchReleaseDetail = async (releaseCode) => {
    if (!releaseCode) return false;

    try {
      setLoading(true);

      const response = await getReleaseOrderByCode(releaseCode);
      const data = unwrapData(response);

      setReleaseId(data.id);

      setHeaderData({
        code: data.code || data.release_code || releaseCode,
        terms: data.terms || "",
        release_date: data.release_date || "",
        warehouse_id: data.warehouse_id || data.warehouse?.id || "",
        warehouse_name:
          data.warehouse_name ||
          data.warehouse?.name ||
          data.warehouse ||
          "",
        receiver_unit:
          data.receiver_unit?.name ||
          data.receiver_unit_name ||
          data.receiver_unit ||
          "",
        release_target:
          data.release_target?.name ||
          data.release_target_name ||
          data.release_target ||
          "",
        contract_number: data.contract_number || "",
        description: data.description || "",
      });

      const rows = Array.isArray(data.items) ? data.items : [];

      setItems(
        rows.map((line, index) => ({
          id: line.item_id || line.id || index + 1,
          item_id: line.item_id || line.id || "",
          goods_id: line.goods_id || line.goods?.id || "",
          goods_code: line.goods_code || line.goods?.code || "",
          goods_name: line.goods_name || line.goods?.name || "",
          goods_unit_id:
            line.goods_unit_id ||
            line.unit_id ||
            line.goods_unit?.id ||
            "",
          goods_unit_name:
            line.goods_unit_name ||
            line.unit_name ||
            line.goods_unit?.name ||
            "",
          conversion_ratio:
            line.conversion_ratio ||
            line.goods_conversion_ratio ||
            line.unit_conversion_ratio ||
            1,
          requested_quantity: formatViNumber(
            line.requested_quantity,
            2
          ),
          actual_quantity:
            line.actual_quantity === null ||
            line.actual_quantity === undefined
              ? ""
              : formatViNumber(line.actual_quantity, 2),
        }))
      );

      setFillActualQuantity(false);
      return true;
    } catch (error) {
      console.error(
        "LOAD RELEASE ACTUAL DETAIL ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Không tải được dữ liệu xuất kho"
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  const openActualModal = async (releaseCode) => {
    if (!releaseCode) {
      alert("Không tìm thấy mã phiếu xuất kho");
      return;
    }

    setOpen(true);

    const success = await fetchReleaseDetail(releaseCode);

    if (!success) {
      setOpen(false);
    }
  };

  const closeActualModal = () => {
    if (completing || saving) return;
    setOpen(false);
  };

  const handleChangeActualQuantity = (rowId, value) => {
    setFillActualQuantity(false);

    setItems((previous) =>
      previous.map((item) =>
        item.id === rowId
          ? {
              ...item,
              actual_quantity: value,
            }
          : item
      )
    );
  };

  const handleFillActualQuantity = () => {
    setItems((previous) =>
      previous.map((item) => ({
        ...item,
        actual_quantity: item.requested_quantity,
      }))
    );
  };

  const handleFillActualToggle = (checked) => {
    setFillActualQuantity(checked);

    if (checked) {
      handleFillActualQuantity();
    }
  };

  const validateBeforeSave = () => {
    if (!releaseId) {
      alert("Không tìm thấy phiếu xuất kho");
      return false;
    }

    if (items.length === 0) {
      alert("Phiếu xuất kho chưa có vật tư");
      return false;
    }

    const invalidItem = items.find(
      (item) =>
        item.actual_quantity === null ||
        item.actual_quantity === undefined ||
        String(item.actual_quantity).trim() === ""
    );

    if (invalidItem) {
      alert(
        `Vui lòng nhập SL thực xuất cho vật tư ${invalidItem.goods_code}`
      );
      return false;
    }

    const overQuantityItem = items.find(
      (item) =>
        parseNumber(item.actual_quantity) >
        parseNumber(item.requested_quantity)
    );

    if (overQuantityItem) {
      alert(
        `SL thực xuất của vật tư ${overQuantityItem.goods_code} không được lớn hơn SL yêu cầu.\n` +
          `SL yêu cầu: ${formatViNumber(
            overQuantityItem.requested_quantity,
            2
          )}\n` +
          `SL thực xuất: ${formatViNumber(
            overQuantityItem.actual_quantity,
            2
          )}`
      );

      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    terms: headerData.terms || null,
    release_date: headerData.release_date,
    warehouse_id: headerData.warehouse_id,
    receiver_unit: headerData.receiver_unit || null,
    release_target: headerData.release_target || null,
    contract_number: headerData.contract_number?.trim() || null,
    description: headerData.description || null,

    items: items.map((item) => ({
      item_id: item.item_id,
      goods_id: item.goods_id,
      goods_unit_id: item.goods_unit_id || null,
      requested_quantity: parseNumber(item.requested_quantity),
      actual_quantity: parseNumber(item.actual_quantity),
      is_delete: false,
    })),
  });

  const handleSaveActualQuantity = async () => {
    if (!canSaveActual) {
      alert("Bạn không có quyền lưu SL thực xuất");
      return;
    }

    if (!validateBeforeSave()) return;

    try {
      setSaving(true);

      await updateReleaseOrder(releaseId, buildPayload());

      alert("Lưu SL thực xuất thành công");

      setOpen(false);
      await onSuccess?.();
    } catch (error) {
      console.error(
        "SAVE ACTUAL RELEASE ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Lưu SL thực xuất thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteRelease = async () => {
    if (completing) return;

    if (!canComplete && !canSaveActual) {
      alert("Bạn không có quyền hoàn thành xuất kho");
      return;
    }

    if (!validateBeforeSave()) return;

    const voucherCode =
      headerData.code || releaseId;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn hoàn thành phiếu ${voucherCode} không?`
      )
    ) {
      return;
    }

    try {
      setCompleting(true);

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

      await updateReleaseOrder(releaseId, buildPayload());
      await completeReleaseOrder(releaseId);

      alert(`Hoàn thành phiếu ${voucherCode} thành công.`);

      setOpen(false);
      await onSuccess?.();
    } catch (error) {
      console.error(
        "COMPLETE RELEASE ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          `Không thể hoàn thành phiếu ${voucherCode}`
      );
    } finally {
      setCompleting(false);
    }
  };

  return {
    open,
    loading,
    saving,
    completing,

    canSaveActual,
    canComplete,

    releaseId,
    headerData,
    items,
    fillActualQuantity,

    openActualModal,
    closeActualModal,

    handleChangeActualQuantity,
    handleFillActualToggle,
    handleSaveActualQuantity,
    handleCompleteRelease,

    parseNumber,
    formatViNumber,
  };
}

export default useWarehouseReleaseActualController;
