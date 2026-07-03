import { useEffect, useState } from "react";
import "../../styles/GoodsUnitPage.css";

import {
  getGoodsUnits,
  createGoodsUnit,
  updateGoodsUnit,
  deleteGoodsUnit,
} from "../../services/goodsUnitService";

import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiSave3Line,
  RiCloseLine,
} from "react-icons/ri";

function GoodsUnitPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [formName, setFormName] = useState("");
  const [editingUnit, setEditingUnit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const unwrapData = (response) => response?.data || response;

  const fetchUnits = async (customParams = {}) => {
    try {
      setLoading(true);

      const response = await getGoodsUnits({
        search,
        include_deleted: false,
        ...customParams,
      });

      const data = unwrapData(response);

      const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setUnits(results);
    } catch (error) {
      console.error("LOAD GOODS UNITS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách đơn vị tính");
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchUnits({ search });
    }
  };

  const handleOpenCreate = () => {
    setEditingUnit(null);
    setFormName("");
    setShowForm(true);
  };

  const handleOpenEdit = (unit) => {
    setEditingUnit(unit);
    setFormName(unit.name || "");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditingUnit(null);
    setFormName("");
    setShowForm(false);
  };

  const handleSave = async () => {
    const name = formName.trim();

    if (!name) {
      alert("Vui lòng nhập tên đơn vị tính");
      return;
    }

    try {
      const payload = {
        name,
      };

      if (editingUnit?.id) {
        await updateGoodsUnit(editingUnit.id, payload);
        alert("Cập nhật đơn vị tính thành công");
      } else {
        await createGoodsUnit(payload);
        alert("Tạo đơn vị tính thành công");
      }

      handleCloseForm();
      fetchUnits();
    } catch (error) {
      console.error("SAVE GOODS UNIT ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Lưu đơn vị tính thất bại"
      );
    }
  };

  const handleDelete = async (unit) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa đơn vị tính "${unit.name}" không?`
    );

    if (!confirmed) return;

    try {
      await deleteGoodsUnit(unit.id);
      alert("Xóa đơn vị tính thành công");
      fetchUnits();
    } catch (error) {
      console.error("DELETE GOODS UNIT ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa đơn vị tính thất bại"
      );
    }
  };

  return (
    <div className="goods-unit-page">
      <div className="goods-unit-header">
        <div>
          <h2>Đơn vị tính</h2>
          <p>Quản lý danh mục đơn vị tính vật tư, hàng hóa</p>
        </div>

        <button className="goods-unit-add-btn" onClick={handleOpenCreate}>
          <RiAddLine />
          <span>Thêm đơn vị tính</span>
        </button>
      </div>

      <div className="goods-unit-toolbar">
        <input
          className="goods-unit-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="🔍 Tìm kiếm đơn vị tính"
        />

        <button
          className="goods-unit-search-btn"
          onClick={() => fetchUnits({ search })}
        >
          Tìm kiếm
        </button>
      </div>

      <div className="goods-unit-table-card">
        <table className="goods-unit-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>STT</th>
              <th>Tên đơn vị tính</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={3}>Đang tải danh sách đơn vị tính...</td>
              </tr>
            )}

            {!loading && units.length === 0 && (
              <tr>
                <td colSpan={3}>Không có dữ liệu đơn vị tính</td>
              </tr>
            )}

            {!loading &&
              units.map((unit, index) => (
                <tr key={unit.id || index}>
                  <td>{index + 1}</td>
                  <td>{unit.name || "-"}</td>
                  <td>
                    <div className="goods-unit-row-actions">
                      <button
                        className="goods-unit-icon-btn edit"
                        title="Sửa"
                        onClick={() => handleOpenEdit(unit)}
                      >
                        <RiEdit2Line />
                      </button>

                      <button
                        className="goods-unit-icon-btn delete"
                        title="Xóa"
                        onClick={() => handleDelete(unit)}
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="goods-unit-modal-overlay">
          <div className="goods-unit-modal">
            <div className="goods-unit-modal-header">
              <h3>
                {editingUnit ? "Cập nhật đơn vị tính" : "Thêm đơn vị tính"}
              </h3>

              <button type="button" onClick={handleCloseForm}>
                <RiCloseLine />
              </button>
            </div>

            <div className="goods-unit-modal-body">
              <label>
                Tên đơn vị tính <span>*</span>
              </label>

              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ví dụ: Hộp, Thùng, Cái, Kg..."
                autoFocus
              />
            </div>

            <div className="goods-unit-modal-footer">
              <button className="goods-unit-cancel-btn" onClick={handleCloseForm}>
                Hủy
              </button>

              <button className="goods-unit-save-btn" onClick={handleSave}>
                <RiSave3Line />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodsUnitPage;