import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiCheckLine, RiCloseLine, RiSearchLine } from "react-icons/ri";
import { getGoods } from "../services/goodsService";
import { getGoodsGroups } from "../services/goodsGroupService";
import "../styles/GoodsFilterModal.css";

const ALL_GROUP_KEY = "__all__";
const DEFAULT_PAGE_SIZE = 20;

const unwrapData = (response) => response?.data ?? response;

const normalizeGroups = (response) => {
  const body = unwrapData(response);
  const data = body?.data ?? body;
  const results = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];

  return results.map((group) => ({
    ...group,
    id: group?.id ?? group?.group_id ?? "",
    code: group?.code || "",
    name: group?.name || "",
  }));
};

const normalizeGoods = (response) => {
  const body = unwrapData(response);
  const data = body?.data ?? body ?? {};
  const results = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
    ? data.results
    : [];

  return {
    results,
    total: Number(data?.total ?? data?.count ?? results.length),
    page: Number(data?.page ?? 1),
    page_size: Number(data?.page_size ?? DEFAULT_PAGE_SIZE),
    total_pages: Number(
      data?.total_pages ??
        Math.max(
          1,
          Math.ceil(
            Number(data?.total ?? data?.count ?? results.length) /
              Number(data?.page_size ?? DEFAULT_PAGE_SIZE)
          )
        )
    ),
  };
};

const getGoodsId = (goods) => goods?.id ?? goods?.goods_id ?? "";
const getGoodsCode = (goods) => goods?.code ?? goods?.goods_code ?? "";
const getGoodsName = (goods) => goods?.name ?? goods?.goods_name ?? "";
const getGoodsGroupId = (goods) =>
  goods?.goods_group_id ??
  goods?.group_id ??
  goods?.goods_group?.id ??
  goods?.goods_group?.group_id ??
  "";

const normalizeValue = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      goods_group_id: item?.goods_group_id ?? item?.group_id ?? item?.id ?? "",
      choosen_goods: Array.isArray(item?.choosen_goods)
        ? [...new Set(item.choosen_goods.filter(Boolean).map(String))]
        : [],
    }))
    .filter((item) => item.goods_group_id);
};

function GoodsFilterModal({
  open = true,
  onClose,
  onConfirm,
  value = [],
  multiple = true,
  title = "Lọc mã vật tư",
}) {
  const requestIdRef = useRef(0);
  const [groups, setGroups] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [selectedGroupKey, setSelectedGroupKey] = useState(ALL_GROUP_KEY);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [goodsList, setGoodsList] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(() => normalizeValue(value));
  const [selectedGoodsIds, setSelectedGoodsIds] = useState([]);
  const [allGroupsSelected, setAllGroupsSelected] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_pages: 1,
  });

  const selectedGroup = useMemo(() => {
    if (selectedGroupKey === ALL_GROUP_KEY) return null;
    return groups.find((group) => String(group.id) === String(selectedGroupKey)) || null;
  }, [groups, selectedGroupKey]);

  useEffect(() => {
    if (!open) return;

    const normalized = normalizeValue(value);

    setSelectedGroups(normalized);
    setAllGroupsSelected(false);
  }, [open, value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchGroups = useCallback(async () => {
    try {
      setGroupLoading(true);
      const response = await getGoodsGroups({ page: 1, page_size: 1000 });
      setGroups(normalizeGroups(response));
    } catch (error) {
      console.error("GET GOODS GROUPS ERROR:", error?.response?.data || error);
      setGroups([]);
    } finally {
      setGroupLoading(false);
    }
  }, []);

  const fetchGoods = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setGoodsLoading(true);
      const params = { page, page_size: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      else if (selectedGroup?.id) params.goods_group_id = selectedGroup.id;

      const response = await getGoods(params);
      const data = normalizeGoods(response);
      if (requestId !== requestIdRef.current) return;
      setGoodsList(data.results);
      setPagination({
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: data.total_pages,
      });
    } catch (error) {
      console.error("GET GOODS ERROR:", error?.response?.data || error);
      if (requestId !== requestIdRef.current) return;
      setGoodsList([]);
      setPagination({ total: 0, page: 1, page_size: pageSize, total_pages: 1 });
    } finally {
      if (requestId === requestIdRef.current) setGoodsLoading(false);
    }
  }, [debouncedSearch, page, pageSize, selectedGroup?.id]);

  useEffect(() => {
    if (open) fetchGroups();
  }, [fetchGroups, open]);

  useEffect(() => {
    if (open) fetchGoods();
  }, [fetchGoods, open]);

  const getGroupSelection = useCallback(
    (groupId) =>
      selectedGroups.find(
        (item) => String(item.goods_group_id) === String(groupId)
      ) || null,
    [selectedGroups]
  );

  const isGroupFullySelected = useCallback(
    (groupId) => {
      if (allGroupsSelected) return true;
      const selection = getGroupSelection(groupId);
      return Boolean(selection && selection.choosen_goods.length === 0);
    },
    [allGroupsSelected, getGroupSelection]
  );

  const getGroupSelectedGoodsCount = useCallback(
    (groupId) => {
      const selection = getGroupSelection(groupId);
      if (!selection) return 0;
      return selection.choosen_goods.length === 0 ? -1 : selection.choosen_goods.length;
    },
    [getGroupSelection]
  );

  const handleToggleAllGroups = (checked) => {
    if (!multiple) return;

    setAllGroupsSelected(checked);

    if (checked) {
      setSelectedGroups([]);
      setSelectedGoodsIds([]);
    }
  };

  const handleToggleFullGroup = (group, checked) => {
    if (!multiple || !group?.id) return;
    setAllGroupsSelected(false);
    setSelectedGroups((prev) => {
      const next = prev.filter(
        (item) => String(item.goods_group_id) !== String(group.id)
      );
      if (!checked) return next;
      return [
        ...next,
        { goods_group_id: String(group.id), choosen_goods: [] },
      ];
    });
  };

  const isGoodsSelected = (goods) => {
    const goodsId = String(getGoodsId(goods));

    if (!goodsId) return false;

    return selectedGoodsIds.includes(goodsId);
  };

  const handleToggleGoods = (goods) => {
    if (!multiple) return;

    const goodsId = String(getGoodsId(goods));

    if (!goodsId) return;

    setSelectedGoodsIds((prev) => {
      if (prev.includes(goodsId)) {
        return prev.filter((id) => id !== goodsId);
      }

      return [...prev, goodsId];
    });
  };

  const selectedGroupCount = selectedGroups.length;
  const fullGroupCount = selectedGroups.filter(
    (item) => item.choosen_goods.length === 0
  ).length;
  const partialGoodsCount = selectedGoodsIds.length;

  const handleConfirm = () => {
    const goodsGroupIds = allGroupsSelected
      ? []
      : selectedGroups.map((item) => ({
          goods_group_id: item.goods_group_id,
          choosen_goods: [...item.choosen_goods],
        }));

    onConfirm?.({
      goods_group_ids: goodsGroupIds,
      goods_ids: [...new Set(selectedGoodsIds)],
    });
  };

  if (!open) return null;

  return (
    <div className="goods-filter-modal-overlay">
      <div className="goods-filter-modal">
        <div className="goods-filter-modal-header">
          <div>
            <h2>{title}</h2>
            <p>
              Tick cả nhóm để lấy toàn bộ vật tư trong nhóm, hoặc mở nhóm để chọn từng mã vật tư.
            </p>
          </div>
          <button type="button" className="goods-filter-modal-close" onClick={onClose} aria-label="Đóng">
            <RiCloseLine />
          </button>
        </div>

        <div className="goods-filter-modal-content">
          <aside className="goods-filter-groups">
            <div className="goods-filter-section-title">Nhóm vật tư, hàng hóa</div>
            <div className="goods-filter-group-list">
              <div className={`goods-filter-group-item ${selectedGroupKey === ALL_GROUP_KEY ? "active" : ""}`}>
                <label className="goods-filter-group-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allGroupsSelected}
                    onChange={(e) => handleToggleAllGroups(e.target.checked)}
                  />
                </label>
                <button
                  type="button"
                  className="goods-filter-group-nav"
                  onClick={() => {
                    setSelectedGroupKey(ALL_GROUP_KEY);
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <div className="goods-filter-group-main">
                    <span className="goods-filter-group-all-icon">▦</span>
                    <span>Tất cả nhóm</span>
                  </div>
                  <span className="goods-filter-group-arrow">›</span>
                </button>
              </div>

              {groupLoading ? (
                <div className="goods-filter-groups-loading">Đang tải nhóm...</div>
              ) : (
                groups.map((group) => {
                  const fullSelected = isGroupFullySelected(group.id);
                  const selectedCount = getGroupSelectedGoodsCount(group.id);
                  return (
                    <div
                      key={group.id}
                      className={`goods-filter-group-item ${String(selectedGroupKey) === String(group.id) ? "active" : ""}`}
                    >
                      <label className="goods-filter-group-checkbox" onClick={(e) => e.stopPropagation()} title="Chọn toàn bộ vật tư trong nhóm">
                        <input
                          type="checkbox"
                          checked={fullSelected}
                          disabled={allGroupsSelected}
                          onChange={(e) => handleToggleFullGroup(group, e.target.checked)}
                        />
                      </label>
                      <button
                        type="button"
                        className="goods-filter-group-nav"
                        onClick={() => {
                          setSelectedGroupKey(group.id);
                          setSearch("");
                          setPage(1);
                        }}
                      >
                        <div className="goods-filter-group-main">
                          <span className="goods-filter-group-code">{group.code || "-"}</span>
                          <span className="goods-filter-group-name">{group.name || "-"}</span>
                          {!fullSelected && selectedCount > 0 && (
                            <span className="goods-filter-group-count">{selectedCount}</span>
                          )}
                        </div>
                        <span className="goods-filter-group-arrow">›</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <section className="goods-filter-goods">
            <div className="goods-filter-goods-heading">
              <div>
                <h3>Chọn mã vật tư, hàng hóa</h3>
                <span>
                  {debouncedSearch
                    ? "Đang tìm trên toàn bộ danh mục"
                    : selectedGroup
                    ? `${selectedGroup.code} - ${selectedGroup.name}`
                    : "Tất cả nhóm"}
                </span>
              </div>
              {selectedGroup && isGroupFullySelected(selectedGroup.id) && (
                <div className="goods-filter-full-group-note">
                  <RiCheckLine /> Đã chọn toàn bộ nhóm
                </div>
              )}
            </div>

            <div className="goods-filter-search-wrap">
              <RiSearchLine />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã hoặc tên vật tư trên toàn bộ danh mục..."
              />
              {search && (
                <button type="button" className="goods-filter-clear-search" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm">
                  <RiCloseLine />
                </button>
              )}
            </div>

            <div className="goods-filter-table-wrap">
              <table className="goods-filter-table">
                <thead>
                  <tr>
                    <th className="goods-filter-checkbox-col"></th>
                    <th>Mã vật tư</th>
                    <th>Tên vật tư</th>
                    <th className="goods-filter-check-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {goodsLoading && (
                    <tr><td colSpan={4} className="goods-filter-empty">Đang tải vật tư...</td></tr>
                  )}

                  {!goodsLoading && goodsList.map((goods) => {
                  const selected = isGoodsSelected(goods);
                    return (
                        <tr
                          key={getGoodsId(goods)}
                          className={selected ? "selected" : ""}
                          onClick={() => handleToggleGoods(goods)}
                        >
                        <td className="goods-filter-checkbox-col">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleToggleGoods(goods)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        </td>
                        <td className="goods-filter-code-cell">{getGoodsCode(goods) || "-"}</td>
                        <td>{getGoodsName(goods) || "-"}</td>
                        <td className="goods-filter-check-col">{selected && <RiCheckLine />}</td>
                      </tr>
                    );
                  })}

                  {!goodsLoading && goodsList.length === 0 && (
                    <tr><td colSpan={4} className="goods-filter-empty">Không có vật tư phù hợp</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="goods-filter-pagination">
              <span>Tổng <strong>{pagination.total.toLocaleString("vi-VN")}</strong> vật tư</span>
              <div>
                <button type="button" disabled={page <= 1 || goodsLoading} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>‹</button>
                <span>{pagination.page} / {Math.max(1, pagination.total_pages)}</span>
                <button
                  type="button"
                  disabled={goodsLoading || pagination.page >= pagination.total_pages}
                  onClick={() => setPage((prev) => Math.min(pagination.total_pages, prev + 1))}
                >›</button>
              </div>
            </div>
          </section>
        </div>

        <div className="goods-filter-modal-footer">
          <div className="goods-filter-selected-count">
            {allGroupsSelected ? (
              <>
                <div>Phạm vi: <strong>Tất cả vật tư</strong></div>
                <span className="goods-filter-selected-preview">Không giới hạn theo nhóm vật tư</span>
              </>
            ) : (
              <>
                <div>Đã chọn: <strong>{selectedGroupCount}</strong> nhóm</div>
                <span className="goods-filter-selected-preview">
                  {fullGroupCount > 0 ? `${fullGroupCount} nhóm lấy toàn bộ` : ""}
                  {fullGroupCount > 0 && partialGoodsCount > 0 ? " • " : ""}
                  {partialGoodsCount > 0 ? `${partialGoodsCount} mã chọn lẻ` : ""}
                  {fullGroupCount === 0 && partialGoodsCount === 0 ? "Chưa chọn vật tư" : ""}
                </span>
              </>
            )}
          </div>

          <div className="goods-filter-footer-actions">
            <button type="button" className="goods-filter-cancel-btn" onClick={onClose}>Hủy</button>
            <button type="button" className="goods-filter-confirm-btn" onClick={handleConfirm}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoodsFilterModal;