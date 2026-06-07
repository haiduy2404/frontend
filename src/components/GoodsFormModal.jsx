import { useEffect, useState } from "react";
import { createGoods, updateGoods } from "../services/goodsService";
import { getGoodsUnits } from "../services/goodsUnitService";
import "../styles/GoodsListPage.css";

function GoodsFormModal({
  editingGoods = null,
  onClose,
  onSuccess,
}) {
  const [unitList, setUnitList] = useState([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [conversionUnits, setConversionUnits] = useState([]);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: null,
    selling_description: null,
    buying_description: null,
    goods_group_id: "",
    unit_id: "",
  });

  const editingGoodsId = editingGoods?.id || null;

  const getUnitNameById = (unitId) => {
    return unitList.find((unit) => String(unit.id) === String(unitId))?.name || "";
  };

  const primaryUnitName = getUnitNameById(formData.unit_id);

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

  useEffect(() => {
    fetchGoodsUnits();
  }, []);

  useEffect(() => {
    if (!editingGoods) return;

    const defaultUnit = Array.isArray(editingGoods.units)
      ? editingGoods.units.find((unit) => unit.is_default)
      : null;

    const conversionUnitList = Array.isArray(editingGoods.units)
      ? editingGoods.units
          .filter((unit) => !unit.is_default)
          .map((unit) => ({
            temp_id: unit.id || Date.now() + Math.random(),
            unit_id: unit.unit_id || "",
            ratio: unit.conversion_ratio || "",
          }))
      : [];

    setFormData({
      code: editingGoods.code || "",
      name: editingGoods.name || "",
      description: editingGoods.description || null,
      selling_description: editingGoods.selling_description || null,
      buying_description: editingGoods.buying_description || null,
      goods_group_id: editingGoods.goods_group_id || "",
      unit_id: defaultUnit?.unit_id || editingGoods.unit_id || "",
    });

    setConversionUnits(conversionUnitList);
  }, [editingGoods]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddConversionUnit = () => {
    setConversionUnits((prev) => [
      ...prev,
      {
        temp_id: Date.now() + Math.random(),
        unit_id: "",
        ratio: "",
      },
    ]);
  };

  const handleRemoveConversionUnit = (tempId) => {
    setConversionUnits((prev) => prev.filter((item) => item.temp_id !== tempId));
  };

  const handleChangeConversionUnit = (tempId, field, value) => {
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
      if (editingGoodsId) {
        await updateGoods(editingGoodsId, payload);
        alert("Cập nhật hàng hóa thành công");
      } else {
        await createGoods(payload);
        alert("Thêm hàng hóa thành công");
      }

      onSuccess?.();
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
      <div className="goods-modal">
        <div className="goods-modal-header">
          <h2>{editingGoodsId ? "Sửa hàng hóa" : "Thêm hàng hóa"}</h2>

          <button className="goods-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="goods-form">
          <div className="form-group">
            <label>
              Mã hàng <span>*</span>
            </label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Nhập mã hàng"
            />
          </div>

          <div className="form-group">
            <label>
              Tên hàng <span>*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên hàng"
            />
          </div>

          <div className="form-group">
            <label>
              ĐVT chính <span>*</span>
            </label>

            <div className="primary-unit-row">
              <select
                name="unit_id"
                value={formData.unit_id}
                onChange={handleChange}
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

              <button
                type="button"
                className="add-conversion-btn"
                onClick={handleAddConversionUnit}
              >
                +
              </button>
            </div>
          </div>

          {conversionUnits.length > 0 && (
            <div className="conversion-section">
              {conversionUnits.map((item, index) => {
                const conversionUnitName = getUnitNameById(item.unit_id);

                return (
                  <div className="conversion-card" key={item.temp_id}>
                    <div className="conversion-card-header">
                      <strong>ĐV chuyển đổi {index + 1}</strong>

                      <button
                        type="button"
                        className="remove-conversion-btn"
                        onClick={() => handleRemoveConversionUnit(item.temp_id)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="conversion-grid">
                      <div className="form-group">
                        <label>Đơn vị</label>
                        <select
                          value={item.unit_id}
                          onChange={(e) =>
                            handleChangeConversionUnit(
                              item.temp_id,
                              "unit_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            {unitLoading ? "Đang tải ĐVT..." : "Chọn ĐV chuyển đổi"}
                          </option>

                          {unitList.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Tỷ lệ chuyển đổi</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.ratio}
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
                    </div>

                    <div className="conversion-note">
                      1 <strong>{primaryUnitName || "ĐVT chính"}</strong>
                      {" = "}
                      <strong>{item.ratio || "..."}</strong>{" "}
                      <strong>{conversionUnitName || "đơn vị"}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="goods-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>

          <button className="save-btn" onClick={handleSaveGoods}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoodsFormModal;