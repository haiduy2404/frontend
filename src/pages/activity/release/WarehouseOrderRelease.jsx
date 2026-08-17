import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/WarehouseOrderRelease.css";
import { getUserNames } from "../../../services/authService";
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
  RiLoader4Line,
} from "react-icons/ri";

const EMPTY_RELEASE_SIGNERS = {
  cungTieu: "",
  thuKho: "",
  phongKHVT: "",
  giamDoc: "",
};

const RELEASE_SIGNERS_STORAGE_KEY =
  "warehouse-release-signers-session";

const getStoredReleaseSigners = () => {
  try {
    const rawValue = sessionStorage.getItem(
      RELEASE_SIGNERS_STORAGE_KEY
    );

    if (!rawValue) {
      return { ...EMPTY_RELEASE_SIGNERS };
    }

    const parsedValue = JSON.parse(rawValue);

    return {
      ...EMPTY_RELEASE_SIGNERS,
      ...(parsedValue || {}),
    };
  } catch (error) {
    console.error(
      "READ RELEASE SIGNERS STORAGE ERROR:",
      error
    );

    return { ...EMPTY_RELEASE_SIGNERS };
  }
};

const normalizePosition = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const RELEASE_SIGNER_DEFINITIONS = {
  cungTieu: {
    key: "cungTieu",
    label: "PT cung tiêu",
    match: (position) => position.includes("cung tieu"),
  },

  thuKho: {
    key: "thuKho",
    label: "Thủ kho",
    match: (position) => position.startsWith("thu kho"),
  },

  phongKHVT: {
    key: "phongKHVT",
    label: "Phòng KHVT",
    match: (position) =>
      position === "tp khvt" ||
      position.includes("phong khvt") ||
      position.includes("truong phong khvt"),
  },

  giamDoc: {
    key: "giamDoc",
    label: "Giám đốc",
    match: (position) => position.includes("giam doc"),
  },
};

const PRINT_SIGNER_KEYS = {
  industrialA4: [
    "cungTieu",
    "thuKho",
    "phongKHVT",
    "giamDoc",
  ],

  industrialA5: [
    "cungTieu",
    "thuKho",
    "phongKHVT",
    "giamDoc",
  ],

  applicationA5: [
    "cungTieu",
    "thuKho",
    "phongKHVT",
    "giamDoc",
  ],

  processingA5: [
    "thuKho",
    "cungTieu",
  ],
};

const PRINT_FORM_NAMES = {
  industrialA4: "A4 Công nghiệp",
  industrialA5: "A5 Công nghiệp",
  applicationA5: "A5 Vận dụng",
  processingA5: "A5 Chế biến",
};

function WarehouseOrderRelease() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canDo } = useAuth();

  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get("mode") === "print";
  const [printForm, setPrintForm] = useState("industrialA4");
  const [showPrintSignerModal, setShowPrintSignerModal] =
  useState(false);

  const [signerUsers, setSignerUsers] = useState([]);
  const [signerUsersLoading, setSignerUsersLoading] =
    useState(false);

const [printSigners, setPrintSigners] = useState(
  getStoredReleaseSigners
);

useEffect(() => {
  try {
    sessionStorage.setItem(
      RELEASE_SIGNERS_STORAGE_KEY,
      JSON.stringify(printSigners)
    );
  } catch (error) {
    console.error(
      "SAVE RELEASE SIGNERS STORAGE ERROR:",
      error
    );
  }
}, [printSigners]);

const extractUserList = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  return [];
};

const activeSignerFields = (
  PRINT_SIGNER_KEYS[printForm] || []
).map((key) => RELEASE_SIGNER_DEFINITIONS[key]);

const loadSignerUsers = async () => {
  try {
    setSignerUsersLoading(true);

    const response = await getUserNames();

    const users = extractUserList(response)
      .filter((user) => {
        const fullName = String(
          user?.full_name || ""
        ).trim();

        return (
          fullName &&
          !fullName.toLowerCase().includes("test")
        );
      })
      .sort((a, b) =>
        String(a.full_name).localeCompare(
          String(b.full_name),
          "vi"
        )
      );

    setSignerUsers(users);
  } catch (error) {
    console.error(
      "LOAD RELEASE SIGNERS ERROR:",
      error.response?.data || error
    );

    setSignerUsers([]);

    alert(
      error.response?.data?.message ||
        "Không tải được danh sách người ký"
    );
  } finally {
    setSignerUsersLoading(false);
  }
};

const getUsersBySignerField = (field) => {
  return signerUsers.filter((user) => {
    const position = normalizePosition(
      user.position?.name ||
        user.position_name ||
        user.position ||
        ""
    );

    return field.match(position);
  });
};

const handleChangePrintSigner = (key, fullName) => {
  setPrintSigners((previous) => ({
    ...previous,
    [key]: fullName,
  }));
};

const handleOpenPrintSignerModal = async () => {
  const releaseCode = headerData.code || id;

  if (!releaseCode) {
    alert("Không tìm thấy mã phiếu xuất kho");
    return;
  }

  // Mở modal nhưng không xóa những tên đã chọn
  setShowPrintSignerModal(true);

  // Chỉ tải danh sách người dùng ở lần mở đầu tiên
  if (signerUsers.length === 0) {
    await loadSignerUsers();
  }
};

const handleConfirmPrint = () => {
  const releaseCode = headerData.code || id;

  const printRoutes = {
    industrialA4:
      `/dashboard/activity/export/release-print-industrial-a4/${releaseCode}`,

    industrialA5:
      `/dashboard/activity/export/release-print-industrial-a5/${releaseCode}`,

    applicationA5:
      `/dashboard/activity/export/release-print-application-a5/${releaseCode}`,

    processingA5:
      `/dashboard/activity/export/release-print-processing-a5/${releaseCode}`,
  };

  const printState = {
    signerCungTieu: String(
      printSigners.cungTieu || ""
    ).trim(),

    signerThuKho: String(
      printSigners.thuKho || ""
    ).trim(),

    signerPhongKHVT: String(
      printSigners.phongKHVT || ""
    ).trim(),

    signerGiamDoc: String(
      printSigners.giamDoc || ""
    ).trim(),

    printForm,
  };

  setShowPrintSignerModal(false);

  navigate(printRoutes[printForm], {
    state: printState,
  });
};
  const canSaveActual =
    canDo("update_actual_released_quantity") ||
    canDo("update_warehouse_release");

  const canComplete = canDo("complete_warehouse_release");

  const [releaseId, setReleaseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [fillActualQuantity, setFillActualQuantity] = useState(false);

  const [headerData, setHeaderData] = useState({
    code: "",
    terms: "",
    release_date: "",
    warehouse_id: "",
    warehouse_name: "",
    receiver_unit: "",
    release_target: "",
    contract_number: "",
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
    contract_number: headerData.contract_number?.trim() || null,
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
    if (completing) return;

    if (!canComplete && !canSaveActual) {
      alert("Bạn không có quyền hoàn thành xuất kho");
      return;
    }

    if (!validateBeforeSave()) return;

    const voucherCode = headerData.code || id || releaseId;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hoàn thành phiếu ${voucherCode} không?`
    );

    if (!confirmed) return;

    try {
      setCompleting(true);

      // Đợi React render vòng loading và chữ "Đang hoàn thành..."
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // Random từ 0,7 giây đến 1,5 giây
      const randomLoadingTime =
        Math.floor(Math.random() * (1500 - 700 + 1)) + 700;

      // Loading xong mới bắt đầu gửi API
      await new Promise((resolve) =>
        setTimeout(resolve, randomLoadingTime)
      );

      const payload = buildPayload();

      // Lưu số lượng thực xuất
      await updateReleaseOrder(releaseId, payload);

      // Sau đó mới hoàn thành phiếu
      await completeReleaseOrder(releaseId);

      alert(`Hoàn thành phiếu ${voucherCode} thành công.`);

      navigate("/dashboard/activity/export/release");
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
              <label>Hợp đồng số</label>
              <input
                value={headerData.contract_number || ""}
                placeholder="Không có số hợp đồng"
                disabled
              />
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
                  value={printForm}
                  onChange={(e) => setPrintForm(e.target.value)}
                >
                  <option value="industrialA4">In giấy A4 (Công nghiệp)</option>
                  <option value="industrialA5">In giấy A5 (Công nghiệp)</option>
                  <option value="applicationA5">In giấy A5 (Vận dụng)</option>
                  <option value="processingA5">In giấy A5 (Chế biến)</option>
                </select>
                <button
                  className="print-footer-btn"
                  onClick={handleOpenPrintSignerModal}
                >
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
                <button
                  className="complete-btn"
                  onClick={handleCompleteRelease}
                  disabled={completing}
                >
                  {completing ? (
                    <>
                      <RiLoader4Line className="complete-loading-icon" />
                      Đang hoàn thành...
                    </>
                  ) : (
                    <>
                      <RiCheckboxCircleLine />
                      Hoàn thành
                    </>
                  )}
                </button>
            )}
        </div>
        {showPrintSignerModal && (
  <div className="release-print-signer-overlay">
    <div className="release-print-signer-modal">
      <div className="release-print-signer-header">
        <h3>
          Chọn người ký – {PRINT_FORM_NAMES[printForm]}
        </h3>

        <button
          type="button"
          onClick={() => setShowPrintSignerModal(false)}
        >
          ×
        </button>
      </div>

      <div className="release-print-signer-body">
        {signerUsersLoading ? (
          <div className="release-print-signer-loading">
            <RiLoader4Line className="release-signer-loading-icon" />
            <span>Đang tải danh sách người ký...</span>
          </div>
        ) : (
          <div className="release-print-signer-grid">
            {activeSignerFields.map((field) => {
              const users = getUsersBySignerField(field);

              return (
                <div
                  className="release-print-signer-field"
                  key={field.key}
                >
                  <label>{field.label}</label>

                  <select
                    value={printSigners[field.key]}
                    onChange={(event) =>
                      handleChangePrintSigner(
                        field.key,
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Chọn {field.label.toLowerCase()}
                    </option>

                    {users.map((user) => (
                      <option
                        key={
                          user.id ||
                          user.username ||
                          `${field.key}-${user.full_name}`
                        }
                        value={user.full_name}
                      >
                        {user.full_name}
                      </option>
                    ))}
                  </select>

                  {users.length === 0 && (
                    <small>
                      Không có người dùng thuộc position này
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="release-print-signer-footer">
        <button
          type="button"
          className="release-signer-cancel-btn"
          onClick={() => setShowPrintSignerModal(false)}
        >
          Hủy
        </button>

        <button
          type="button"
          className="release-signer-confirm-btn"
          onClick={handleConfirmPrint}
          disabled={signerUsersLoading}
        >
          <RiPrinterLine />
          Đồng ý in
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default WarehouseOrderRelease;