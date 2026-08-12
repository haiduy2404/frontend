import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/WarehouseReceiptReportPage.css";

import { getWarehouseReceiptDetailReport } from "../../services/warehouseReceiptDetailReportService";
import { getCompanies } from "../../services/companyService";
import ReportExcelExportButton from "../../components/ReportExcelExportButton";
import { REPORT_RECEIPT_DETAIL } from "../../services/reportExportService";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_PAGE_SIZE = 20;

function WarehouseReceiptReportPage() {
  const { canDo } = useAuth();
  const reportRequestIdRef = useRef(0);

  const [filters, setFilters] = useState({
    search: "",
    start_date: "",
    end_date: "",
    company_id: "",
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
  });

  const [companies, setCompanies] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportRows, setReportRows] = useState([]);
  const [hasLoadedReport, setHasLoadedReport] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_pages: 0,
  });

  const unwrapResponseData = (response) => response?.data ?? response;

  const normalizePaginatedData = (response) => {
    const body = unwrapResponseData(response);

    // Hỗ trợ cả 2 kiểu response thường gặp:
    // 1) { error_code, message, data: { total, page, page_size, total_pages, results } }
    // 2) { total, page, page_size, total_pages, results }
    const data = body?.data ?? body ?? {};

    return {
      total: Number(data?.total ?? 0),
      page: Number(data?.page ?? 1),
      page_size: Number(data?.page_size ?? DEFAULT_PAGE_SIZE),
      total_pages: Number(data?.total_pages ?? 0),
      results: Array.isArray(data?.results) ? data.results : [],
    };
  };

  const fetchCompanies = useCallback(async () => {
    try {
      setCompanyLoading(true);

      const response = await getCompanies({
        page: 1,
        page_size: 1000,
      });

      const body = unwrapResponseData(response);
      const data = body?.data ?? body;

      const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      setCompanies(results);
    } catch (error) {
      console.error("LOAD COMPANIES ERROR:", error?.response?.data || error);
      setCompanies([]);
    } finally {
      setCompanyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // GET /api/inventory/reports/receipt/pageable
  // Tất cả filter đều optional, nhưng pageable có thêm page/page_size.
  const buildPageableParams = useCallback((customFilters = filters) => {
    const params = {
      page: Number(customFilters.page) || 1,
      page_size: Number(customFilters.page_size) || DEFAULT_PAGE_SIZE,
    };

    const search = String(customFilters.search || "").trim();

    if (search) {
      params.search = search;
    }

    if (customFilters.start_date) {
      params.start_date = customFilters.start_date;
    }

    if (customFilters.end_date) {
      params.end_date = customFilters.end_date;
    }

    if (customFilters.company_id) {
      params.company_id = customFilters.company_id;
    }

    return params;
  }, [filters]);

  // POST /api/inventory/reports/receipt/export
  // Body giống filter pageable nhưng TUYỆT ĐỐI không gửi page/page_size.
  const buildExportFilters = useCallback((customFilters = filters) => {
    const payload = {};
    const search = String(customFilters.search || "").trim();

    if (search) {
      payload.search = search;
    }

    if (customFilters.start_date) {
      payload.start_date = customFilters.start_date;
    }

    if (customFilters.end_date) {
      payload.end_date = customFilters.end_date;
    }

    if (customFilters.company_id) {
      payload.company_id = customFilters.company_id;
    }

    return payload;
  }, [filters]);

  const validateDateRange = (customFilters = filters) => {
    if (
      customFilters.start_date &&
      customFilters.end_date &&
      customFilters.start_date > customFilters.end_date
    ) {
      alert("Từ ngày không được lớn hơn Đến ngày");
      return false;
    }

    return true;
  };

  const fetchReport = useCallback(
    async (customFilters = filters) => {
      if (!validateDateRange(customFilters)) return;

      const requestId = ++reportRequestIdRef.current;

      try {
        setReportLoading(true);

        const params = buildPageableParams(customFilters);
        const response = await getWarehouseReceiptDetailReport(params);
        const data = normalizePaginatedData(response);

        if (requestId !== reportRequestIdRef.current) return;

        setReportRows(data.results);
        setPagination({
          total: data.total,
          page: data.page,
          page_size: data.page_size,
          total_pages: data.total_pages,
        });
        setHasLoadedReport(true);

        // Đồng bộ page/page_size thực tế mà BE trả về vào filter hiện tại.
        setFilters((prev) => ({
          ...prev,
          page: data.page,
          page_size: data.page_size,
        }));
      } catch (error) {
        console.error(
          "LOAD RECEIPT DETAIL REPORT ERROR:",
          error?.response?.data || error
        );

        if (requestId !== reportRequestIdRef.current) return;

        alert("Không tải được báo cáo nhập kho");
        setReportRows([]);
        setPagination((prev) => ({
          ...prev,
          total: 0,
          total_pages: 0,
        }));
        setHasLoadedReport(true);
      } finally {
        if (requestId === reportRequestIdRef.current) {
          setReportLoading(false);
        }
      }
    },
    [buildPageableParams, filters]
  );

  const handleViewReport = () => {
    const nextFilters = {
      ...filters,
      page: 1,
    };

    setFilters(nextFilters);
    fetchReport(nextFilters);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleViewReport();
  };

  const handleReset = () => {
    setFilters({
      search: "",
      start_date: "",
      end_date: "",
      company_id: "",
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
    });

    setReportRows([]);
    setPagination({
      total: 0,
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      total_pages: 0,
    });
    setHasLoadedReport(false);
  };

  const handlePageChange = (nextPage) => {
    if (reportLoading) return;
    if (nextPage < 1) return;
    if (pagination.total_pages > 0 && nextPage > pagination.total_pages) return;

    const nextFilters = {
      ...filters,
      page: nextPage,
    };

    setFilters(nextFilters);
    fetchReport(nextFilters);
  };

  const handlePageSizeChange = (event) => {
    const nextPageSize = Number(event.target.value) || DEFAULT_PAGE_SIZE;

    const nextFilters = {
      ...filters,
      page: 1,
      page_size: nextPageSize,
    };

    setFilters(nextFilters);

    if (hasLoadedReport) {
      fetchReport(nextFilters);
    }
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;

    const text = String(value).trim();

    // API mới trả Decimal dạng chuỗi, ví dụ "150000.00000".
    // Trường hợp dữ liệu cũ có định dạng vi-VN vẫn xử lý được.
    if (text.includes(",") && text.includes(".")) {
      return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
    }

    if (text.includes(",")) {
      return Number(text.replace(",", ".")) || 0;
    }

    return Number(text) || 0;
  };

  const formatQuantity = (value) => {
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5,
    });
  };

  const formatMoney = (value) => {
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatVat = (value) => {
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const text = String(value).trim();

    // API ví dụ trả sẵn DD/MM/YYYY => giữ nguyên.
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      return text;
    }

    // Nếu API/BE có lúc trả YYYY-MM-DD thì đổi sang DD/MM/YYYY.
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const [year, month, day] = text.slice(0, 10).split("-");
      return `${day}/${month}/${year}`;
    }

    return text;
  };

  const getCompanyId = (company) =>
    company?.id || company?.company_id || company?.supplier_id || "";

  const getCompanyName = (company) =>
    company?.supplier_name || company?.company_name || company?.name || "-";

  const getCompanyTaxCode = (company) =>
    company?.tax_code || company?.company_tax_code || "";

  const selectedCompany = useMemo(() => {
    if (!filters.company_id) return null;

    return companies.find(
      (company) => String(getCompanyId(company)) === String(filters.company_id)
    );
  }, [companies, filters.company_id]);

  const visiblePageNumbers = useMemo(() => {
    const totalPages = pagination.total_pages;
    const currentPage = pagination.page;

    if (totalPages <= 1) return [];

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    const pages = [];

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [pagination.page, pagination.total_pages]);

  const handleOpenImportDetailPrint = (receiptCode) => {
    if (!receiptCode) return;

    window.open(
      `/dashboard/activity/import/order-detail/${receiptCode}?mode=print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!canDo("view_report")) {
    return (
      <div className="no-permission-page">
        Tài khoản không có quyền truy cập báo cáo kho
      </div>
    );
  }

  return (
    <div className="warehouse-company-report-page">
      <div className="warehouse-company-report-toolbar">
        <div className="warehouse-company-report-filters">
          <label className="report-filter-item">
            <span>Tìm kiếm</span>
            <input
              type="text"
              value={filters.search}
              placeholder="Mã vật tư / tên vật tư / số phiếu nhập..."
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                  page: 1,
                }))
              }
              onKeyDown={handleSearchKeyDown}
            />
          </label>

          <label className="report-filter-item">
            <span>Từ ngày</span>
            <input
              type="date"
              value={filters.start_date}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  start_date: event.target.value,
                  page: 1,
                }))
              }
            />
          </label>

          <label className="report-filter-item">
            <span>Đến ngày</span>
            <input
              type="date"
              value={filters.end_date}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  end_date: event.target.value,
                  page: 1,
                }))
              }
            />
          </label>

          <label className="report-filter-item">
            <span>Công ty</span>
            <select
              value={filters.company_id}
              disabled={companyLoading}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  company_id: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">
                {companyLoading ? "Đang tải công ty..." : "Tất cả công ty"}
              </option>

              {companies.map((company) => {
                const companyId = getCompanyId(company);
                const companyName = getCompanyName(company);
                const taxCode = getCompanyTaxCode(company);

                return (
                  <option key={companyId} value={companyId}>
                    {companyName}
                    {taxCode ? ` - MST: ${taxCode}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            type="button"
            className="report-primary-btn"
            onClick={handleViewReport}
            disabled={reportLoading}
          >
            {reportLoading ? "Đang tải..." : "Xem báo cáo"}
          </button>

          <button
            type="button"
            className="report-reset-btn"
            onClick={handleReset}
            disabled={reportLoading}
          >
            Đặt lại
          </button>

          <ReportExcelExportButton
            report={REPORT_RECEIPT_DETAIL}
            getFilters={buildExportFilters}
            disabled={reportLoading}
            fileName="bao-cao-nhap-kho.xlsx"
          />
        </div>
      </div>

      <div className="warehouse-company-report-card">
        <div className="warehouse-company-report-paper">
          <div className="report-title-row">
            <h1>BÁO CÁO NHẬP KHO</h1>
          </div>

          <div className="report-date-range">
            Từ ngày: <strong>{formatDate(filters.start_date)}</strong>
            <span>-</span>
            Đến ngày: <strong>{formatDate(filters.end_date)}</strong>
            {selectedCompany && (
              <>
                <span>-</span>
                Công ty: <strong>{getCompanyName(selectedCompany)}</strong>
              </>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              className="warehouse-company-report-table"
              style={{ minWidth: "2400px" }}
            >
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
                {reportLoading && (
                  <tr>
                    <td colSpan={19} className="empty-row">
                      Đang tải dữ liệu báo cáo...
                    </td>
                  </tr>
                )}

                {!reportLoading && reportRows.length === 0 && (
                  <tr>
                    <td colSpan={19} className="empty-row">
                      {hasLoadedReport
                        ? "Không có dữ liệu báo cáo"
                        : "Chọn bộ lọc rồi bấm Xem báo cáo"}
                    </td>
                  </tr>
                )}

                {!reportLoading &&
                  reportRows.map((row, index) => {
                    const rowNumber =
                      (pagination.page - 1) * pagination.page_size + index + 1;

                    return (
                      <tr
                        key={
                          row.inventory_id ||
                          `${row.warehouse_receipt_id}-${row.goods_id}-${index}`
                        }
                      >
                        <td>{rowNumber}</td>

                        <td
                          className="link-text"
                          onClick={() => handleOpenImportDetailPrint(row.receipt_code)}
                        >
                          {row.receipt_code || "-"}
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
                          {formatQuantity(row.received_quantity_in_default_unit)}
                        </td>

                        <td className="text-right">
                          {formatMoney(row.unit_price)}
                        </td>

                        <td className="text-right">{formatVat(row.vat)}</td>

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

          {hasLoadedReport && !reportLoading && (
            <div
              className="report-pagination"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 16,
              }}
            >
              <div>
                Tổng: <strong>{pagination.total.toLocaleString("vi-VN")}</strong> dòng
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <label>
                  Hiển thị{" "}
                  <select
                    value={filters.page_size}
                    onChange={handlePageSizeChange}
                    disabled={reportLoading}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>{" "}
                  dòng/trang
                </label>

                <button
                  type="button"
                  className="report-reset-btn"
                  disabled={pagination.page <= 1 || reportLoading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  ‹ Trước
                </button>

                {visiblePageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === pagination.page
                        ? "report-primary-btn"
                        : "report-reset-btn"
                    }
                    disabled={reportLoading}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="report-reset-btn"
                  disabled={
                    pagination.total_pages === 0 ||
                    pagination.page >= pagination.total_pages ||
                    reportLoading
                  }
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Sau ›
                </button>

                <span>
                  Trang <strong>{pagination.page}</strong>
                  {pagination.total_pages > 0 && (
                    <>
                      /<strong>{pagination.total_pages}</strong>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="report-note">
            Ghi chú: Một dòng báo cáo tương ứng một dòng vật tư của phiếu nhập kho.
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarehouseReceiptReportPage;