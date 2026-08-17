import { useState } from "react";
import { createGoodsGroup } from "../services/goodsGroupService";
import "../styles/GroupGoodsModal.css";

function GroupGoodsModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const handleSave = async () => {
    const code = formData.code.trim().toUpperCase();
    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!code || !name) {
      alert("Vui lòng nhập Mã nhóm và Tên nhóm");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code,
        name,
        description: description || null,
      };

      const response = await createGoodsGroup(payload);

      alert("Thêm nhóm vật tư thành công");
      onSuccess?.(response?.data || response);
    } catch (error) {
      console.error(
        "CREATE GOODS GROUP ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.code ||
          error.response?.data?.name ||
          error.response?.data?.detail ||
          "Thêm nhóm vật tư thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group-goods-modal-overlay">
      <div className="group-goods-modal">
        <div className="group-goods-modal-header">
          <div>
            <h2>Thêm nhóm vật tư</h2>
            <p>Tạo nhóm mới để phân loại vật tư, hàng hóa.</p>
          </div>

          <button
            type="button"
            className="group-goods-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="group-goods-modal-body">
          <div className="group-goods-form-group">
            <label>
              Mã nhóm <span>*</span>
            </label>

            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ví dụ: DMSV"
              autoFocus
              disabled={saving}
            />

            <div className="group-goods-helper">
              Mã nhóm sẽ được dùng làm phần đầu mã hàng hóa.
            </div>
          </div>

          <div className="group-goods-form-group">
            <label>
              Tên nhóm <span>*</span>
            </label>

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: Dầu mỡ sơn các loại"
              disabled={saving}
            />
          </div>

          <div className="group-goods-form-group">
            <label>Mô tả</label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả nhóm nếu cần"
              rows={4}
              disabled={saving}
            />
          </div>
        </div>

        <div className="group-goods-modal-footer">
          <button
            type="button"
            className="group-goods-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>

          <button
            type="button"
            className="group-goods-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupGoodsModal;