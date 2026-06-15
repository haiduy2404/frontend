import { useEffect, useState } from "react";
import "../../styles/GoodsListPage.css";
import { RiRefreshLine, RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import { getGoods, deleteGoods } from "../../services/goodsService";
import GoodsFormModal from "../../components/GoodsFormModal";

function GoodsListPage() {
  const [goodsList, setGoodsList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stockStatus, setStockStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingGoods, setEditingGoods] = useState(null);

  const fetchGoods = async (
    keyword = debouncedSearch,
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
          Math.max(
            1,
            Math.ceil((payload?.total ?? payload?.count ?? results.length) / size)
          )
      );
    } catch (error) {
      console.error("GET GOODS ERROR:", error.response?.data || error);
      alert("Không tải được danh mục VTHH");
      setGoodsList([]);
      setTotal(0);
      setTotalPages(1);
    }
  };

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 1500);

  return () => clearTimeout(timer);
}, [search]);

  useEffect(() => {
    fetchGoods(debouncedSearch, page, pageSize, stockStatus);
  }, [debouncedSearch, page, pageSize, stockStatus]);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(goodsList.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingGoods(null);
    setShowModal(true);
  };

  const handleEditGoods = (goods) => {
    setEditingGoods(goods);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoods(null);
  };

  const handleSaveSuccess = async () => {
    setShowModal(false);
    setEditingGoods(null);
    await fetchGoods(debouncedSearch, page, pageSize, stockStatus);
  };

  const handleDeleteGoods = async (goods) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa hàng hóa "${goods.code} - ${goods.name}" không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteGoods(goods.id);

      setSelectedIds((prev) => prev.filter((id) => id !== goods.id));

      await fetchGoods(debouncedSearch, page, pageSize, stockStatus);

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
      await fetchGoods(debouncedSearch, page, pageSize, stockStatus);

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
              setSearch(e.target.value);
              setPage(1);
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
              }}
            >
              Tất cả
            </button>

            <button
              className={stockStatus === "out_of_stock" ? "active" : ""}
              onClick={() => {
                setStockStatus("out_of_stock");
                setPage(1);
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
            onClick={() => fetchGoods(debouncedSearch, page, pageSize, stockStatus)}
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
        <GoodsFormModal
          editingGoods={editingGoods}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}

export default GoodsListPage;