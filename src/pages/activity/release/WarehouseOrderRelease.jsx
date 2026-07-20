import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/WarehouseOrderRelease.css";
import {
  getReleaseOrderByCode,
  updateReleaseOrder,
  completeReleaseOrder,
} from "../../../services/releaseOrderService";
import {
  RiCloseLine,
  RiSave3Line,
  RiCheckboxCircleLine,
  RiPrinterLine,
} from "react-icons/ri";

function WarehouseOrderRelease() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canDo } = useAuth();

  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get("mode") === "print";
  const [printPaperSize, setPrintPaperSize] = useState("A4");
  const handlePrint = () => {
    const targetPath =
      printPaperSize === "A5"
        ? `/dashboard/activity/export/release-print-a5/${headerData.code || id}`
        : `/dashboard/activity/export/release-print/${headerData.code || id}`;

    navigate(targetPath);
  };
  const canSaveActual =
    canDo("update_actual_released_quantity") ||
    canDo("update_warehouse_release");

  const canComplete = canDo("complete_warehouse_release");

  const [releaseId, setReleaseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fillActualQuantity, setFillActualQuantity] = useState(false);

  const [headerData, setHeaderData] = useState({
    code: "",
    terms: "",
    release_date: "",
    warehouse_id: "",
    warehouse_name: "",
    receiver_unit: "",
    release_target: "",
    description: "",
  });

  const [items, setItems] = useState([]);

  const unwrapData = (response) => response?.data || response;

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

  const fetchReleaseDetail = async (releaseCode) => {
    if (!releaseCode) return;

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
          requested_quantity: formatViNumber(line.requested_quantity, 2),

          // chỉ field này cho sửa
          actual_quantity:
            line.actual_quantity === null ||
            line.actual_quantity === undefined
              ? ""
              : formatViNumber(line.actual_quantity, 2),
        }))
      );
      setFillActualQuantity(false);
    } catch (error) {
      console.error("LOAD RELEASE ACTUAL DETAIL ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Không tải được dữ liệu xuất kho"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseDetail(id);
  }, [id]);

  const handleChangeActualQuantity = (rowId, value) => {
    setFillActualQuantity(false);
    setItems((prev) =>
      prev.map((item) =>
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
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        actual_quantity: item.requested_quantity,
      }))
    );
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
      alert(`Vui lòng nhập SL thực xuất cho vật tư ${invalidItem.goods_code}`);
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
            `SL yêu cầu: ${formatViNumber(overQuantityItem.requested_quantity, 2)}\n` +
            `SL thực xuất: ${formatViNumber(overQuantityItem.actual_quantity, 2)}`
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
    description: headerData.description || null,

    items: items.map((item) => ({
      item_id: item.item_id,
      goods_id: item.goods_id,
      goods_unit_id: item.goods_unit_id || null,
      requested_quantity: parseNumber(item.requested_quantity),

      // backend sẽ tự tính quantity_in_default_unit
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
      const payload = buildPayload();

      await updateReleaseOrder(releaseId, payload);

      alert("Lưu SL thực xuất thành công");
      navigate("/dashboard/activity/export/release");
    } catch (error) {
      console.error("SAVE ACTUAL RELEASE ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Lưu SL thực xuất thất bại"
      );
    }
  };

  const handleCompleteRelease = async () => {
    if (!canComplete && !canSaveActual) {
      alert("Bạn không có quyền hoàn thành xuất kho");
      return;
    }

    if (!validateBeforeSave()) return;

    try {
      const payload = buildPayload();

      // lưu SL thực xuất trước
      await updateReleaseOrder(releaseId, payload);

      // sau đó hoàn thành xuất kho
      await completeReleaseOrder(releaseId);

      alert("Hoàn thành xuất kho thành công");
      navigate("/dashboard/activity/export/release");
    } catch (error) {
      console.error("COMPLETE RELEASE ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Hoàn thành xuất kho thất bại"
      );
    }
  };

    if (loading) {
    return <div className="warehouse-order-release-page">Đang tải dữ liệu...</div>;
    }

    return (
    <div className="warehouse-order-release-page">
      <div className="import-order-detail-header">
        <div className="detail-header-left">
          <h2>Xuất kho vật tư {headerData.code || id}</h2>

          <select className="header-select" value="release" disabled>
            <option value="release">Xuất kho vật tư</option>
          </select>
        </div>

        <div className="detail-header-actions">
          <button
            className="header-icon-btn"
            onClick={() => navigate("/dashboard/activity/export/release")}
          >
            <RiCloseLine />
          </button>
        </div>
      </div>

      <div className="import-order-detail-body">
        <div className="info-section-title">Thông tin phiếu xuất kho</div>

        <div className="import-voucher-card">
          <div className="voucher-grid">
            <div className="form-group">
              <label>Kỳ</label>
              <input value={headerData.terms} disabled />
            </div>

            <div className="form-group">
              <label>Số phiếu XK</label>
              <input value={headerData.code} disabled />
            </div>

            <div className="form-group">
              <label>Ngày, tháng, năm XK</label>
              <input value={headerData.release_date} disabled />
            </div>

            <div className="form-group">
              <label>Xuất kho</label>
              <input value={headerData.warehouse_name} disabled />
            </div>

            <div className="form-group">
              <label>Đơn vị lĩnh vật tư</label>
              <input value={headerData.receiver_unit} disabled />
            </div>

            <div className="form-group">
              <label>Đối tượng xuất kho</label>
              <input value={headerData.release_target} disabled />
            </div>

            <div className="form-group description-group">
              <label>Diễn giải</label>
              <input value={headerData.description} disabled />
            </div>
          </div>
        </div>

        <div className="detail-section-title-row">
          <div className="detail-section-title">Chi tiết xuất kho</div>

          {!isPrintMode && canSaveActual && (
            <label className="fill-actual-toggle">
              <input
                type="checkbox"
                checked={fillActualQuantity}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFillActualQuantity(checked);

                  if (checked) {
                    handleFillActualQuantity();
                  }
                }}
              />
              <span>Nhập đầy đủ số lượng thực xuất</span>
            </label>
          )}
        </div>

        <div className="detail-card">
          <div className="order-detail-table-wrapper">
            <table className="order-detail-table">
            <colgroup>
                <col className="col-stt" />
                <col className="col-code" />
                <col className="col-name" />
                <col className="col-unit" />
                <col className="col-ratio" />
                <col className="col-requested" />
                <col className="col-actual" />
            </colgroup>

              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã VT</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th>Tỷ lệ chuyển đổi</th>
                  <th>SL yêu cầu</th>
                  <th>SL thực xuất</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7}>Không có chi tiết hàng hóa</td>
                  </tr>
                )}

                {items.map((item, index) => (
                  <tr key={item.id} className="goods-row">
                    <td>{index + 1}</td>

                    <td>
                        <div className="readonly-cell" title={item.goods_code}>
                            {item.goods_code || "-"}
                        </div>
                    </td>

                    <td>
                      <div className="readonly-cell" title={item.goods_name}>
                        {item.goods_name || "-"}
                      </div>
                    </td>

                    <td>
                        <div className="readonly-cell" title={item.goods_unit_name}>
                            {item.goods_unit_name || "-"}
                        </div>
                    </td>

                    <td className="number-col">
                        <div className="readonly-cell readonly-number-cell">
                            {formatViNumber(item.conversion_ratio, 3)}
                        </div>
                    </td>

                    <td className="number-col">
                        <div className="readonly-cell readonly-number-cell">
                            {item.requested_quantity}
                        </div>
                    </td>

                    <td className="number-col">
                        <input
                            className="table-number-input actual-quantity-input"
                            value={item.actual_quantity}
                            onChange={(e) =>
                            handleChangeActualQuantity(item.id, e.target.value)
                            }
                            disabled={isPrintMode ||!canSaveActual}
                        />
                    </td>
                  </tr>
                ))}

                {items.length > 0 && (
                  <tr className="table-total-row">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>

                    <td className="number-col">
                      {formatViNumber(
                        items.reduce(
                          (sum, item) =>
                            sum + parseNumber(item.requested_quantity),
                          0
                        ),
                        2
                      )}
                    </td>

                    <td className="number-col">
                      {formatViNumber(
                        items.reduce(
                          (sum, item) =>
                            sum + parseNumber(item.actual_quantity),
                          0
                        ),
                        2
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-bottom-bar">
            <div>
              Tổng số: <strong>{items.length}</strong>
            </div>
          </div>
        </div>
      </div>

        <div className="import-order-detail-footer">
            <button
                className="cancel-footer-btn"
                onClick={() => navigate("/dashboard/activity/export/release")}
            >
                {isPrintMode ? "Quay lại" : "Hủy"}
            </button>

            {isPrintMode && (
                <>
                <select
                    className="header-select"
                    value={printPaperSize}
                    onChange={(e) => setPrintPaperSize(e.target.value)}
                >
                    <option value="A4">In giấy A4</option>
                    <option value="A5">In giấy A5</option>
                </select>
                <button className="print-footer-btn" onClick={handlePrint}>
                    <RiPrinterLine />
                    In
                </button>
                </>
            )}

            {!isPrintMode && canSaveActual && (
                <button className="save-draft-btn" onClick={handleSaveActualQuantity}>
                <RiSave3Line />
                Lưu SL thực xuất
                </button>
            )}

            {!isPrintMode && (canComplete || canSaveActual) && (
                <button className="complete-btn" onClick={handleCompleteRelease}>
                <RiCheckboxCircleLine />
                Hoàn thành
                </button>
            )}
        </div>
    </div>
  );
}

export default WarehouseOrderRelease;