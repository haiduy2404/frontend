import { useEffect, useMemo, useState } from "react";
import "../../styles/GoodsListPage.css";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFileExcel2Line,
  RiRefreshLine,
  RiSearchLine,
} from "react-icons/ri";
import { getGoods, deleteGoods } from "../../services/goodsService";
import { getGoodsGroups } from "../../services/goodsGroupService";
import GoodsFormModal from "../../components/GoodsFormModal";
import GoodsImportModal from "../../components/GoodsImportModal";
import GroupGoodsModal from "../../components/GroupGoodsModal";
import { useAuth } from "../../contexts/AuthContext";
import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../utils/listPageStateStorage";

const LIST_PAGE_STATE_KEY = "goods-list-page-state";
const ALL_GROUP_KEY = "__all__";

const getGroupId = (group) => group?.id ?? group?.group_id ?? null;

const normalizeGroup = (group) => ({
  ...group,
  id: getGroupId(group),
  code: group?.code || "",
  name: group?.name || "",
});

const extractGroups = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(payload)) return payload.map(normalizeGroup);

  if (Array.isArray(payload?.results)) {
    return payload.results.map(normalizeGroup);
  }

  return [];
};

const getGoodsGroupId = (goods) =>
  goods?.goods_group_id ??
  goods?.group_id ??
  goods?.goods_group?.id ??
  goods?.group?.id ??
  null;

const getGoodsGroupCode = (goods) =>
  goods?.goods_group_code ??
  goods?.group_code ??
  goods?.goods_group?.code ??
  goods?.group?.code ??
  "";

const getGoodsGroupName = (goods) =>
  goods?.goods_group_name ??
  goods?.group_name ??
  goods?.goods_group?.name ??
  goods?.group?.name ??
  "";

