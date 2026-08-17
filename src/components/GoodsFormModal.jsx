import { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiInformationLine,
} from "react-icons/ri";
import axiosInstance from "../services/authService";
import { createGoods, updateGoods, getGoodsDetail } from "../services/goodsService";
import { getGoodsUnits } from "../services/goodsUnitService";
import "../styles/GoodsFormModal.css";

const OTHER_GROUP_CODES = ["OTHER", "OTHERS", "KHAC"];

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

const isOtherGroup = (group) => {
  if (!group) return false;

  const code = String(group.code || "").trim().toUpperCase();
  const name = String(group.name || "").trim().toLowerCase();

  return (
    OTHER_GROUP_CODES.includes(code) ||
    name === "loại khác" ||
    name === "loai khac"
  );
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

  const selectedGroupIsOther = isOtherGroup(selectedGroup);
  const selectedGroupPrefix =
    selectedGroup && !selectedGroupIsOther ? selectedGroup.code : "";

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
      code: isOtherGroup(normalizedIncomingGroup)
        ? ""
        : normalizedIncomingGroup.code,
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
        code: nextGroup && !isOtherGroup(nextGroup) ? nextGroup.code : "",
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

  const handleSaveGoods = async () => {
    if (!formData.goods_group_id) {
      alert("Vui lòng chọn Nhóm vật tư");
      return;
    }

    if (!formData.code.trim() || !formData.name.trim() || !formData.unit_id) {
      alert("Vui lòng nhập đầy đủ Mã hàng, Tên hàng và ĐVT tính");
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

      alert(
        error.response?.data?.code ||
          error.response?.data?.name ||
          error.response?.data?.detail ||
          "Lưu hàng hóa thất bại"
      );
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
                        <RiInformationLine />
                        Mã sẽ bắt đầu bằng ký hiệu nhóm{" "}
                        <strong>{selectedGroupPrefix}</strong>. Hệ thống không tự
                        sinh số thứ tự.
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
                        1 {conversionUnitName || "ĐV"} ={" "}
                        <strong>{item.ratio || "..."}</strong>{" "}
                        {primaryUnitName || "ĐVT chính"}
                      </div>

                      <button
                        type="button"
                        className="remove-conversion-btn"
                        title={
                          item.is_existing
                            ? "Đơn vị đã lưu không được xóa"
                            : "Xóa đơn vị"
                        }
                        disabled={item.is_existing}
                        onClick={() =>
                          handleRemoveConversionUnit(item.temp_id)
                        }
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
                  Ví dụ: ĐVT chính là kg, 1 tấn = 1000 kg thì hệ số của tấn là
                  1000.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="goods-modal-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Hủy
          </button>

          <button type="button" className="save-btn" onClick={handleSaveGoods}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoodsFormModal;