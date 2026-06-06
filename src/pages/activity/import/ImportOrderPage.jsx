import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/ImportOrderPage.css"; 
import {
  getWarehouseReceiptsPageable,
  getWarehouseReceiptByCode,
  updateWarehouseReceiptStatus,
  deleteWarehouseReceipt,
} from "../../../services/warehouseReceiptService";

import {
  RiAddLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
} from "react-icons/ri";

function ImportOrderPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [importOrders, setImportOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [detailRows, setDetailRows] = useState([]);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);


 const unwrapData = (response) => response?.data || response;
 const navigate = useNavigate();
 const selectedRow = importOrders.find((item) => item.id === selectedId);

 const getReceiptStatusText = (status) => {
  switch (status) {
    case "WAITING_DELIVERY":
      return "Chờ nhận hàng";
    case "RECEIVED":
      return "Đã nhận hàng";
    case "COMPLETED":
      return "Đã hoàn thành";
    default:
      return "-";
  }
};

 const fetchImportOrderDetail = async (code) => {
  if (!code) {
    setDetailRows([]);
    setSelectedReceiptDetail(null);
    return;
  }

  try {
    setDetailLoading(true);

    const response = await getWarehouseReceiptByCode(code);
    const data = unwrapData(response);

    const rows =
        data?.inventory_lines ||
        data?.inventory ||
        data?.items ||
        data?.details ||
      [];
    setSelectedReceiptDetail(data);
    setDetailRows(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("LOAD IMPORT ORDER DETAIL ERROR:", error.response?.data || error);
    setSelectedReceiptDetail(null);
    setDetailRows([]);
    alert("Không tải được chi tiết hàng hóa");
  } finally {
    setDetailLoading(false);
  }
};

const fetchImportOrders = async () => {
  try {
    setLoading(true);

    const response = await getWarehouseReceiptsPageable({
      search,
      page,
      page_size: pageSize,
    });

    const data = unwrapData(response);

    const results = Array.isArray(data?.results) ? data.results : [];

    setImportOrders(results);
    setTotal(data?.total || results.length);

    if (results.length > 0) {
      const firstRow = results[0];

    if (!selectedId) {
      setSelectedId(firstRow.id);
      fetchImportOrderDetail(firstRow.code);
  }
} else {
  setSelectedId(null);
  setDetailRows([]);
}
  } catch (error) {
    console.error("LOAD IMPORT ORDERS ERROR:", error.response?.data || error);
    alert("Không tải được danh sách phiếu nhập");
    setImportOrders([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
      fetchImportOrders();
    }, [page, pageSize]);

    const parseMoney = (value) => {
      if (value === null || value === undefined || value === "") return 0;

      if (typeof value === "number") return value;

      const text = String(value).trim();

      if (text.includes(",") && text.includes(".")) {
        return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
      }

      if (text.includes(",")) {
        return Number(text.replace(",", ".")) || 0;
      }

      return Number(text) || 0;
    };

    const formatMoney = (value) => {
      return Number(value || 0).toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const detailTotalAmount = detailRows.reduce((sum, item) => {
    const quantity = parseMoney(item.original_quantity || item.quantity || 0);
    const unitPrice = parseMoney(item.unit_price || 0);

    return sum + quantity * unitPrice;
    }, 0);

    const detailVatRate = parseMoney(selectedReceiptDetail?.vat || 0);
    const detailVatAmount = detailTotalAmount * (detailVatRate / 100);
    const detailGrandTotal = detailTotalAmount + detailVatAmount;
    const handleCompleteReceipt = async (row) => {
    const confirmed = window.confirm(
        `Bạn có chắc muốn hoàn thành phiếu ${row.code || row.invoice_code || ""} không?`
      );

      if (!confirmed) return;

      try {
        await updateWarehouseReceiptStatus(row.id, {
            status: "COMPLETED",
        });

        setOpenActionId(null);
        await fetchImportOrders();
        alert("Hoàn thành phiếu nhập thành công");
      } catch (error) {
        console.error("COMPLETE RECEIPT ERROR:", error.response?.data || error);
        alert(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "Hoàn thành phiếu nhập thất bại"
        );
      }
    };
  const handleDeleteReceipt = async (row) => {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa phiếu ${row.code || row.invoice_code || ""} không?`
  );

  if (!confirmed) return;

  try {
    await deleteWarehouseReceipt(row.id);

    setOpenActionId(null);
    await fetchImportOrders();
    alert("Xóa phiếu nhập thành công");
  } catch (error) {
    console.error("DELETE RECEIPT ERROR:", error.response?.data || error);
    alert("Xóa phiếu nhập thất bại");
  }
};
  return (
    <div className="warehouse-import-page">
      <div className="warehouse-import-toolbar">
        <div className="warehouse-import-filters">
          <input
            className="warehouse-import-search"
            placeholder="🔍  Tìm kiếm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                fetchImportOrders();
              }
            }}
          />

          <select>
            <option>Thời gian: Đầu năm tới hiện tại</option>
            <option>Hôm nay</option>
            <option>Tháng này</option>
            <option>Năm này</option>
          </select>
        </div>

        <div className="warehouse-import-actions">
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

            if (selectedRow.status === "RECEIVED") {
              navigate(
                `/dashboard/activity/import/order-detail/${selectedRow.code || selectedRow.id}?mode=edit-items`
              );
              return;
            }

            navigate(
              `/dashboard/activity/import/order-detail/${selectedRow.code || selectedRow.id}`
            );
          }}
        >
          <RiEdit2Line />
          <span>Chỉnh sửa</span>
        </button>

          <button
            className="complete-toolbar-btn"
            disabled={!selectedRow}
            onClick={() => {
              if (!selectedRow) {
                alert("Vui lòng chọn phiếu cần hoàn thành");
                return;
              }

              handleCompleteReceipt(selectedRow);
            }}
          >
            <RiCheckboxCircleLine />
            <span>Hoàn thành</span>
          </button>

          <button
            className="delete-toolbar-btn"
            disabled={!selectedRow}
            onClick={() => {
              if (!selectedRow) {
                alert("Vui lòng chọn phiếu cần xóa");
                return;
              }

              handleDeleteReceipt(selectedRow);
            }}
          >
            <RiDeleteBin6Line />
            <span>Xóa</span>
          </button>

          <button
            className="add-btn"
            onClick={() => navigate("/dashboard/activity/import/order-detail/new")}
          >
            <RiAddLine />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      <div className="warehouse-import-main">
        <div className="warehouse-import-table-wrapper">
          <table className="warehouse-import-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                <th>Số hóa đơn</th>
                <th>Tình trạng thực hiện</th>
                <th>Ngày nhập kho</th>
                <th>Kho nhập</th>
                <th>Người thực hiện nhập</th>
                <th>Ngày tạo phiếu nhập</th>
                <th>Người sửa phiếu nhập</th>
                <th>Ngày sửa</th>
              </tr>
            </thead>

            <tbody>
              {importOrders.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? "selected" : ""}
                  onClick={() => {
                      setSelectedId(row.id);
                      fetchImportOrderDetail(row.code);
              }}
                >
                  <td className="checkbox-col">
                    <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                  </td>

                  <td
                    className="link-text"
                    onClick={(e) => {
                      e.stopPropagation();

                      navigate(
                        `/dashboard/activity/import/order-detail/${row.code || row.id}?mode=print`
                      );
                    }}
                  >
                    {row.invoice_code || row.invoice_no || row.code || "-"}
                  </td>
                    <td>{getReceiptStatusText(row.status)}</td>
                    <td>{row.receipt_date || row.import_date || "-"}</td>
                    <td>{row.warehouse_name || row.warehouse?.name || row.warehouse || "-"}</td>
                    <td>{row.created_by_admin_name || row.importer || "-"}</td>
                    <td>{row.created_at || "-"}</td>
                    <td>{row.last_updated_by_admin_name || "-"}</td>
                    <td>{row.updated_at || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="warehouse-import-pagination">
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
              {importOrders.length > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
              {Math.min(page * pageSize, total)}
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

        <div className="warehouse-import-detail">
          <h3>Chi tiết hàng hóa</h3>

          <div className="detail-table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã hàng</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th>SL yêu cầu</th>
                  <th>SL thực nhập</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
                <tbody>
                    {detailLoading && (
                      <tr>
                        <td colSpan={8}>Đang tải chi tiết...</td>
                      </tr>
                    )}

                    {!detailLoading && detailRows.length === 0 && (
                      <tr>
                        <td colSpan={8}>Không có chi tiết hàng hóa</td>
                      </tr>
                    )}

                    {!detailLoading &&
                      detailRows.map((item, index) => {
                        const quantity = parseMoney(item.original_quantity || 0);
                        const unitPrice = parseMoney(item.unit_price || 0);
                        const amount = quantity * unitPrice;

                        return (
                          <tr key={item.inventory_id || item.goods_id || index}>
                            <td>{index + 1}</td>
                            <td>{item.goods_code || "-"}</td>
                            <td>{item.goods_name || "-"}</td>
                            <td>{item.unit_name || "-"}</td>
                            <td className="number-col">{item.original_quantity || "-"}</td>
                            <td className="number-col">
                              {item.remaining_quantity || item.original_quantity || "-"}
                            </td>
                            <td className="number-col">{formatMoney(unitPrice)}</td>
                            <td className="number-col">{formatMoney(amount)}</td>
                          </tr>
                        );
                      })}

                    {!detailLoading && detailRows.length > 0 && (
                      <>
                        <tr className="detail-total-row">
                          <td></td>
                          <td>Tổng</td>
                          <td></td>
                          <td></td>
                          <td className="number-col">
                            {formatMoney(
                              detailRows.reduce(
                                (sum, item) => sum + parseMoney(item.original_quantity || 0),
                                0
                              )
                            )}
                          </td>
                          <td className="number-col">
                            {formatMoney(
                              detailRows.reduce(
                                (sum, item) =>
                                  sum +
                                  parseMoney(
                                    item.remaining_quantity || item.original_quantity || 0
                                  ),
                                0
                              )
                            )}
                          </td>
                          <td></td>
                          <td className="number-col">{formatMoney(detailTotalAmount)}</td>
                        </tr>

                        <tr className="detail-money-row">
                          <td colSpan={6}></td>
                          <td className="money-label">Cộng</td>
                          <td className="number-col money-value">
                            {formatMoney(detailTotalAmount)}
                          </td>
                        </tr>

                        <tr className="detail-money-row">
                          <td colSpan={6}></td>
                          <td className="money-label">
                            Tiền thuế VAT {detailVatRate ? `(${detailVatRate}%)` : ""}
                          </td>
                          <td className="number-col money-value">
                            {formatMoney(detailVatAmount)}
                          </td>
                        </tr>

                        <tr className="detail-money-row detail-grand-total-row">
                          <td colSpan={6}></td>
                          <td className="money-label">Tổng cộng</td>
                          <td className="number-col money-value">
                            {formatMoney(detailGrandTotal)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
            </table>
          </div>

          <div className="detail-pagination">
            <div>
              Tổng số: <strong>{detailRows.length}</strong>
            </div>

            <div className="pagination-right">
              <span>Số dòng/trang</span>
              <select defaultValue={30}>
                <option value={30}>30</option>
              </select>
              <strong>1 - {detailRows.length}</strong>
              <button>‹</button>
              <button>›</button>
            </div>
          </div>
        </div>
      </div>
    {openActionId && menuPosition && (
    <div
      className="row-action-menu fixed-row-action-menu"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          const row = importOrders.find((item) => item.id === openActionId);
          if (row) handleCompleteReceipt(row);
        }}
      >
        Hoàn thành
      </button>

      <button
        className="danger"
        onClick={() => {
          const row = importOrders.find((item) => item.id === openActionId);
          if (row) handleDeleteReceipt(row);
        }}
      >
        Xóa
      </button>
    </div>
  )}
    </div>
  );
}

export default ImportOrderPage;