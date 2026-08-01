import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../../styles/InspectionDetailPage.css";

import {
  getWarehouseReceiptsPageable,
  getWarehouseReceiptByCode,
  updateWarehouseReceiptInventoriesActual,
  updateWarehouseReceiptStatus,
} from "../../../services/warehouseReceiptService";

import { useAuth } from "../../../contexts/AuthContext";


function InspectionDetailPage() {
  const { canDo } = useAuth();
  const [showWarehouseKeeperModal, setShowWarehouseKeeperModal] = useState(false);
  const [warehouseKeeperName, setWarehouseKeeperName] = useState("");
  const [inspectionOpinion, setInspectionOpinion] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const isCreateMode = !id || id === "new";
  const isPrintMode = searchParams.get("mode") === "print";

  const [receiptOptions, setReceiptOptions] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [receiptDetail, setReceiptDetail] = useState(null);
  const [savingAction, setSavingAction] = useState("");
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const canUpdateInspection = canDo(
  "update_warehouse_receipt_items"
);

  const canCompleteInspection = canDo(
    "complete_warehouse_receipt"
  );

  const isReceiptCompleted =
    String(receiptDetail?.status || "").toUpperCase() === "COMPLETED";
  

  const [form, setForm] = useState({
    inspection_code: "",
    warehouse_receipt_code: "",
  });

  const handleOpenWarehouseKeeperModal = () => {
    if (!form.warehouse_receipt_code) {
      alert("Vui lòng chọn phiếu nhập kho tham chiếu trước");
      return;
    }

    setWarehouseKeeperName("");
    setInspectionOpinion("Số lượng đủ, đạt yêu cầu");
    setShowWarehouseKeeperModal(true);
  };

  const unwrapData = (response) => response?.data || response;

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") return value;

    const text = String(value).trim();

    if (text.includes(",")) {
      return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
    }

    return Number(text) || 0;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const getInspectionCodeFromReceiptCode = (receiptCode) => {
    const text = String(receiptCode || "");
    const numbers = text.replace(/\D/g, "");

    if (!numbers) return "";

    return numbers;
  };

  const fetchReceiptOptions = async () => {
    try {
      setLoadingReceipts(true);

      const response = await getWarehouseReceiptsPageable({
        page: 1,
        page_size: 100,
        in_testing_page: 1,
      });

      const data = unwrapData(response);
      const results = Array.isArray(data?.results)
        ? data.results
        : [];

      setReceiptOptions(results);
    } catch (error) {
      console.error(
        "LOAD RECEIPT OPTIONS ERROR:",
        error.response?.data || error
      );

      alert("Không tải được danh sách phiếu nhập kho");
      setReceiptOptions([]);
    } finally {
      setLoadingReceipts(false);
    }
  };

const fetchReceiptDetail = async (receiptCode) => {
  if (!receiptCode) {
    setReceiptDetail(null);
    setDetailRows([]);
    return;
  }

  try {
    setLoadingDetail(true);

    const response = await getWarehouseReceiptByCode(receiptCode);
    const data = unwrapData(response);

    setReceiptDetail(data);

    const rows =
      data?.inventory_lines ||
      data?.inventory ||
      data?.items ||
      data?.details ||
      [];

    const mappedRows = Array.isArray(rows)
      ? rows.map((item, index) => {
          // BE kiểm tra accepted + rejected theo request_quantity.
          // Nếu không có request_quantity mới dùng original_quantity.
          const documentQuantity =
            item.request_quantity ??
            item.original_quantity ??
            item.document_quantity ??
            item.quantity ??
            0;

          const acceptedQuantity =
            item.accepted_quantity !== null &&
            item.accepted_quantity !== undefined &&
            item.accepted_quantity !== ""
              ? item.accepted_quantity
              : documentQuantity;

          const rejectedQuantity =
            item.rejected_quantity !== null &&
            item.rejected_quantity !== undefined &&
            item.rejected_quantity !== ""
              ? item.rejected_quantity
              : parseNumber(documentQuantity) -
                parseNumber(acceptedQuantity);

          return {
            id:
              item.inventory_id ||
              item.goods_id ||
              index + 1,

            inventory_id: item.inventory_id || "",
            goods_id: item.goods_id || "",
            goods_code: item.goods_code || "",
            goods_name: item.goods_name || "",
            unit_name:
              item.unit_name ||
              item.unit ||
              "",

            original_quantity: formatViNumber(
              documentQuantity,
              2
            ),

            accepted_quantity: formatViNumber(
              acceptedQuantity,
              2
            ),

            rejected_quantity: formatViNumber(
              rejectedQuantity,
              2
            ),
          };
        })
      : [];

    setDetailRows(mappedRows);
  } catch (error) {
    console.error(
      "LOAD RECEIPT DETAIL ERROR:",
      error.response?.data || error
    );

    alert("Không tải được chi tiết phiếu nhập kho");

    setReceiptDetail(null);
    setDetailRows([]);
  } finally {
    setLoadingDetail(false);
  }
};

  useEffect(() => {
    fetchReceiptOptions();
  }, []);

  useEffect(() => {
    if (id && id !== "new") {
      const inspectionCode = getInspectionCodeFromReceiptCode(id);

      setForm((prev) => ({
        ...prev,
        inspection_code: inspectionCode,
        warehouse_receipt_code: id,
      }));

      fetchReceiptDetail(id);
    }
  }, [id]);

  const handleChangeReceipt = (e) => {
    const receiptCode = e.target.value;
    const inspectionCode = getInspectionCodeFromReceiptCode(receiptCode);

    setForm((prev) => ({
      ...prev,
      warehouse_receipt_code: receiptCode,
      inspection_code: inspectionCode,
    }));

    fetchReceiptDetail(receiptCode);
  };

  const handleChangeAcceptedQuantity = (rowId, value) => {
    setDetailRows((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        const originalQuantity = parseNumber(item.original_quantity);
        const acceptedQuantity = parseNumber(value);
        const rejectedQuantity = originalQuantity - acceptedQuantity;

        return {
          ...item,
          accepted_quantity: value,
          rejected_quantity: formatViNumber(rejectedQuantity, 2),
        };
      })
    );
  };

const handleSave = async (isComplete = false) => {
  if (!canUpdateInspection) {
    alert("Bạn không có quyền cập nhật biên bản kiểm nghiệm");
    return;
  }

  if (isComplete && !canCompleteInspection) {
    alert("Bạn không có quyền hoàn thành phiếu nhập kho");
    return;
  }

  if (!form.inspection_code) {
    alert("Vui lòng nhập số biên bản kiểm nghiệm");
    return;
  }

  if (!form.warehouse_receipt_code) {
    alert("Vui lòng chọn phiếu nhập kho tham chiếu");
    return;
  }

  if (!receiptDetail?.id) {
    alert("Không tìm thấy ID phiếu nhập kho");
    return;
  }

  if (isReceiptCompleted) {
    alert("Phiếu nhập kho này đã hoàn thành");
    return;
  }

  if (detailRows.length === 0) {
    alert("Phiếu nhập kho chưa có chi tiết hàng hóa");
    return;
  }

  const invalidRow = detailRows.find((item) => {
    const documentQuantity = parseNumber(
      item.original_quantity
    );

    const acceptedQuantity = parseNumber(
      item.accepted_quantity
    );

    const rejectedQuantity = parseNumber(
      item.rejected_quantity
    );

    return (
      acceptedQuantity < 0 ||
      rejectedQuantity < 0 ||
      Math.abs(
        acceptedQuantity +
          rejectedQuantity -
          documentQuantity
      ) > 0.00001
    );
  });

  if (invalidRow) {
    alert(
      `Số lượng kiểm nghiệm của mã ${
        invalidRow.goods_code ||
        invalidRow.goods_name ||
        ""
      } không hợp lệ. Tổng số lượng đạt và không đạt phải bằng số lượng theo chứng từ.`
    );

    return;
  }

  if (isComplete) {
    const confirmed = window.confirm(
      "Bạn có chắc muốn hoàn thành kiểm nghiệm? Phiếu nhập kho sẽ chuyển sang trạng thái Đã hoàn thành và cập nhật tồn kho."
    );

    if (!confirmed) {
      return;
    }
  }

  // API inventories-actual chỉ nhận inventories.
  const payload = {
    inventories: detailRows.map((item) => ({
      inventory_id: item.inventory_id,

      accepted_quantity: parseNumber(
        item.accepted_quantity
      ),

      rejected_quantity: parseNumber(
        item.rejected_quantity
      ),
    })),
  };

  console.log(
    isComplete
      ? "COMPLETE INSPECTION INVENTORIES PAYLOAD:"
      : "SAVE INSPECTION DRAFT PAYLOAD:",
    payload
  );

  setSavingAction(isComplete ? "complete" : "draft");

  try {
    // Bước 1: lưu số lượng kiểm nghiệm.
    await updateWarehouseReceiptInventoriesActual(
      form.warehouse_receipt_code,
      payload
    );

    if (isComplete) {
      // Bước 2: chỉ nút Hoàn thành mới đổi status phiếu nhập.
      await updateWarehouseReceiptStatus(
        receiptDetail.id,
        {
          status: "COMPLETED",
        }
      );

      alert(
        "Hoàn thành kiểm nghiệm và cập nhật phiếu nhập kho thành công"
      );

      navigate("/dashboard/activity/import/inspection");
      return;
    }

    // Lưu tạm: không gọi API status, tiếp tục ở lại trang.
    await fetchReceiptDetail(
      form.warehouse_receipt_code
    );

    alert("Lưu tạm số liệu kiểm nghiệm thành công");
  } catch (error) {
    console.error(
      isComplete
        ? "COMPLETE INSPECTION ERROR:"
        : "SAVE INSPECTION DRAFT ERROR:",
      error.response?.data || error
    );

    const responseData = error.response?.data;

    const message =
      responseData?.message ||
      responseData?.detail ||
      responseData?.status ||
      responseData?.data?.status ||
      responseData?.data?.accepted_quantity ||
      (isComplete
        ? "Hoàn thành kiểm nghiệm thất bại"
        : "Lưu tạm kiểm nghiệm thất bại");

    alert(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  } finally {
    setSavingAction("");
  }
};

  const handleOpenReceiptReference = () => {
    if (!form.warehouse_receipt_code) {
      alert("Vui lòng chọn phiếu nhập kho tham chiếu trước");
      return;
    }

    const url = `/dashboard/activity/import/order-detail/${form.warehouse_receipt_code}?mode=print`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenInspectionPrint = () => {
    if (!form.warehouse_receipt_code) {
      alert("Vui lòng chọn phiếu nhập kho tham chiếu trước");
      return;
    }

    if (!warehouseKeeperName.trim()) {
      alert("Vui lòng nhập người thủ kho");
      return;
    }

    navigate(
      `/dashboard/activity/import/inspection/${form.warehouse_receipt_code}/print`,
      {
        state: {
          warehouseKeeperName: warehouseKeeperName.trim(),
          inspectionOpinion: inspectionOpinion.trim(),
        },
      }
    );
  };

  return (
    <div className="inspection-detail-page">
      <div className="inspection-detail-header">
        <div>
          <h2>
            {isCreateMode
              ? "Thêm biên bản kiểm nghiệm"
              : `Biên bản kiểm nghiệm ${form.inspection_code || ""}`}
          </h2>
          <p>Lập biên bản kiểm nghiệm theo phiếu nhập kho</p>
        </div>

        <div className="inspection-detail-actions">
          <button
            type="button"
            className="inspection-cancel-btn"
            onClick={() => navigate("/dashboard/activity/import/inspection")}
          >
            {isPrintMode ? "Quay lại" : "Hủy"}
          </button>
{isPrintMode ? (
  <button
    type="button"
    className="inspection-save-btn"
    onClick={handleOpenWarehouseKeeperModal}
  >
    In Biên bản kiểm nghiệm
  </button>
) : (
  canUpdateInspection && (
    <>
      <button
        type="button"
        className="inspection-draft-btn"
        onClick={() => handleSave(false)}
        disabled={
          Boolean(savingAction) ||
          loadingDetail ||
          isReceiptCompleted
        }
      >
        {savingAction === "draft"
          ? "Đang lưu..."
          : "Lưu tạm"}
      </button>

      {canCompleteInspection && (
        <button
          type="button"
          className="inspection-save-btn"
          onClick={() => handleSave(true)}
          disabled={
            Boolean(savingAction) ||
            loadingDetail ||
            isReceiptCompleted
          }
        >
          {savingAction === "complete"
            ? "Đang hoàn thành..."
            : isReceiptCompleted
            ? "Đã hoàn thành"
            : "Hoàn thành"}
        </button>
      )}
    </>
  )
)}
        </div>
      </div>

      <div className="inspection-edit-card">
        <div className="inspection-edit-title">
          <h3>Chỉnh sửa biên bản kiểm nghiệm</h3>
          <p>
            Chọn phiếu nhập kho tham chiếu, sau đó nhập số lượng đúng quy cách
            trong bảng chi tiết hàng hóa.
          </p>
        </div>

        <div className="inspection-form-grid">
          <div className="inspection-form-group">
            <label>Số biên bản kiểm nghiệm</label>
            <input
              name="inspection_code"
              value={form.inspection_code}
              placeholder="Tự động theo phiếu nhập kho"
              disabled
            />
          </div>

          <div className="inspection-form-group">
            <label>Tham chiếu phiếu nhập kho</label>
            <select
              name="warehouse_receipt_code"
              value={form.warehouse_receipt_code}
              onChange={handleChangeReceipt}
              disabled={isPrintMode}
            >
              <option value="">
                {loadingReceipts
                  ? "Đang tải phiếu nhập kho..."
                  : "-- Chọn phiếu nhập kho --"}
              </option>

              {receiptOptions.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.code || item.invoice_code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="inspection-reference-card">
        <div>
          <div className="inspection-reference-title">Tham chiếu</div>
          <div className="inspection-reference-text">
            Phiếu nhập kho:{" "}
            <strong>{form.warehouse_receipt_code || "Chưa chọn"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="inspection-reference-link-btn"
          onClick={handleOpenReceiptReference}
          disabled={!form.warehouse_receipt_code}
        >
          Mở phiếu nhập kho
        </button>
      </div>

      <div className="inspection-detail-card inspection-goods-card">
        <h3>Chi tiết hàng hóa</h3>

        <div className="inspection-goods-table-wrapper">
          <table className="inspection-goods-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã hàng</th>
                <th>Tên hàng</th>
                <th>Đơn vị tính</th>
                <th>Số lượng theo chứng từ</th>
                <th>Số lượng đúng quy cách, phẩm chất</th>
                <th>Số lượng không đúng quy cách, phẩm chất</th>
              </tr>
            </thead>

            <tbody>
              {loadingDetail && (
                <tr>
                  <td colSpan={7} className="inspection-empty-row">
                    Đang tải chi tiết hàng hóa...
                  </td>
                </tr>
              )}

              {!loadingDetail && detailRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="inspection-empty-row">
                    Chưa chọn phiếu nhập kho
                  </td>
                </tr>
              )}

              {!loadingDetail &&
                detailRows.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.goods_code || "-"}</td>
                    <td>{item.goods_name || "-"}</td>
                    <td>{item.unit_name || "-"}</td>

                    <td className="number-col">
                      {item.original_quantity || "0,00"}
                    </td>

                    <td>
                      <input
                        className="number-input"
                        value={item.accepted_quantity}
                        onChange={(e) =>
                          handleChangeAcceptedQuantity(item.id, e.target.value)
                        }
                        disabled={
                          isPrintMode ||
                          !canUpdateInspection ||
                          isReceiptCompleted ||
                          Boolean(savingAction)
                        }
                      />
                    </td>

                    <td className="number-col">
                      {item.rejected_quantity || "0,00"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
          {showWarehouseKeeperModal && (
          <div className="inspection-print-modal-overlay">
            <div className="inspection-print-modal">
              <div className="inspection-print-modal-header">
                <h3>Nhập thêm thông tin</h3>

                <button
                  type="button"
                  onClick={() => setShowWarehouseKeeperModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="inspection-print-modal-body">
                <label>Người thủ kho</label>
                <input
                  value={warehouseKeeperName}
                  onChange={(e) => setWarehouseKeeperName(e.target.value)}
                  placeholder="Nhập người thủ kho"
                />

                <label className="inspection-opinion-label">
                  Ý kiến của Ban kiểm nghiệm
                </label>
                <textarea
                  value={inspectionOpinion}
                  onChange={(e) => setInspectionOpinion(e.target.value)}
                  placeholder="Nhập ý kiến của Ban kiểm nghiệm"
                  rows={3}
                />
              </div>

              <div className="inspection-print-modal-footer">
                <button
                  type="button"
                  className="inspection-print-cancel-btn"
                  onClick={() => setShowWarehouseKeeperModal(false)}
                >
                  Hủy
                </button>

                <button
                  type="button"
                  className="inspection-print-confirm-btn"
                  onClick={handleOpenInspectionPrint}
                >
                  Đồng ý in
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default InspectionDetailPage;