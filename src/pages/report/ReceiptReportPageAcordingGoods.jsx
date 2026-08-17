import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ReceiptReportViewPage.css";

import { getWarehouseReceiptDetailReport } from "../../services/warehouseReceiptDetailReportService";
import ReportExcelExportButton from "../../components/ReportExcelExportButton";
import { REPORT_RECEIPT_DETAIL } from "../../services/reportExportService";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_PAGE_SIZE = 20;

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const text = String(value).trim();

  if (text.includes(",") && text.includes(".")) {
    return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (text.includes(",")) {
    return Number(text.replace(",", ".")) || 0;
  }

  return Number(text) || 0;
};

const formatMoney = (value) =>
  parseNumber(value).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value) =>
  parseNumber(value).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  });

const formatVat = (value) =>
  parseNumber(value).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const formatDate = (value) => {
  if (!value) return "-";

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  }

  return text;
};

function ReceiptReportPageAcordingGoods() {
  const navigate = useNavigate();
  const { canDo } = useAuth();
  const requestIdRef = useRef(0);

  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_pages: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportKey = params.get("reportKey");

    if (!reportKey) {
      alert("Thiếu thông tin mở báo cáo");
      return;
    }

    try {
      const raw = localStorage.getItem(reportKey);

      if (!raw) {
        alert("Không tìm thấy thông số báo cáo. Vui lòng mở lại từ trang bộ lọc.");
        return;
      }

      const parsed = JSON.parse(raw);

      if (parsed?.mode !== "goods") {
        alert("Thông số báo cáo không đúng chế độ mã vật tư");
        return;
      }

      setConfig(parsed);
    } catch (error) {
      console.error("READ REPORT CONFIG ERROR:", error);
      alert("Không đọc được thông số báo cáo");
    }
  }, []);

  const buildPayload = useCallback(
    (page, pageSize) => {
      if (!config) return {};

      const payload = {
        page,
        page_size: pageSize,
      };

      if (config.start_date) {
        payload.start_date = config.start_date;
      }

      if (config.end_date) {
        payload.end_date = config.end_date;
      }

      if (
        Array.isArray(config.company_ids) &&
        config.company_ids.length > 0
      ) {
        payload.company_ids = config.company_ids;
      }

      if (config.search) {
        payload.search = config.search;
      }

      if (
        Array.isArray(config.goods_group_ids) &&
        config.goods_group_ids.length > 0
      ) {
        payload.goods_group_ids = config.goods_group_ids;
      }

      if (
        Array.isArray(config.goods_ids) &&
        config.goods_ids.length > 0
      ) {
        payload.goods_ids = config.goods_ids;
      }

      return payload;
    },
    [config]
  );

  const buildExportPayload = useCallback(() => {
    const payload = buildPayload(1, DEFAULT_PAGE_SIZE);

    delete payload.page;
    delete payload.page_size;

    return payload;
  }, [buildPayload]);

  const normalizeResponse = (response) => {
    const body = response?.data ?? response;
    const data = body?.data ?? body ?? {};

    return {
      total: Number(data?.total ?? 0),
      page: Number(data?.page ?? 1),
      page_size: Number(data?.page_size ?? DEFAULT_PAGE_SIZE),
      total_pages: Number(data?.total_pages ?? 0),
      results: Array.isArray(data?.results) ? data.results : [],
    };
  };

  const fetchReport = useCallback(
    async (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
      if (!config) return;

      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);

        const response = await getWarehouseReceiptDetailReport(
          buildPayload(page, pageSize)
        );

        const data = normalizeResponse(response);

        if (requestId !== requestIdRef.current) return;

        setRows(data.results);

        setPagination({
          total: data.total,
          page: data.page,
          page_size: data.page_size,
          total_pages: data.total_pages,
        });
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error(
          "LOAD RECEIPT GOODS REPORT ERROR:",
          error?.response?.data || error
        );

        setRows([]);
        alert("Không tải được báo cáo nhập kho theo mã vật tư");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [buildPayload, config]
  );

  useEffect(() => {
    if (!config || !canDo("view_report")) return;

    fetchReport(1, DEFAULT_PAGE_SIZE);
  }, [config, canDo, fetchReport]);

  const visiblePages = useMemo(() => {
    if (pagination.total_pages <= 1) return [];

    const start = Math.max(1, pagination.page - 2);
    const end = Math.min(pagination.total_pages, pagination.page + 2);

    const pages = [];

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [pagination.page, pagination.total_pages]);

  const handleOpenReceiptDetail = (row) => {
    const receiptCode = String(row?.receipt_code || "").trim();

    if (!receiptCode) {
      alert("Không tìm thấy mã phiếu nhập");
      return;
    }

    // Show detail in the report page
    setSelectedReceipt(row);

    // Open import order detail page in a new tab with mode=print
    const path = `/dashboard/activity/import/order-detail/${encodeURIComponent(
      receiptCode
    )}?mode=print`;

    const url = window.location.origin + path;

    try {
      window.open(url, "_blank");
    } catch (e) {
      // Fallback — navigate in same tab if popup blocked
      navigate(path);
    }
  };

  if (!canDo("view_report")) {
    return (
      <div className="receipt-report-view-no-permission">
        Tài khoản không có quyền truy cập báo cáo kho
      </div>
    );
  }

  if (!config) {
    return (
      <div className="receipt-report-view-page">
        <div className="receipt-report-view-loading">
          Đang đọc thông số báo cáo...
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-report-view-page">
      <div className="receipt-report-view-shell">
        <div className="receipt-report-view-header">
          <div className="receipt-report-view-title">
            <h1>BÁO CÁO NHẬP KHO THEO MÃ VẬT TƯ</h1>
          </div>
        </div>

        <div className="receipt-report-toolbar">
          <div className="receipt-report-selected-detail">
            <h3>Chi tiết phiếu nhập:</h3>
            {selectedReceipt ? (
              <div className="receipt-report-detail-content">
                <div>
                  <strong>Số phiếu:</strong>{" "}
                  {selectedReceipt.receipt_code ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReceiptDetail(selectedReceipt);
                      }}
                      style={{
                        color: "#007bff",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      {selectedReceipt.receipt_code}
                    </button>
                  ) : (
                    "-"
                  )}
                </div>

                <div><strong>Ngày nhập:</strong> {formatDate(selectedReceipt.receipt_date)}</div>
                <div><strong>Công ty:</strong> {selectedReceipt.company_name || "-"}</div>
                <div><strong>Kho:</strong> {selectedReceipt.warehouse_name || "-"}</div>

                <div style={{ marginTop: 6, fontStyle: "italic", color: "#555" }}>
                  Ghi chú: Nhấp vào số phiếu để xem chi tiết lệnh nhập kho.
                </div>
              </div>
            ) : (
              <div className="receipt-report-detail-empty">(Chưa chọn phiếu nhập)</div>
            )}
          </div>
          <div className="receipt-report-toolbar-info">
            <div>
              <span>Từ ngày</span>
              <strong>{formatDate(config.start_date)}</strong>
            </div>

            <div>
              <span>Đến ngày</span>
              <strong>{formatDate(config.end_date)}</strong>
            </div>

            <div>
              <span>Công ty</span>
              <strong>
                {config.company_ids?.length > 0
                  ? `${config.company_ids.length} công ty`
                  : "Tất cả công ty"}
              </strong>
            </div>

            <div>
              <span>Vật tư</span>
              <strong>
                {config.goods_group_ids?.length > 0
                  ? `${config.goods_group_ids.length} nhóm đã chọn`
                  : config.goods_ids?.length > 0
                  ? `${config.goods_ids.length} mã`
                  : "Tất cả vật tư"}
              </strong>
            </div>

            {config.search && (
              <div>
                <span>Tìm kiếm</span>
                <strong>{config.search}</strong>
              </div>
            )}
          </div>

            <ReportExcelExportButton
              report={REPORT_RECEIPT_DETAIL}
              getFilters={buildExportPayload}
              disabled={loading}
              fileName="bao-cao-nhap-kho-theo-ma-vat-tu.xlsx"
            />
        </div>

        <div className="receipt-report-view-table-wrap">
          <table className="receipt-report-goods-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Số phiếu nhập</th>
                <th>Ngày nhập</th>
                <th>Mã hợp đồng</th>
                <th>Mã kho</th>
                <th>Tên kho</th>
                <th>Công ty</th>
                <th>MST</th>
                <th>Mã vật tư</th>
                <th>Tên vật tư</th>
                <th>ĐVT nhập</th>
                <th>SL nhập</th>
                <th>ĐVT chính</th>
                <th>SL quy đổi</th>
                <th>Đơn giá</th>
                <th>VAT (%)</th>
                <th>Tiền trước VAT</th>
                <th>Tiền VAT</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={19} className="receipt-report-view-empty">
                    Đang tải dữ liệu báo cáo...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={19} className="receipt-report-view-empty">
                    Không có dữ liệu báo cáo
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row, index) => {
                  const rowNumber =
                    (pagination.page - 1) * pagination.page_size +
                    index +
                    1;

                  return (
                    <tr
                      key={
                        row.inventory_id ||
                        `${row.warehouse_receipt_id}-${row.goods_id}-${index}`
                      }
                    >
                      <td>{rowNumber}</td>
                      <td>
                        {row.receipt_code ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReceiptDetail(row);
                            }}
                            style={{
                              color: "#007bff",
                              textDecoration: "underline",
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                            }}
                          >
                            {row.receipt_code}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{formatDate(row.receipt_date)}</td>
                      <td>{row.contract_code || "-"}</td>
                      <td>{row.warehouse_code || "-"}</td>
                      <td>{row.warehouse_name || "-"}</td>
                      <td>{row.company_name || "-"}</td>
                      <td>{row.company_tax_code || "-"}</td>
                      <td>{row.goods_code || "-"}</td>
                      <td>{row.goods_name || "-"}</td>
                      <td>{row.unit_name || "-"}</td>
                      <td className="text-right">
                        {formatQuantity(row.received_quantity)}
                      </td>
                      <td>{row.default_unit_name || "-"}</td>
                      <td className="text-right">
                        {formatQuantity(
                          row.received_quantity_in_default_unit
                        )}
                      </td>
                      <td className="text-right">
                        {formatMoney(row.unit_price)}
                      </td>
                      <td className="text-right">
                        {formatVat(row.vat)}
                      </td>
                      <td className="text-right">
                        {formatMoney(row.amount_before_vat)}
                      </td>
                      <td className="text-right">
                        {formatMoney(row.vat_amount)}
                      </td>
                      <td className="text-right">
                        {formatMoney(row.amount_with_vat)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 0 && (
          <div className="receipt-report-view-pagination">
            <div>
              Tổng:{" "}
              <strong>
                {pagination.total.toLocaleString("vi-VN")}
              </strong>{" "}
              dòng
            </div>

            <div className="receipt-report-view-pagination-actions">
              <select
                value={pagination.page_size}
                disabled={loading}
                onChange={(event) =>
                  fetchReport(1, Number(event.target.value))
                }
              >
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
                <option value={100}>100 dòng</option>
              </select>

              <button
                type="button"
                disabled={loading || pagination.page <= 1}
                onClick={() =>
                  fetchReport(
                    pagination.page - 1,
                    pagination.page_size
                  )
                }
              >
                ‹
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    page === pagination.page ? "active" : ""
                  }
                  disabled={loading}
                  onClick={() =>
                    fetchReport(page, pagination.page_size)
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={
                  loading ||
                  pagination.page >= pagination.total_pages
                }
                onClick={() =>
                  fetchReport(
                    pagination.page + 1,
                    pagination.page_size
                  )
                }
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceiptReportPageAcordingGoods;