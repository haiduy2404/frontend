import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/ReleaseOrderPage.css";
import "../../../styles/ReleaseOrderDetailPage.css";
import { getGoods } from "../../../services/goodsService";

import {
  getReleaseOrdersPageable,
  getReleaseOrderByCode,
  deleteReleaseOrder,
  submitReleaseOrder,
} from "../../../services/releaseOrderService";

import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
} from "react-icons/ri";

function ReleaseOrderPage() {
  const { canDo } = useAuth();
  const navigate = useNavigate();
  const [goodsMap, setGoodsMap] = useState({});

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [releaseOrders, setReleaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);

  const [detailRows, setDetailRows] = useState([]);
  const [selectedReleaseDetail, setSelectedReleaseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const unwrapData = (response) => response?.data || response;
  

  const fetchGoodsMap = async () => {
  const response = await getGoods({
    search: "",
    page: 1,
    page_size: 10000,
  });

  const results = response.data.results;

  const nextMap = {};
  results.forEach((goods) => {
    nextMap[goods.id] = goods;
  });

  setGoodsMap(nextMap);
};

    useEffect(() => {
    fetchGoodsMap();
    }, []);

  const filteredReleaseOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return releaseOrders;

    return releaseOrders.filter((row) => {
      const code = String(row.code || row.release_code || "").toLowerCase();
      const receiverUnit = String(row.receiver_unit || "").toLowerCase();
      const target = String(row.release_target || "").toLowerCase();

      return (
        code.includes(keyword) ||
        receiverUnit.includes(keyword) ||
        target.includes(keyword)
      );
    });
  }, [releaseOrders, search]);

  const selectedRow = filteredReleaseOrders.find(
    (item) => item.id === selectedId
  );

    const getReleaseStatusText = (status) => {
    switch (status) {
        case "PENDING":
        return "Nháp";
        case "WAIT_TO_APPROVE":
        return "Chờ duyệt";
        case "COMPLETED":
        return "Hoàn thành";
        case "CANCELLED":
        return "Đã hủy";
        default:
        return "-";
    }
    };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const text = String(value).trim();

    if (!text) return 0;

    let normalized = text;

    if (text.includes(",") && text.includes(".")) {
      normalized = text.replace(/\./g, "").replace(",", ".");
    } else if (text.includes(",")) {
      normalized = text.replace(",", ".");
    } else if ((text.match(/\./g) || []).length > 1) {
      normalized = text.replace(/\./g, "");
    }

    const number = Number(normalized);

    return Number.isNaN(number) ? 0 : number;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const unwrapApiData = (response) => {
    return response?.data;
   };

  const fetchReleaseOrderDetail = async (code) => {
    if (!code) {
      setDetailRows([]);
      setSelectedReleaseDetail(null);
      return;
    }

    try {
      setDetailLoading(true);

    const response = await getReleaseOrderByCode(code);
    const data = response.data;

    setSelectedReleaseDetail(data);
    setDetailRows(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error("LOAD RELEASE ORDER DETAIL ERROR:", error.response?.data || error);
      setSelectedReleaseDetail(null);
      setDetailRows([]);
      alert("Không tải được chi tiết hàng hóa xuất kho");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchReleaseOrders = async (customParams = {}) => {
    try {
      setLoading(true);

      const response = await getReleaseOrdersPageable({
        search,
        page,
        page_size: pageSize,
        ...customParams,
      });

      const data = unwrapData(response);
      const results = Array.isArray(data?.results) ? data.results : [];

      setReleaseOrders(results);
      setSelectedIds([]);
      setTotal(data?.total || data?.count || results.length);

      if (results.length > 0) {
        const firstRow = results[0];

        if (!selectedId) {
          setSelectedId(firstRow.id);
          fetchReleaseOrderDetail(firstRow.code || firstRow.release_code);
        }
      } else {
        setSelectedId(null);
        setDetailRows([]);
        setSelectedReleaseDetail(null);
      }
    } catch (error) {
      console.error("LOAD RELEASE ORDERS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách phiếu xuất kho");
      setReleaseOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseOrders();
  }, [page, pageSize]);

    const handleCompleteRelease = async (row) => {
    const confirmed = window.confirm(
        `Bạn có chắc muốn trình duyệt lệnh ${
        row.code || row.release_code || ""
        } không?`
    );

    if (!confirmed) return;

    try {
        await submitReleaseOrder(row.id);

        await fetchReleaseOrders();

        alert("Trình duyệt lệnh xuất kho thành công");
    } catch (error) {
        console.error(
        "SUBMIT RELEASE ORDER ERROR:",
        error.response?.data || error
        );

        alert(
        error.response?.data?.message ||
            error.response?.data?.detail ||
            "Trình duyệt lệnh xuất kho thất bại"
        );
    }
    };

  const handleDeleteRelease = async (row) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phiếu ${row.code || row.release_code || ""} không?`
    );

    if (!confirmed) return;

    try {
      await deleteReleaseOrder(row.id);

      setSelectedId(null);
      setDetailRows([]);
      setSelectedReleaseDetail(null);

      await fetchReleaseOrders();
      alert("Xóa phiếu xuất kho thành công");
    } catch (error) {
      console.error("DELETE RELEASE ORDER ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa phiếu xuất kho thất bại"
      );
    }
  };

  const isAllChecked =
    filteredReleaseOrders.length > 0 &&
    filteredReleaseOrders.every((row) => selectedIds.includes(row.id));

  const handleToggleAll = (e) => {
    const checked = e.target.checked;

    if (checked) {
      setSelectedIds(filteredReleaseOrders.map((row) => row.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (e, rowId) => {
    e.stopPropagation();

    setSelectedIds((prev) => {
      if (prev.includes(rowId)) {
        return prev.filter((id) => id !== rowId);
      }

      return [...prev, rowId];
    });
  };

  const handleDeleteSelectedReleases = async () => {
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một phiếu cần xóa");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} phiếu xuất kho đã chọn không?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteReleaseOrder(id)));

      setSelectedIds([]);
      setSelectedId(null);
      setDetailRows([]);
      setSelectedReleaseDetail(null);

      await fetchReleaseOrders();

      alert("Xóa các phiếu xuất kho đã chọn thành công");
    } catch (error) {
      console.error("DELETE SELECTED RELEASE ORDERS ERROR:", error.response?.data || error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Xóa các phiếu xuất kho đã chọn thất bại"
      );
    }
  };

  return (
    <div className="release-order-page">
    <div className="release-order-tabs">
      <button
        type="button"
        className="release-order-tab active"
        onClick={() => navigate("/dashboard/activity/export/order")}
      >
        Lệnh xuất kho
      </button>

      <button
        type="button"
        className="release-order-tab"
        onClick={() => navigate("/dashboard/activity/export/release")}
      >
        Xuất kho
      </button>
    </div>
      <div className="release-order-toolbar">
        <div className="release-order-filters">
          <input
            className="release-order-search"
            placeholder="🔍  Tìm kiếm số phiếu xuất / đơn vị lĩnh"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
            }}
          />
        </div>

        <div className="release-order-actions">
          {canDo("update_warehouse_release") && (
            <button
              className="edit-btn"
              disabled={!selectedRow || selectedRow.status === "COMPLETED"}
              onClick={() => {
                if (!selectedRow) {
                  alert("Vui lòng chọn phiếu cần chỉnh sửa");
                  return;
                }

                if (selectedRow.status === "COMPLETED") {
                  alert("Phiếu đã hoàn thành, không được chỉnh sửa.");
                  return;
                }

                navigate(
                `/dashboard/activity/export/order-detail/${
                    selectedRow.code || selectedRow.release_code || selectedRow.id
                }`
                );
              }}
            >
              <RiEdit2Line />
              <span>Chỉnh sửa</span>
            </button>
          )}

          {canDo("complete warehouse release") && (
            <button
              className="complete-toolbar-btn"
              disabled={!selectedRow}
              onClick={() => {
                if (!selectedRow) {
                  alert("Vui lòng chọn phiếu cần hoàn thành");
                  return;
                }

                handleCompleteRelease(selectedRow);
              }}
            >
              <RiCheckboxCircleLine />
              <span>Hoàn thành</span>
            </button>
          )}

          {canDo("delete_warehouse_release") && (
            <button
              className="delete-toolbar-btn"
              disabled={!selectedRow && selectedIds.length === 0}
              onClick={() => {
                if (selectedIds.length > 0) {
                  handleDeleteSelectedReleases();
                  return;
                }

                if (!selectedRow) {
                  alert("Vui lòng chọn phiếu cần xóa");
                  return;
                }

                handleDeleteRelease(selectedRow);
              }}
            >
              <RiDeleteBin6Line />
              <span>
                {selectedIds.length > 0 ? `Xóa (${selectedIds.length})` : "Xóa"}
              </span>
            </button>
          )}

          {canDo("create_warehouse_release") && (
            <button
              className="add-btn"
              onClick={() =>
                navigate("/dashboard/activity/export/order-detail/new")
              }
            >
              <RiAddLine />
              <span>Thêm</span>
            </button>
          )}
        </div>
      </div>

      <div className="release-order-main">
        <div className="release-order-table-wrapper">
          <table className="release-order-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={handleToggleAll}
                  />
                </th>
                <th>Số phiếu XK</th>
                <th>Tình trạng thực hiện</th>
                <th>Đơn vị lĩnh vật tư</th>
                <th>Đối tượng xuất kho</th>
                <th>Người tạo phiếu xuất</th>
                <th>Ngày tạo</th>
                <th>Người sửa phiếu xuất</th>
                <th>Ngày sửa</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9}>Đang tải danh sách phiếu xuất kho...</td>
                </tr>
              )}

              {!loading && filteredReleaseOrders.length === 0 && (
                <tr>
                  <td colSpan={9}>Không có dữ liệu phiếu xuất kho</td>
                </tr>
              )}

              {!loading &&
                filteredReleaseOrders.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? "selected" : ""}
                    onClick={() => {
                      setSelectedId(row.id);
                      fetchReleaseOrderDetail(row.code || row.release_code);
                    }}
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => handleToggleOne(e, row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>

                    <td
                      className="link-text"
                      onClick={(e) => {
                        e.stopPropagation();

                        navigate(
                        `/dashboard/activity/export/order-detail/${
                            row.code || row.release_code || row.id
                        }?mode=print`
                        );
                      }}
                    >
                      {row.code || row.release_code || "-"}
                    </td>

                    <td>{getReleaseStatusText(row.status)}</td>
                    <td>{row.receiver_unit?.name || "-"}</td>
                    <td>{row.release_target?.name || "-"}</td>
                    <td>{row.created_by_admin_name || row.created_by || "-"}</td>
                    <td>{row.created_at || "-"}</td>
                    <td>{row.last_updated_by_admin_name || "-"}</td>
                    <td>{row.updated_at || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="release-order-pagination">
          <div>
            Tổng số: <strong>{total}</strong>
          </div>

          <div className="pagination-right">
            <span>Số dòng/trang</span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <strong>
              {filteredReleaseOrders.length > 0 ? 1 : 0} -{" "}
              {filteredReleaseOrders.length}
            </strong>

            <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
              ‹
            </button>

            <button
              disabled={page * pageSize >= total}
              onClick={() => setPage((prev) => prev + 1)}
            >
              ›
            </button>
          </div>
        </div>

        <div className="detail-splitter">⌄</div>

        <div className="release-order-detail">
          <h3>Chi tiết hàng hóa xuất kho</h3>

          <div className="import-list-detail-card">
            <div className="detail-search">
              <span>🔍</span>
              <input placeholder="Tìm kiếm" readOnly />
            </div>

            <div className="import-list-detail-table-wrapper">
              <table className="import-list-detail-table">
                <colgroup>
                  <col className="col-stt" />
                  <col className="col-code" />
                  <col className="col-name" />
                  <col className="col-unit" />
                  <col className="col-qty" />
                  <col className="col-qty" />
                </colgroup>

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã hàng</th>
                    <th>Tên hàng</th>
                    <th>ĐVT</th>
                    <th>Tỷ lệ chuyển đổi</th>
                    <th>SL yêu cầu</th>
                  </tr>
                </thead>

                <tbody>
                  {detailLoading && (
                    <tr>
                      <td colSpan={6}>Đang tải chi tiết...</td>
                    </tr>
                  )}

                  {!detailLoading && detailRows.length === 0 && (
                    <tr>
                      <td colSpan={6}>Không có chi tiết hàng hóa</td>
                    </tr>
                  )}

                  {!detailLoading &&
                    detailRows.map((item, index) => {
                    const requestedQuantity = parseNumber(item.requested_quantity);

                      return (
                        <tr key={item.release_inventory_id || item.goods_id || index}>
                          <td>{index + 1}</td>
                        <td>{goodsMap[item.goods_id]?.code || ""}</td>
                        <td>{goodsMap[item.goods_id]?.name || ""}</td>
                        <td>
                        {
                            goodsMap[item.goods_id]?.units?.find(
                            (unit) => String(unit.unit_id) === String(item.goods_unit_id)
                            )?.unit_name || ""
                        }
                        </td>

                          <td className="number-col">
                            {formatViNumber(item.conversion_ratio || 1, 3)}
                          </td>

                          <td className="number-col">
                            {formatViNumber(requestedQuantity, 2)}
                          </td>
                        </tr>
                      );
                    })}

                  {!detailLoading && detailRows.length > 0 && (
                    <tr className="table-total-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    <td className="number-col">
                    {formatViNumber(
                        detailRows.reduce(
                        (sum, item) =>
                            sum + parseNumber(item.requested_quantity || 0),
                        0
                        ),
                        2
                    )}
                    </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-bottom-bar">
              <div>
                Tổng số: <strong>{detailRows.length}</strong>
              </div>

              <div className="table-pagination">
                <span>Số dòng/trang</span>
                <select defaultValue={20}>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <strong>1 - {detailRows.length}</strong>
                <button disabled>‹</button>
                <button disabled>›</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseOrderPage;