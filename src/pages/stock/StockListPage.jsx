import { useState , useEffect, useRef } from "react";
import { RiFileExcel2Line } from "react-icons/ri";
import "../../styles/StockListPage.css";
import { createWarehouse, getWarehouses, deleteWarehouse, updateWarehouse, importWarehouseExcel } from "../../services/warehouseService";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RiEdit2Line } from "react-icons/ri";

function StockListPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  const fileInputRef = useRef(null);
  const [activeRowId, setActiveRowId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);


  const handleExcelClick = () => {
  fileInputRef.current.click();
};

const handleExcelChange = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    await importWarehouseExcel(formData);
    alert("Import Excel thành công");
    await fetchWarehouses(search, page);
  } catch (error) {
    console.log("IMPORT EXCEL ERROR:", error.response?.data || error);
    alert("Import Excel thất bại");
  }

  e.target.value = "";
};



  const handleSelectAll = (e) => {
  if (e.target.checked) {
    setSelectedIds(warehouses.map((warehouse) => warehouse.id));
  } else {
    setSelectedIds([]);
  }
};

  const handleEdit = () => {
  if (selectedIds.length !== 1) {
    alert("Vui lòng chọn đúng 1 kho để sửa");
    return;
  }

  const warehouse = warehouses.find((item) => item.id === selectedIds[0]);

  if (!warehouse) return;

  setEditingWarehouseId(warehouse.id);

  setFormData({
    code: warehouse.code || "",
    name: warehouse.name || "",
    address: warehouse.address || "",
    accountant_code: warehouse.accountant_code || "",
  });

  setShowModal(true);
};

  const handleSelect = (id) => {
  setSelectedIds((prev) =>
    prev.includes(id)
      ? prev.filter((item) => item !== id)
      : [...prev, id]
  );
};

  useEffect(() => {
    fetchWarehouses(search, page);
  }, [page]);

  useEffect(() => {
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  document.addEventListener("click", handleClickOutside);

  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, []);


const fetchWarehouses = async (
  keyword = search,
  pageNumber = page,
  size = pageSize
) => {
  try {
    const response = await getWarehouses({
      search: keyword,
      page: pageNumber,
      page_size: size,
    });

    const payload = response?.data || response;

    const results = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
      ? payload.results
      : [];

    setWarehouses(results);
    setTotal(payload?.total ?? results.length);
    setTotalPages(payload?.total_pages ?? 1);
  } catch (error) {
    console.error("GET WAREHOUSES ERROR:", error.response?.data || error);
    alert("Không tải được danh sách kho");
    setWarehouses([]);
    setTotal(0);
    setTotalPages(1);
  }
};

  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    accountant_code: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      address: "",
      accountant_code: "",
    });
  };

  const currentWarehouse = warehouses.find(
    (warehouse) => warehouse.id === editingWarehouseId
  );

  const handleSave = async (keepOpen) => {
  if (!formData.code || !formData.name || !formData.address) {
    alert("Vui lòng nhập đầy đủ Mã kho, Tên kho và Địa chỉ");
    return;
  }

  const payload = {
    code: formData.code.trim(),
    name: formData.name.trim(),
    address: formData.address.trim(),
    accountant_code: formData.accountant_code?.trim() || "",
    status: editingWarehouseId
      ? currentWarehouse?.status || "ACTIVE"
      : "ACTIVE",
  };

  try {
    const isEditing = !!editingWarehouseId;

    if (isEditing) {
      await updateWarehouse(editingWarehouseId, payload);
    } else {
      await createWarehouse(payload);
    }

    await fetchWarehouses(search);

    setSelectedIds([]);
    setEditingWarehouseId(null);

    if (keepOpen && !isEditing) {
      resetForm();
    } else {
      setShowModal(false);
      resetForm();
    }

    alert(isEditing ? "Cập nhật kho thành công" : "Thêm kho thành công");
  } catch (error) {
    console.log("SAVE ERROR:", error);
    console.log("ERROR DATA:", error.response?.data);

    alert(
      error.response?.data?.code ||
      (editingWarehouseId ? "Cập nhật kho thất bại" : "Thêm kho thất bại")
    );
  }
};

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
          alert("Vui lòng chọn kho cần xóa");
          return;
        }

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} kho không?`
    );

        if (!confirmDelete) return;

    try {
        await Promise.all(
        selectedIds.map((id) => deleteWarehouse(id))
      );

      setSelectedIds([]);
      await fetchWarehouses(search);

      alert("Xóa thành công");
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại");
    }
  };


  return (
    <div className="stock-list-page">
      <div className="stock-toolbar">
        <div className="stock-search-group">
          <input
            className="stock-search"
            placeholder="🔍  Tìm kiếm"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              setPage(1);
              fetchWarehouses(value, 1);
            }}
          />

          {selectedIds.length > 0 && (
            <button
              className="bulk-delete-btn"
              onClick={handleDelete}
              title="Xóa hàng loạt"
            >
              <RiDeleteBin6Line />
            </button>
          )}
        </div>
        <div className="stock-actions">
          <button className="icon-btn">⟳</button>
          <button
            className="icon-btn excel-btn"
            title="Nhập từ Excel"
            onClick={handleExcelClick}
          >
            <RiFileExcel2Line />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleExcelChange}
          />
          <button
            className="add-btn"
            onClick={() => {
              setEditingWarehouseId(null);
              resetForm();
              setShowModal(true);
            }}
          >
            + Thêm
          </button>
        </div>
      </div>
<div className="stock-table-wrapper">
      <table className="stock-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={warehouses.length > 0 && selectedIds.length === warehouses.length}
                onChange={handleSelectAll}
              />
            </th>
            <th className="small-col">Mã kho</th>
            <th className="wide-col">Tên kho</th>
            <th className="flex-col">Địa chỉ kho</th>
            <th className="small-col">Mã kho kế toán</th>
            <th className="status-col">Trạng thái</th>
            <th className="action-col"></th>
          </tr>
        </thead>
          <tbody>
           {warehouses.map((warehouse) => (
      <tr
        key={warehouse.id}
        className={`warehouse-row ${
          activeRowId === warehouse.id || openMenuId === warehouse.id
            ? "row-active"
            : ""
        }`}
        onClick={() => setActiveRowId(warehouse.id)}
      >
    <td>
      <input
        type="checkbox"
        checked={selectedIds.includes(warehouse.id)}
        onChange={() => handleSelect(warehouse.id)}
      />
    </td>

    <td>{warehouse.code}</td>
    <td>{warehouse.name}</td>
    <td>{warehouse.address}</td>
    <td>{warehouse.accountant_code || "-"}</td>

    <td
      className={
        warehouse.status === "ACTIVE"
          ? "status-active"
          : "status-inactive"
      }
    >
      {warehouse.status === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : "NGỪNG HOẠT ĐỘNG"}
    </td>

   <td className="row-actions">
          <button
            className="row-edit-btn"
            title="Sửa"
            onClick={(e) => {
              e.stopPropagation();

              setEditingWarehouseId(warehouse.id);
              setFormData({
                code: warehouse.code || "",
                name: warehouse.name || "",
                address: warehouse.address || "",
                accountant_code: warehouse.accountant_code || "",
              });
              setShowModal(true);
            }}
          >
            <RiEdit2Line />
          </button>

      <div className="row-more-wrapper">
          <button
            className="row-more-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === warehouse.id ? null : warehouse.id);
            }}
          >
            ...
          </button>

      {openMenuId === warehouse.id && (
            <div className="row-more-menu">
              {warehouse.status === "ACTIVE" ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();

                    const confirmInactive = window.confirm(
                      `Bạn có chắc muốn ngừng hoạt động kho "${warehouse.name}" không?`
                    );

                    if (!confirmInactive) return;

                    await updateWarehouse(warehouse.id, {
                      code: warehouse.code,
                      name: warehouse.name,
                      address: warehouse.address,
                      accountant_code: warehouse.accountant_code || "",
                      status: "INACTIVE",
                    });

                    await fetchWarehouses(search, page);
                    setOpenMenuId(null);
                  }}
                >
                  Ngừng hoạt động
                </button>
              ) : (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();

                    const confirmActive = window.confirm(
                      `Bạn có chắc muốn kích hoạt lại kho "${warehouse.name}" không?`
                    );

                    if (!confirmActive) return;

                    await updateWarehouse(warehouse.id, {
                      code: warehouse.code,
                      name: warehouse.name,
                      address: warehouse.address,
                      accountant_code: warehouse.accountant_code || "",
                      status: "ACTIVE",
                    });

                    await fetchWarehouses(search, page);
                    setOpenMenuId(null);
                  }}
                >
                  Kích hoạt lại
                </button>
              )}

          <button
            className="danger"
            onClick={async (e) => {
              e.stopPropagation();

              const confirmDelete = window.confirm(
                "Bạn có chắc muốn xóa kho này?"
              );

              if (!confirmDelete) return;

              await deleteWarehouse(warehouse.id);
              await fetchWarehouses(search, page);

              setOpenMenuId(null);
            }}
          >
            Xóa
          </button>
        </div>
      )}
      </div>
</td>
  </tr>
))}
          </tbody>
      </table>
    </div>
        <div className="pagination">
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
            fetchWarehouses(search, 1, value);
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <span>
          {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}
        </span>

        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ‹
        </button>

        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          ›
        </button>
      </div>
    </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="warehouse-modal">
            <div className="modal-header">
              <h3>{editingWarehouseId ? "Sửa Kho" : "Thêm Kho"}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Mã kho <span>*</span>
                  </label>
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>
                    Tên kho <span>*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group wide">
                  <label>
                    Chi nhánh <span>*</span>
                  </label>
                  <select>
                    <option>CÔNG TY CỔ PHẦN VẬN TẢI ĐƯỜNG SẮT...</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vị trí địa lý</label>
                  <select>
                    <option>Tỉnh/Thành phố</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>&nbsp;</label>
                  <select>
                    <option>Xã/Phường</option>
                  </select>
                </div>

                <div className="form-group wide">
                  <label>Địa chỉ <span>*</span> </label>
                  <textarea
                    name="addres s"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group large">
                  <input placeholder="Số nhà, tên đường" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group large">
                  <label>Mã kho kế toán</label>
                  <input
                    name="accountant_code"
                    value={formData.accountant_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-footer-close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingWarehouseId(null);
                  resetForm();
                }}
              >
                ×
              </button>
              {!editingWarehouseId && (
                <button className="save-more-btn" onClick={() => handleSave(true)}>
                  Lưu và Thêm
                </button>
              )}
              <button className="save-btn" onClick={() => handleSave(false)}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockListPage;