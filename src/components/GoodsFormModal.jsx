import { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiInformationLine,
  RiSettings3Line,
} from "react-icons/ri";
import axiosInstance from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { createGoods, updateGoods, getGoodsDetail } from "../services/goodsService";
import { getGoodsUnits } from "../services/goodsUnitService";
import "../styles/GoodsFormModal.css";


const normalizeGroup = (group) => ({
  ...group,
  id: group?.id ?? group?.group_id ?? "",
  code: String(group?.code || "").trim(),
  name: String(group?.name || "").trim(),
});

const extractGroups = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload.map(normalizeGroup);
  }

  if (Array.isArray(payload?.results)) {
    return payload.results.map(normalizeGroup);
  }

  return [];
};


function GoodsFormModal({
  editingGoods = null,
  presetGroup = null,
  initialGoodsGroup = null,
  goodsGroup = null,
  onClose,
  onSuccess,
}) {
  const incomingGroup = presetGroup || initialGoodsGroup || goodsGroup || null;

  const { canDo } = useAuth();
  const canManageGoodsConfig = canDo("manage_goods_config");

  const [showWarningConfig, setShowWarningConfig] = useState(false);
  const [warningConfig, setWarningConfig] = useState({
    organization_min_quantity: "",
    organization_max_quantity: "",
  });
  const [initialWarningConfig, setInitialWarningConfig] = useState({
    organization_min_quantity: null,
    organization_max_quantity: null,
  });
  const [warningErrors, setWarningErrors] = useState({});

  const [unitList, setUnitList] = useState([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [conversionUnits, setConversionUnits] = useState([]);

  const [groupList, setGroupList] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: null,
    selling_description: null,
    buying_description: null,
    goods_group_id: incomingGroup?.id || "",
    unit_id: "",
  });

  const editingGoodsId = editingGoods?.id || null;

  const selectedGroup = useMemo(() => {
    return (
      groupList.find(
        (group) => String(group.id) === String(formData.goods_group_id)
      ) ||
      (incomingGroup &&
      String(incomingGroup.id) === String(formData.goods_group_id)
        ? normalizeGroup(incomingGroup)
        : null)
    );
  }, [formData.goods_group_id, groupList, incomingGroup]);

  const selectedGroupPrefix = selectedGroup?.code || "";

  const getUnitNameById = (unitId) => {
    return (
      unitList.find((unit) => String(unit.id) === String(unitId))?.name || ""
    );
  };

  const primaryUnitName = getUnitNameById(formData.unit_id);

  const codeSuffix = useMemo(() => {
    if (editingGoodsId || !selectedGroupPrefix) return formData.code;

    const currentCode = String(formData.code || "");

    if (
      currentCode
        .toUpperCase()
        .startsWith(String(selectedGroupPrefix).toUpperCase())
    ) {
      return currentCode.slice(selectedGroupPrefix.length);
    }

    return currentCode;
  }, [editingGoodsId, formData.code, selectedGroupPrefix]);

  const fetchGoodsUnits = async () => {
    try {
      setUnitLoading(true);

      const response = await getGoodsUnits({
        search: "",
        page: 1,
        page_size: 100,
      });

      const payload = response?.data || response;

      const results = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : [];

      setUnitList(results);
    } catch (error) {
      console.error("GET GOODS UNITS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách đơn vị tính");
      setUnitList([]);
    } finally {
      setUnitLoading(false);
    }
  };

  const fetchGoodsGroups = async () => {
    try {
      setGroupLoading(true);

      const response = await axiosInstance.get("/inventory/goods-groups");
      setGroupList(extractGroups(response));
    } catch (error) {
      console.error("GET GOODS GROUPS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách nhóm vật tư");
      setGroupList([]);
    } finally {
      setGroupLoading(false);
    }
  };

  useEffect(() => {
    fetchGoodsUnits();
    fetchGoodsGroups();
  }, []);

  useEffect(() => {
    if (editingGoodsId || !incomingGroup?.id) return;

    const normalizedIncomingGroup = normalizeGroup(incomingGroup);

    setFormData((prev) => ({
      ...prev,
      goods_group_id: normalizedIncomingGroup.id,
      code: normalizedIncomingGroup.code || "",
    }));
  }, [editingGoodsId, incomingGroup?.id]);

  useEffect(() => {
    if (!editingGoodsId) return;

    let cancelled = false;

    const fetchGoodsDetail = async () => {
      try {
        const response = await getGoodsDetail(editingGoodsId);
        const goods = response?.data || response;

        if (cancelled || !goods) return;

        const defaultUnit = Array.isArray(goods.units)
          ? goods.units.find((unit) => unit.is_default)
          : null;

        const conversionUnitList = Array.isArray(goods.units)
          ? goods.units
              .filter((unit) => !unit.is_default)
              .map((unit) => ({
                temp_id: unit.id || Date.now() + Math.random(),
                unit_id: unit.unit_id || "",
                ratio: unit.conversion_ratio || "",
                is_existing: true,
              }))
          : [];

        setFormData({
          code: goods.code || "",
          name: goods.name || "",
          // Giữ nguyên các field cũ trong state/payload để khi sửa không làm mất dữ liệu BE đã lưu.
          description: goods.description || null,
          selling_description: goods.selling_description || null,
          buying_description: goods.buying_description || null,
          goods_group_id:
            goods.goods_group_id ||
            goods.group_id ||
            goods.goods_group?.id ||
            "",
          unit_id: defaultUnit?.unit_id || goods.unit_id || "",
        });

        const initialMin = goods.organization_min_quantity ?? null;
        const initialMax = goods.organization_max_quantity ?? null;

        setWarningConfig({
          organization_min_quantity:
            initialMin === null ? "" : String(initialMin),
          organization_max_quantity:
            initialMax === null ? "" : String(initialMax),
        });

        setInitialWarningConfig({
          organization_min_quantity: initialMin,
          organization_max_quantity: initialMax,
        });

        setConversionUnits(conversionUnitList);
      } catch (error) {
        console.error("GET GOODS DETAIL ERROR:", error.response?.data || error);
        alert("Không tải được thông tin hàng hóa");
      }
    };

    fetchGoodsDetail();

    return () => {
      cancelled = true;
    };
  }, [editingGoodsId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangeGroup = (e) => {
    const groupId = e.target.value;

    const nextGroup = groupList.find(
      (group) => String(group.id) === String(groupId)
    );

    setFormData((prev) => {
      // Khi sửa hàng hóa: giữ nguyên mã hiện tại, chỉ đổi group_id.
      if (editingGoodsId) {
        return {
          ...prev,
          goods_group_id: groupId,
        };
      }

      // Khi thêm mới: chọn nhóm trước rồi mới tạo mã với prefix của nhóm.
      return {
        ...prev,
        goods_group_id: groupId,
        code: nextGroup?.code || "",
      };
    });
  };

  const handleChangeNewCodeSuffix = (e) => {
    const value = e.target.value;

    if (!selectedGroupPrefix) {
      setFormData((prev) => ({
        ...prev,
        code: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      code: `${selectedGroupPrefix}${value}`,
    }));
  };

  const handleAddConversionUnit = () => {
    setConversionUnits((prev) => [
      ...prev,
      {
        temp_id: Date.now() + Math.random(),
        unit_id: "",
        ratio: "",
        is_existing: false,
      },
    ]);
  };

  const handleChangePrimaryUnit = (e) => {
    // Hàng hóa đã tồn tại => KHÔNG cho đổi ĐVT chính
    if (editingGoodsId) return;

    setFormData((prev) => ({
      ...prev,
      unit_id: e.target.value,
    }));
  };

  const handleRemoveConversionUnit = (tempId) => {
    const targetUnit = conversionUnits.find((item) => item.temp_id === tempId);

    if (!targetUnit) return;

    // ĐVT đã lưu => tuyệt đối không cho xóa
    if (targetUnit.is_existing) return;

    // Chỉ xóa ĐVT vừa thêm mới, chưa lưu
    setConversionUnits((prev) =>
      prev.filter((item) => item.temp_id !== tempId)
    );
  };

  const handleChangeConversionUnit = (tempId, field, value) => {
    const targetUnit = conversionUnits.find((item) => item.temp_id === tempId);

    if (!targetUnit) return;

    // ĐVT đã lưu => không cho sửa bất kỳ thông tin nào
    if (targetUnit.is_existing) return;

    setConversionUnits((prev) =>
      prev.map((item) =>
        item.temp_id === tempId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleWarningConfigChange = (field, value) => {
    setWarningConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    setWarningErrors((prev) => ({
      ...prev,
      [field]: "",
      range: "",
    }));
  };

  const validateWarningQuantity = (value, label) => {
    const text = String(value ?? "").trim();

    if (!text) return "";

    if (text.startsWith("-")) {
      return `${label} không được nhỏ hơn 0`;
    }

    if (!/^\d+(?:\.\d{1,5})?$/.test(text)) {
      return `${label} phải là số từ 0 trở lên và tối đa 5 chữ số thập phân`;
    }

    return "";
  };

  const validateWarningConfig = () => {
    if (!canManageGoodsConfig) return true;

    const minText = String(
      warningConfig.organization_min_quantity ?? ""
    ).trim();
    const maxText = String(
      warningConfig.organization_max_quantity ?? ""
    ).trim();

    const minError = validateWarningQuantity(
      minText,
      "Số lượng tối thiểu"
    );
    const maxError = validateWarningQuantity(
      maxText,
      "Số lượng tối đa"
    );

    const nextErrors = {
      organization_min_quantity: minError,
      organization_max_quantity: maxError,
      range: "",
    };

    if (!minError && !maxError && minText && maxText) {
      if (Number(minText) > Number(maxText)) {
        nextErrors.organization_min_quantity =
          "Số lượng tối thiểu không được lớn hơn số lượng tối đa";
        nextErrors.range = "min_gt_max";
      }
    }

    setWarningErrors(nextErrors);

    return !nextErrors.organization_min_quantity &&
      !nextErrors.organization_max_quantity;
  };

  // Theo tài liệu BE:
  // - không đổi => không gửi field
  // - xóa trắng giá trị đang có => gửi null
  // - có số => gửi STRING, tuyệt đối không Number()
  const appendChangedWarningConfig = (payload) => {
    if (!canManageGoodsConfig) return;

    [
      "organization_min_quantity",
      "organization_max_quantity",
    ].forEach((field) => {
      const currentValue = String(warningConfig[field] ?? "").trim();
      const initialRawValue = initialWarningConfig[field];
      const initialValue =
        initialRawValue === null || initialRawValue === undefined
          ? ""
          : String(initialRawValue).trim();

      if (currentValue === initialValue) return;

      if (currentValue === "") {
        // Chỉ gửi null khi trước đó thật sự có định mức.
        if (initialValue !== "") {
          payload[field] = null;
        }
        return;
      }

      payload[field] = currentValue;
    });
  };

  const handleSaveGoods = async () => {
    if (!formData.goods_group_id) {
      alert("Vui lòng chọn Nhóm vật tư");
      return;
    }

    if (!formData.code.trim() || !formData.name.trim() || !formData.unit_id) {
      alert("Vui lòng nhập đầy đủ Mã hàng, Tên hàng và ĐVT tính");
      return;
    }

    if (!validateWarningConfig()) {
      if (canManageGoodsConfig) {
        setShowWarningConfig(true);
      }
      return;
    }

    const validConversionUnits = conversionUnits.filter(
      (item) => item.unit_id && item.ratio
    );

    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),

      // Không hiển thị trên form mới nhưng vẫn giữ payload cũ
      // để cập nhật hàng hóa không làm mất dữ liệu đã có.
      description: formData.description || null,
      selling_description: formData.selling_description || null,
      buying_description: formData.buying_description || null,

      goods_group_id: formData.goods_group_id || null,

      units: [
        {
          unit_id: formData.unit_id,
          conversion_ratio: 1,
          is_default: true,
        },
        ...validConversionUnits.map((item) => ({
          unit_id: item.unit_id,
          conversion_ratio: Number(item.ratio),
          is_default: false,
        })),
      ],
    };

    appendChangedWarningConfig(payload);

    try {
      const response = await (editingGoodsId
        ? updateGoods(editingGoodsId, payload)
        : createGoods(payload));

      alert(
        editingGoodsId
          ? "Cập nhật hàng hóa thành công"
          : "Thêm hàng hóa thành công"
      );

      onSuccess?.(response?.data || response);
    } catch (error) {
      console.error("SAVE GOODS ERROR:", error.response?.data || error);

      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.code ||
        error.response?.data?.name;

      if (error.response?.status === 403 && !apiMessage) {
        alert("Bạn không có quyền đặt định mức vật tư");
        return;
      }

      alert(apiMessage || "Lưu hàng hóa thất bại");
    }
  };

  return (
    <div className="goods-modal-overlay">
      <div className="goods-modal goods-modal--modern">
        <div className="goods-modal-header">
          <div>
            <h2>{editingGoodsId ? "Sửa hàng hóa" : "Thêm hàng hóa"}</h2>
            {!editingGoodsId && (
              <p>Chọn nhóm vật tư trước, sau đó nhập thông tin hàng hóa.</p>
            )}
          </div>

          <button
            type="button"
            className="goods-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="goods-modal-body">
          <div className="goods-form-main">
            <div className="goods-form-card">
              <div className="goods-form-card-title">Thông tin hàng hóa</div>

              <div className="goods-form-grid">
                <div className="form-group goods-group-field">
                  <label>
                    Nhóm vật tư <span>*</span>
                  </label>

                  <select
                    name="goods_group_id"
                    value={formData.goods_group_id}
                    onChange={handleChangeGroup}
                  >
                    <option value="">
                      {groupLoading ? "Đang tải nhóm..." : "Chọn nhóm vật tư"}
                    </option>

                    {groupList.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.code} - {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.goods_group_id && (
                  <div className="form-group">
                    <label>
                      Mã hàng hóa <span>*</span>
                    </label>

                    {editingGoodsId ? (
                      <input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="Nhập mã hàng"
                      />
                    ) : selectedGroupPrefix ? (
                      <div className="goods-code-input">
                        <span className="goods-code-prefix">
                          {selectedGroupPrefix}
                        </span>
                        <input
                          value={codeSuffix}
                          onChange={handleChangeNewCodeSuffix}
                          placeholder="Nhập phần còn lại"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="Nhập mã hàng"
                        autoFocus
                      />
                    )}

                    {!editingGoodsId && selectedGroupPrefix && (
                      <div className="field-helper">
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group goods-name-field">
                  <label>
                    Tên hàng hóa <span>*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập tên hàng hóa"
                  />
                </div>

                <div className="form-group">
                  <label>
                    ĐVT chính <span>*</span>
                  </label>

                  <select
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleChangePrimaryUnit}
                    disabled={!!editingGoodsId}
                  >
                    <option value="">
                      {unitLoading ? "Đang tải ĐVT..." : "Chọn ĐVT chính"}
                    </option>

                    {unitList.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>

                  {editingGoodsId && (
                    <div className="field-helper">
                      ĐVT chính của hàng hóa đã lưu không được thay đổi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="goods-units-panel">
            <div className="goods-units-panel-header">
              <div>
                <h3>Đơn vị tính & quy đổi</h3>
                <p>ĐVT chính có hệ số quy đổi bằng 1.</p>
              </div>

              <button
                type="button"
                className="add-conversion-btn add-conversion-btn--text"
                onClick={handleAddConversionUnit}
              >
                <RiAddLine />
                Thêm đơn vị
              </button>
            </div>

            <div className="primary-unit-summary">
              <div>
                <span>Đơn vị tính chính</span>
                <strong>{primaryUnitName || "Chưa chọn"}</strong>
              </div>
              <div>
                <span>Hệ số</span>
                <strong>1</strong>
              </div>
              <span className="primary-unit-badge">Mặc định</span>
            </div>

            {conversionUnits.length > 0 ? (
              <div className="conversion-list">
                {conversionUnits.map((item, index) => {
                  const conversionUnitName = getUnitNameById(item.unit_id);

                  return (
                    <div
                      className={`conversion-row ${
                        item.is_existing ? "conversion-row--locked" : ""
                      }`}
                      key={item.temp_id}
                    >
                      <div className="conversion-row-number">{index + 1}</div>

                      <div className="form-group">
                        <label>Đơn vị tính</label>
                        <select
                          value={item.unit_id}
                          disabled={item.is_existing}
                          onChange={(e) =>
                            handleChangeConversionUnit(
                              item.temp_id,
                              "unit_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            {unitLoading
                              ? "Đang tải ĐVT..."
                              : "Chọn đơn vị"}
                          </option>

                          {unitList.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Hệ số quy đổi</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.ratio}
                          disabled={item.is_existing}
                          onChange={(e) =>
                            handleChangeConversionUnit(
                              item.temp_id,
                              "ratio",
                              e.target.value
                            )
                          }
                          placeholder="Ví dụ: 10"
                        />
                      </div>

                      <div className="conversion-row-preview">
                        1 {primaryUnitName || "ĐVT chính"} ={" "}
                        <strong>{item.ratio || "..."}</strong>{" "}
                        {conversionUnitName || "ĐV"}
                      </div>
                      <button
                        type="button"
                        className="remove-conversion-btn"
                        title="Tạm thời không cho phép xóa"
                        disabled
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="conversion-empty">
                <p>Chưa có đơn vị chuyển đổi.</p>
                <span>
                  Chỉ thêm khi hàng hóa có đơn vị khác ngoài ĐVT chính.
                </span>
              </div>
            )}
            <div className="conversion-guide">
              <RiInformationLine />
              <div>
                <strong>Cách nhập hệ số</strong>
                <span>
                  Hệ số cho biết 1 ĐVT chính tương đương bao nhiêu ĐVT quy đổi.
                  Ví dụ: ĐVT chính là Cuộn, 1 Cuộn = 100 m thì nhập hệ số 100
                  cho đơn vị m.
                </span>
              </div>
            </div>
          </div>

          {canManageGoodsConfig && showWarningConfig && (
            <div className="goods-warning-config-panel">
              <div className="goods-warning-config-header">
                <div>
                  <h3>Định mức cảnh báo tồn kho</h3>
                  <p>
                    Định mức tính trên tổng tồn của tất cả kho. Chỉ dùng để
                    cảnh báo, không chặn nhập/xuất kho.
                  </p>
                </div>
              </div>

              <div className="goods-warning-config-grid">
                <div className="form-group">
                  <label>Số lượng tối thiểu</label>
                  <div className="warning-quantity-input">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={warningConfig.organization_min_quantity}
                      onChange={(e) =>
                        handleWarningConfigChange(
                          "organization_min_quantity",
                          e.target.value
                        )
                      }
                      placeholder="Chưa đặt"
                    />
                    <span>{primaryUnitName || "ĐVT chính"}</span>
                  </div>
                  {warningErrors.organization_min_quantity && (
                    <div className="warning-config-error">
                      {warningErrors.organization_min_quantity}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Số lượng tối đa</label>
                  <div className="warning-quantity-input">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={warningConfig.organization_max_quantity}
                      onChange={(e) =>
                        handleWarningConfigChange(
                          "organization_max_quantity",
                          e.target.value
                        )
                      }
                      placeholder="Chưa đặt"
                    />
                    <span>{primaryUnitName || "ĐVT chính"}</span>
                  </div>
                  {warningErrors.organization_max_quantity && (
                    <div className="warning-config-error">
                      {warningErrors.organization_max_quantity}
                    </div>
                  )}
                </div>
              </div>

              <div className="goods-warning-config-note">
                <RiInformationLine />
              </div>
            </div>
          )}
        </div>

        <div className="goods-modal-footer">
          <div className="goods-modal-footer-left">
            {canManageGoodsConfig && (
              <button
                type="button"
                className={`warning-config-toggle-btn ${
                  showWarningConfig ? "warning-config-toggle-btn--active" : ""
                }`}
                onClick={() => setShowWarningConfig((prev) => !prev)}
              >
                <RiSettings3Line />
                Điều chỉnh thông số mức cảnh báo khi hàng hóa dưới mức
              </button>
            )}
          </div>

          <div className="goods-modal-footer-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>

            <button type="button" className="save-btn" onClick={handleSaveGoods}>
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoodsFormModal;