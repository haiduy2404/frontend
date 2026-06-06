import { useEffect, useState } from "react";
import "../../styles/GoodsListPage.css";
import { RiRefreshLine, RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import {
  getGoods,
  createGoods,
  updateGoods,
  deleteGoods,
} from "../../services/goodsService";

import { getGoodsUnits } from "../../services/goodsUnitService";

function GoodsListPage() {
  const [goodsList, setGoodsList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stockStatus, setStockStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingGoodsId, setEditingGoodsId] = useState(null);
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

  const fetchGoods = async (
    keyword = search,
    pageNumber = page,
    size = pageSize,
    status = stockStatus
  ) => {
    try {
      const response = await getGoods({
        search: keyword,
        page: pageNumber,
        page_size: size,
        stock_status: status,
      });

      const payload = response?.data || response;

      const results = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : [];

      setGoodsList(results);
      setTotal(payload?.total ?? payload?.count ?? results.length);
      setTotalPages(
        payload?.total_pages ??
          Math.max(1, Math.ceil((payload?.total ?? payload?.count ?? results.length) / size))
      );
    } catch (error) {
      console.error("GET GOODS ERROR:", error.response?.data || error);
      alert("Không tải được danh mục VTHH");
      setGoodsList([]);
      setTotal(0);
      setTotalPages(1);
    }
  };

  const getUnitNameById = (unitId) => {
    return (
      unitList.find((unit) => String(unit.id) === String(unitId))?.name || ""
    );
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
} , []);
  useEffect(() => {
    fetchGoods(search, page, pageSize, stockStatus);
  }, [page, pageSize, stockStatus]);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(goodsList.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };
        const resetForm = () => {
        setFormData({
          code: "",
          name: "",
          description: null,
          selling_description: null,
          buying_description: null,
          goods_group_id: "",
          unit_id: "",
        });
        setConversionUnits([]);
      };

      const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      };

      const handleOpenAddModal = () => {
        setEditingGoodsId(null);
        resetForm();
        setShowModal(true);
      };

      const handleEditGoods = (goods) => {
        setEditingGoodsId(goods.id);

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
              }))
          : [];

        setFormData({
          code: goods.code || "",
          name: goods.name || "",
          description: goods.description || null,
          selling_description: goods.selling_description || null,
          buying_description: goods.buying_description || null,
          goods_group_id: goods.goods_group_id || "",
          unit_id: defaultUnit?.unit_id || goods.unit_id || "",
        });

        setConversionUnits(conversionUnitList);
        setShowModal(true);
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
      setConversionUnits((prev) =>
        prev.filter((item) => item.temp_id !== tempId)
      );
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

        setShowModal(false);
        setEditingGoodsId(null);
        resetForm();

        await fetchGoods(search, page, pageSize);
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

    const handleDeleteGoods = async (goods) => {
      const confirmDelete = window.confirm(
        `Bạn có chắc muốn xóa hàng hóa "${goods.code} - ${goods.name}" không?`
      );

      if (!confirmDelete) return;

      try {
        await deleteGoods(goods.id);

        setSelectedIds((prev) => prev.filter((id) => id !== goods.id));

        await fetchGoods(search, page, pageSize);

        alert("Xóa hàng hóa thành công");
      } catch (error) {
        console.error("DELETE GOODS ERROR:", error.response?.data || error);
        alert(error.response?.data?.detail || "Xóa hàng hóa thất bại");
      }
    };

    const handleBulkDeleteGoods = async () => {
      if (selectedIds.length === 0) {
        alert("Vui lòng chọn hàng hóa cần xóa");
        return;
      }

      const confirmDelete = window.confirm(
        `Bạn có chắc muốn xóa ${selectedIds.length} hàng hóa không?`
      );

      if (!confirmDelete) return;

      try {
        await Promise.all(selectedIds.map((id) => deleteGoods(id)));

        setSelectedIds([]);
        await fetchGoods(search, page, pageSize);

        alert("Xóa thành công");
      } catch (error) {
        console.error("BULK DELETE GOODS ERROR:", error.response?.data || error);
        alert("Xóa thất bại");
      }
    };

  return (
    <div className="goods-list-page">

    <div className="goods-toolbar">
      <div className="goods-toolbar-left">
        <input
          className="goods-search"
          placeholder="🔍  Tìm kiếm"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            setPage(1);
            fetchGoods(value, 1, pageSize, stockStatus);
          }}
        />

        {selectedIds.length > 0 && (
          <button
            className="bulk-delete-btn"
            title="Xóa hàng loạt"
            onClick={handleBulkDeleteGoods}
          >
            <RiDeleteBin6Line />
          </button>
        )}
      </div>

      <div className="goods-toolbar-center">
        <div className="goods-status-tabs">
          <button
            className={stockStatus === "all" ? "active" : ""}
            onClick={() => {
              setStockStatus("all");
              setPage(1);
              fetchGoods(search, 1, pageSize, "all");
            }}
          >
            Tất cả
          </button>

          <button
            className={stockStatus === "out_of_stock" ? "active" : ""}
            onClick={() => {
              setStockStatus("out_of_stock");
              setPage(1);
              fetchGoods(search, 1, pageSize, "out_of_stock");
            }}
          >
            Hết hàng
          </button>
        </div>
      </div>

      <div className="goods-actions">
        <button
          className="icon-btn"
          title="Làm mới"
          onClick={() => fetchGoods(search, page, pageSize)}
        >
          <RiRefreshLine />
        </button>

        <button className="add-btn" onClick={handleOpenAddModal}>
          + Thêm
        </button>
      </div>
    </div>
      <div className="goods-table-wrapper">
        <table className="goods-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={
                    goodsList.length > 0 &&
                    selectedIds.length === goodsList.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>Mã hàng</th>
              <th>Tên hàng</th>
              <th>ĐVT tính chính</th>
              <th className="action-col"></th>
            </tr>
          </thead>

          <tbody>
            {goodsList.map((goods) => (
              <tr key={goods.id} className="goods-row">
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(goods.id)}
                    onChange={() => handleSelect(goods.id)}
                  />
                </td>

                <td>{goods.code || "-"}</td>
                <td>{goods.name || "-"}</td>
                <td>{goods.unit_name || "-"}</td>

                <td className="goods-row-actions">
                  <button
                    className="row-edit-btn"
                    title="Sửa"
                    onClick={() => handleEditGoods(goods)}
                  >
                    <RiEdit2Line />
                  </button>

                  <button
                    className="row-delete-btn"
                    title="Xóa"
                    onClick={() => handleDeleteGoods(goods)}
                  >
                    <RiDeleteBin6Line />
                  </button>
                </td>
              </tr>
            ))}

            {goodsList.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="goods-pagination">
        <div className="pagination-left">
          Tổng số: <strong>{total}</strong>
        </div>

        <div className="pagination-right">
          <span>Số dòng/trang</span>

          <select
            value={pageSize}
            onChange={(e) => {
              const value = Number(e.target.value);
              setPageSize(value);
              setPage(1);
              fetchGoods(search, 1, value, stockStatus);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <span>
            {total === 0 ? 0 : (page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, total)}
          </span>

          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ‹
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
        </div>
      </div>
                {showModal && (
            <div className="goods-modal-overlay">
              <div className="goods-modal">
                <div className="goods-modal-header">
                  <h2>{editingGoodsId ? "Sửa hàng hóa" : "Thêm hàng hóa"}</h2>

                  <button
                    className="goods-modal-close-btn"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoodsId(null);
                      resetForm();
                    }}
                  >
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
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoodsId(null);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>

                  <button className="save-btn" onClick={handleSaveGoods}>
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}

export default GoodsListPage;