function GoodsListPage() {
  const storedState = getStoredListPageState(LIST_PAGE_STATE_KEY, {});

  const [goodsList, setGoodsList] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedIds, setSelectedIds] = useState(() =>
    Array.isArray(storedState.selectedIds) ? storedState.selectedIds : []
  );

  const [selectedGroupKey, setSelectedGroupKey] = useState(
    storedState.selectedGroupKey || ALL_GROUP_KEY
  );

  const [search, setSearch] = useState(storedState.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    storedState.debouncedSearch || ""
  );

  const [groupSearch, setGroupSearch] = useState("");

  const [page, setPage] = useState(() => {
    const parsed = Number(storedState.page);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const [pageSize, setPageSize] = useState(() => {
    const parsed = Number(storedState.pageSize);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
  });

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingGoods, setLoadingGoods] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGoods, setEditingGoods] = useState(null);
  const [presetGroup, setPresetGroup] = useState(null);

  const [showGroupModal, setShowGroupModal] = useState(false);

  const { canDo } = useAuth();

  const selectedGroup = useMemo(() => {
    if (selectedGroupKey === ALL_GROUP_KEY) return null;

    return (
      groups.find(
        (group) => String(group.id) === String(selectedGroupKey)
      ) || null
    );
  }, [groups, selectedGroupKey]);

  const visibleGroups = useMemo(() => {
    const keyword = groupSearch.trim().toLowerCase();

    return groups
      .filter((group) => {
        if (!keyword) return true;

        return (
          String(group.code || "").toLowerCase().includes(keyword) ||
          String(group.name || "").toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) =>
        String(a.code || "").localeCompare(String(b.code || ""), "vi")
      );
  }, [groups, groupSearch]);

  useEffect(() => {
    saveStoredListPageState(LIST_PAGE_STATE_KEY, {
      search,
      debouncedSearch,
      selectedGroupKey,
      page,
      pageSize,
      selectedIds,
    });
  }, [
    debouncedSearch,
    page,
    pageSize,
    search,
    selectedGroupKey,
    selectedIds,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchGroups = async () => {
    setLoadingGroups(true);

    try {
      const response = await getGoodsGroups();
      setGroups(extractGroups(response));
    } catch (error) {
      console.error("GET GOODS GROUPS ERROR:", error.response?.data || error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGoods = async (
    keyword = debouncedSearch,
    pageNumber = page,
    size = pageSize,
    group = selectedGroup
  ) => {
    setLoadingGoods(true);

    try {
      const params = {
        search: keyword,
        page: pageNumber,
        page_size: size,
      };

      if (group?.id) {
        params.goods_group_id = group.id;
      }

      const response = await getGoods(params);
      const payload = response?.data || response;

      const results = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : [];

      setGoodsList(results);

      setSelectedIds((prev) =>
        (prev || []).filter((id) => results.some((item) => item.id === id))
      );

      const totalValue = payload?.total ?? payload?.count ?? results.length;

      setTotal(totalValue);
      setTotalPages(
        payload?.total_pages ??
          Math.max(1, Math.ceil(totalValue / Math.max(size, 1)))
      );
    } catch (error) {
      console.error("GET GOODS ERROR:", error.response?.data || error);
      alert("Không tải được danh mục VTHH");
      setGoodsList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoadingGoods(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchGoods(debouncedSearch, page, pageSize, selectedGroup);
  }, [
    debouncedSearch,
    page,
    pageSize,
    selectedGroupKey,
    selectedGroup?.id,
  ]);

  const handleOpenGroupModal = () => {
    setShowGroupModal(true);
  };

  const handleGroupSaveSuccess = async (createdGroup) => {
    setShowGroupModal(false);
    await fetchGroups();

    const createdId = createdGroup?.id || createdGroup?.group_id;

    if (createdId) {
      setSelectedGroupKey(createdId);
      setSelectedIds([]);
      setPage(1);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(goodsList.map((item) => item.id));
      return;
    }

    setSelectedIds([]);
  };

  const handleSelectGroup = (key) => {
    setSelectedGroupKey(key);
    setSelectedIds([]);
    setPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingGoods(null);

    if (selectedGroupKey !== ALL_GROUP_KEY && selectedGroup) {
      setPresetGroup(selectedGroup);
    } else {
      setPresetGroup(null);
    }

    setShowModal(true);
  };

  const handleEditGoods = (goods) => {
    setPresetGroup(null);
    setEditingGoods(goods);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoods(null);
    setPresetGroup(null);
  };

  const handleSaveSuccess = async () => {
    handleCloseModal();
    await Promise.all([
      fetchGroups(),
      fetchGoods(debouncedSearch, page, pageSize, selectedGroup),
    ]);
  };

  const handleDeleteGoods = async (goods) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa hàng hóa "${goods.code} - ${goods.name}" không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteGoods(goods.id);

      setSelectedIds((prev) => prev.filter((id) => id !== goods.id));

      await fetchGoods(debouncedSearch, page, pageSize, selectedGroup);

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
      await fetchGoods(debouncedSearch, page, pageSize, selectedGroup);

      alert("Xóa thành công");
    } catch (error) {
      console.error("BULK DELETE GOODS ERROR:", error.response?.data || error);
      alert("Xóa thất bại");
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchGroups(),
      fetchGoods(debouncedSearch, page, pageSize, selectedGroup),
    ]);
  };

  const selectedGroupTitle =
    selectedGroupKey === ALL_GROUP_KEY
      ? "Tất cả hàng hóa"
      : selectedGroup?.name || "Danh mục hàng hóa";

  const selectedGroupSubtitle =
    selectedGroupKey === ALL_GROUP_KEY
      ? `${total} vật tư, hàng hóa`
      : `${selectedGroup?.code || ""}${
          selectedGroup?.code ? " • " : ""
        }${total} vật tư, hàng hóa`;

  if (!canDo("view_goods")) {
    return (
      <div className="no-permission-page">
        Bạn không có quyền truy cập vật tư hàng hóa
      </div>
    );
  }

  return (
    <div className="goods-list-page goods-list-page--grouped">
      <div className="goods-page-header">
        <div>
          <h1>Danh mục hàng hóa</h1>
          <p>Quản lý và phân loại vật tư, hàng hóa trong kho</p>
        </div>

        <div className="goods-page-actions">
          {canDo("create_goods") && (
            <button className="add-btn" onClick={handleOpenAddModal}>
              <RiAddLine />
              Thêm hàng hóa
            </button>
          )}
        </div>
      </div>

      <div className="goods-grouped-layout">
        <aside className="goods-groups-panel">
          <div className="goods-groups-heading-row">
            <div className="goods-groups-heading">NHÓM VẬT TƯ, HÀNG HÓA</div>

            {canDo("create_goods") && (
              <button
                type="button"
                className="goods-group-add-btn"
                title="Thêm nhóm vật tư"
                onClick={handleOpenGroupModal}
              >
                <RiAddLine />
              </button>
            )}
          </div>

          <div className="goods-group-search-wrap">
            <RiSearchLine />
            <input
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
              placeholder="Tìm nhóm"
            />
          </div>

          <div className="goods-groups-list">
            <button
              type="button"
              className={`goods-group-item goods-group-item--all ${
                selectedGroupKey === ALL_GROUP_KEY ? "active" : ""
              }`}
              onClick={() => handleSelectGroup(ALL_GROUP_KEY)}
            >
              <span className="goods-group-all-icon">▦</span>
              <span className="goods-group-item-name">Tất cả hàng hóa</span>
            </button>

            {loadingGroups ? (
              <div className="goods-groups-loading">Đang tải nhóm...</div>
            ) : (
              visibleGroups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  className={`goods-group-item ${
                    String(selectedGroupKey) === String(group.id) ? "active" : ""
                  }`}
                  onClick={() => handleSelectGroup(group.id)}
                >
                  <span className="goods-group-code">{group.code || "-"}</span>
                  <span className="goods-group-item-name">
                    {group.name || "-"}
                  </span>
                </button>
              ))
            )}

            <div className="goods-groups-divider" />
          </div>
        </aside>

        <section className="goods-main-panel">
          <div className="goods-main-panel-header">
            <div>
              <h2>{selectedGroupTitle}</h2>
              <p>{selectedGroupSubtitle}</p>
            </div>
          </div>

          <div className="goods-table-toolbar">
            <div className="goods-search-wrap">
              <RiSearchLine />
              <input
                className="goods-search"
                placeholder="Tìm theo mã hàng, tên hàng..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="goods-toolbar-actions">
              {selectedIds.length > 0 && canDo("delete_goods") && (
                <button
                  className="bulk-delete-btn"
                  title="Xóa hàng loạt"
                  onClick={handleBulkDeleteGoods}
                >
                  <RiDeleteBin6Line />
                </button>
              )}

              <button
                className="icon-btn"
                title="Làm mới"
                onClick={handleRefresh}
                disabled={loadingGoods || loadingGroups}
              >
                <RiRefreshLine />
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
                  <th>Tên hàng hóa</th>

                  {selectedGroupKey === ALL_GROUP_KEY && <th>Nhóm</th>}

                  <th>ĐVT chính</th>
                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loadingGoods ? (
                  <tr>
                    <td
                      colSpan={selectedGroupKey === ALL_GROUP_KEY ? 6 : 5}
                      className="empty-row"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : (
                  goodsList.map((goods) => (
                    <tr key={goods.id} className="goods-row">
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(goods.id)}
                          onChange={() => handleSelect(goods.id)}
                        />
                      </td>

                      <td className="goods-code-cell">{goods.code || "-"}</td>

                      <td className="goods-name-cell">{goods.name || "-"}</td>

                      {selectedGroupKey === ALL_GROUP_KEY && (
                        <td>
                          <div className="goods-group-cell">
                            {getGoodsGroupCode(goods) && (
                              <span className="goods-group-code">
                                {getGoodsGroupCode(goods)}
                              </span>
                            )}

                            {!getGoodsGroupCode(goods) && (
                              <span className="goods-group-name-only">
                                {getGoodsGroupName(goods) || "-"}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      <td>
                        {goods.units?.find((unit) => unit.is_default)?.unit_name ||
                          goods.units?.[0]?.unit_name ||
                          "-"}
                      </td>

                      <td className="goods-row-actions">
                        {canDo("update_goods") && (
                          <button
                            className="row-edit-btn"
                            title="Sửa"
                            onClick={() => handleEditGoods(goods)}
                          >
                            <RiEdit2Line />
                          </button>
                        )}

                        {canDo("delete_goods") && (
                          <button
                            className="row-delete-btn"
                            title="Xóa"
                            onClick={() => handleDeleteGoods(goods)}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}

                {!loadingGoods && goodsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={selectedGroupKey === ALL_GROUP_KEY ? 6 : 5}
                      className="empty-row"
                    >
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
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
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

              <button
                disabled={page === 1 || loadingGoods}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                ‹
              </button>

              <button
                disabled={page >= totalPages || loadingGoods}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </div>

      {showGroupModal && (
        <GroupGoodsModal
          onClose={() => setShowGroupModal(false)}
          onSuccess={handleGroupSaveSuccess}
        />
      )}

      {showModal && (
        <GoodsFormModal
          editingGoods={editingGoods}
          presetGroup={presetGroup}
          initialGoodsGroup={presetGroup}
          goodsGroup={presetGroup}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}

      {showImportModal && (
        <GoodsImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={async () => {
            setShowImportModal(false);
            await handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default GoodsListPage;