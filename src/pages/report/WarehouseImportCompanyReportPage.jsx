import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/WarehouseImportCompanyReportPage.css";

import { getWarehouseReceiptByCode } from "../../services/warehouseReceiptService";
import { getWarehouseReceiptCompanySummary } from "../../services/warehouseReceiptReportService";
import { getCompanies } from "../../services/companyService";

function WarehouseImportCompanyReportPage() {
  const companyDropdownRef = useRef(null);

  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    companyIds: [],
  });

  const [companies, setCompanies] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [companyLoading, setCompanyLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartCompanyIds, setChartCompanyIds] = useState([]);
  const [chartMetrics, setChartMetrics] = useState({
    goodsAmount: true,
    vatAmount: true,
    totalAmount: true,
  });
  

  const unwrapData = (response) => response?.data || response;

    useEffect(() => {
        fetchCompanies();
    }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target)
      ) {
        setIsCompanyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCompanies = async () => {
    try {
      setCompanyLoading(true);

      const response = await getCompanies({
        page: 1,
        page_size: 1000,
      });

      const data = unwrapData(response);

      const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      setCompanies(results);
    } catch (error) {
      console.error("LOAD COMPANIES ERROR:", error.response?.data || error);
      alert("Không tải được danh sách công ty");
      setCompanies([]);
    } finally {
      setCompanyLoading(false);
    }
  };

    const fetchReport = async (customFilters = filters) => {
    try {
        setReportLoading(true);

        const params = {
        page: 1,
        page_size: 1000,
        };

        if (customFilters.start_date) {
            params.start_date = customFilters.start_date;
        }

        if (customFilters.end_date) {
            params.end_date = customFilters.end_date;
        }

        if (customFilters.companyIds.length === 1) {
            params.company_id = customFilters.companyIds[0];
        }

        if (customFilters.companyIds.length > 1) {
            params.company_ids = customFilters.companyIds.join(",");
        }

        const response = await getWarehouseReceiptCompanySummary(params);
        const data = unwrapData(response);

        const results = Array.isArray(data?.data?.results)
          ? data.data.results
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        setReportRows(results);
        setChartCompanyIds(results.map((item) => item.company_id));
            setChartMetrics({
              goodsAmount: true,
              vatAmount: true,
              totalAmount: true,
            });
        setSelectedReceipt(null);
        setDetailRows([]);
    } catch (error) {
        console.error("LOAD IMPORT COMPANY REPORT ERROR:", error.response?.data || error);
        alert("Không tải được báo cáo nhập kho theo công ty");
        setReportRows([]);
        setSelectedReceipt(null);
        setDetailRows([]);
    } finally {
        setReportLoading(false);
    }
    };

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
    return parseMoney(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value) => {
    return parseMoney(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const text = String(value);

    if (text.includes("-") && text.length >= 10) {
      const [year, month, day] = text.slice(0, 10).split("-");

      if (year?.length === 4) {
        return `${day}/${month}/${year}`;
      }
    }

    return text;
  };

    const getReceiptCode = (row) => {
      return row?.pnk_code || row?.code || row?.receipt_code || row?.receiptCode || "-";
  };

    const handleOpenImportDetailPrint = (receiptCode) => {
    if (!receiptCode || receiptCode === "-") return;

    window.open(
      `/dashboard/activity/import/order-detail/${receiptCode}?mode=print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

    const selectedCompanyText = useMemo(() => {
    if (filters.companyIds.length === 0) return "Tất cả công ty";

    if (
        companies.length > 0 &&
        filters.companyIds.length === companies.length
    ) {
        return "Tất cả công ty";
    }

    if (filters.companyIds.length === 1) {
      const company = companies.find(
        (item) => String(item.id) === String(filters.companyIds[0])
      );

      return company?.supplier_name || "Đã chọn 1 công ty";
    }

    return `Đã chọn ${filters.companyIds.length} công ty`;
    }, [companies, filters.companyIds]);

    const filteredReportRows = useMemo(() => {
        return reportRows;
    }, [reportRows]);

    const groupedRows = useMemo(() => {
      return reportRows.map((company) => ({
        companyId: company.company_id,
        companyName: company.company_name || "-",
        companyTaxCode: company.tax_code || "",
        items: Array.isArray(company.receipts)
          ? company.receipts.map((receipt) => ({
              raw: receipt,
              receiptId: receipt.pnk_id,
              receiptCode: receipt.pnk_code,
              receiptDate: receipt.receipt_date,
              goodsAmount: parseMoney(receipt.goods_amount),
              vatAmount: parseMoney(receipt.vat_amount),
              totalAmount: parseMoney(receipt.total_amount),
            }))
          : [],
        goodsAmount: parseMoney(company.company_goods_amount),
        vatAmount: parseMoney(company.company_vat_amount),
        totalAmount: parseMoney(company.company_total_amount),
      }));
    }, [reportRows]);

  const grandTotal = useMemo(() => {
    return groupedRows.reduce(
      (sum, group) => {
        sum.goodsAmount += group.goodsAmount;
        sum.vatAmount += group.vatAmount;
        sum.totalAmount += group.totalAmount;

        return sum;
      },
      {
        goodsAmount: 0,
        vatAmount: 0,
        totalAmount: 0,
      }
    );
  }, [groupedRows]);

  const handleToggleCompany = (companyId) => {
    setFilters((prev) => {
      const checked = prev.companyIds.includes(companyId);

      return {
        ...prev,
        companyIds: checked
          ? prev.companyIds.filter((id) => id !== companyId)
          : [...prev.companyIds, companyId],
      };
    });
  };

  const handleToggleAllCompanies = () => {
    setFilters((prev) => {
      const allCompanyIds = companies.map((company) => company.id);
      const isAllChecked =
        allCompanyIds.length > 0 &&
        prev.companyIds.length === allCompanyIds.length;

      return {
        ...prev,
        companyIds: isAllChecked ? [] : allCompanyIds,
      };
    });
  };

    const handleClearCompanies = () => {
        setFilters((prev) => ({
        ...prev,
        companyIds: [],
        }));
    };

        const handleReset = () => {
            setFilters({
                start_date: "",
                end_date: "",
                companyIds: [],
            });

            setReportRows([]);
            setSelectedReceipt(null);
            setDetailRows([]);
            setIsChartModalOpen(false);
            setChartCompanyIds([]);
            setChartMetrics({
              goodsAmount: true,
              vatAmount: true,
              totalAmount: true,
            });
        };
    const fetchReceiptDetail = async (receiptCode) => {
    if (!receiptCode || receiptCode === "-") {
        setSelectedReceipt(null);
        setDetailRows([]);
        return;
    }

    try {
        setDetailLoading(true);

        const response = await getWarehouseReceiptByCode(receiptCode);
        const data = unwrapData(response);

        const rows =
        data?.inventory_lines ||
        data?.inventory ||
        data?.items ||
        data?.details ||
        [];

        setSelectedReceipt(data);
        setDetailRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
        console.error("LOAD RECEIPT DETAIL ERROR:", error.response?.data || error);
        alert("Không tải được chi tiết hàng hóa");
        setSelectedReceipt(null);
        setDetailRows([]);
    } finally {
        setDetailLoading(false);
    }
    };
    
const handleOpenChartModal = () => {
  if (reportRows.length === 0) return;

  setChartCompanyIds((prev) =>
    prev.length > 0 ? prev : reportRows.map((item) => item.company_id)
  );

  setIsChartModalOpen(true);
};

const handleToggleChartCompany = (companyId) => {
  setChartCompanyIds((prev) =>
    prev.includes(companyId)
      ? prev.filter((id) => id !== companyId)
      : [...prev, companyId]
  );
};

const handleToggleAllChartCompanies = () => {
  const allIds = reportRows.map((item) => item.company_id);
  const isAllChecked =
    allIds.length > 0 && chartCompanyIds.length === allIds.length;

  setChartCompanyIds(isAllChecked ? [] : allIds);
};

const handleToggleChartMetric = (metricKey) => {
  setChartMetrics((prev) => ({
    ...prev,
    [metricKey]: !prev[metricKey],
  }));
};

    const handleOpenReportChart = () => {
      const selectedMetrics = Object.entries(chartMetrics)
        .filter(([, checked]) => checked)
        .map(([key]) => key);

      if (chartCompanyIds.length === 0) {
        alert("Vui lòng chọn ít nhất 1 công ty");
        return;
      }

      if (selectedMetrics.length === 0) {
        alert("Vui lòng chọn ít nhất 1 chỉ tiêu");
        return;
      }

      const params = new URLSearchParams();

      if (filters.start_date) {
        params.set("start_date", filters.start_date);
      }

      if (filters.end_date) {
        params.set("end_date", filters.end_date);
      }

      if (chartCompanyIds.length === 1) {
        params.set("company_id", chartCompanyIds[0]);
      }

      if (chartCompanyIds.length > 1) {
        params.set("company_ids", chartCompanyIds.join(","));
      }

      params.set("metrics", selectedMetrics.join(","));

      window.open(
        `/dashboard/report/warehouse-import-company-chart?${params.toString()}`,
        "_blank",
        "noopener,noreferrer"
      );

      setIsChartModalOpen(false);
    };

  return (
    <div className="warehouse-company-report-page">
      <div className="warehouse-company-report-toolbar">
        <div className="warehouse-company-report-filters">
          <label className="report-filter-item">
            <span>Từ ngày</span>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  start_date: e.target.value,
                }))
              }
            />
          </label>

          <label className="report-filter-item">
            <span>Đến ngày</span>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  end_date: e.target.value,
                }))
              }
            />
          </label>

          <div className="report-filter-item company-multiselect">
            <span>Chọn công ty</span>

            <div ref={companyDropdownRef} className="company-dropdown-wrapper">
              <button
                type="button"
                className="company-dropdown-button"
                onClick={() => setIsCompanyDropdownOpen((prev) => !prev)}
              >
                <span>{selectedCompanyText}</span>
                <span>{isCompanyDropdownOpen ? "▴" : "▾"}</span>
              </button>

              {isCompanyDropdownOpen && (
                <div className="company-dropdown-menu">
                  {companyLoading && (
                    <div className="company-dropdown-loading">
                      Đang tải công ty...
                    </div>
                  )}

                  {!companyLoading && (
                    <>
                      <label className="company-dropdown-option all-option">
                        <input
                          type="checkbox"
                          checked={
                            companies.length > 0 &&
                            filters.companyIds.length === companies.length
                          }
                          onChange={handleToggleAllCompanies}
                        />
                        <span>Chọn tất cả</span>
                      </label>

                      <div className="company-dropdown-divider" />

                      {companies.length === 0 && (
                        <div className="company-dropdown-empty">
                          Không có công ty
                        </div>
                      )}

                        {companies.map((company) => {
                        const companyId = company.id;
                        const companyName = company.supplier_name;
                        const taxCode = company.tax_code;

                        return (
                            <label
                            key={companyId}
                            className="company-dropdown-option"
                            >
                            <input
                                type="checkbox"
                                checked={filters.companyIds.includes(companyId)}
                                onChange={() => handleToggleCompany(companyId)}
                            />

                            <span>
                                <strong>{companyName}</strong>
                                <small>MST: {taxCode}</small>
                            </span>
                            </label>
                        );
                        })}

                      <div className="company-dropdown-footer">
                        <span>
                          Đã chọn {filters.companyIds.length} /{" "}
                          {companies.length} công ty
                        </span>

                        <button type="button" onClick={handleClearCompanies}>
                          Xóa chọn
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="report-primary-btn"
            onClick={() => fetchReport()}
            disabled={reportLoading}
          >
            {reportLoading ? "Đang tải..." : "Xem báo cáo"}
          </button>

          <button
            type="button"
            className="report-reset-btn"
            onClick={handleReset}
          >
            Đặt lại
          </button>
        </div>
      </div>

      <div className="warehouse-company-report-card">
        <div className="warehouse-company-report-paper">
          <div className="report-title-row">
            <h1>BÁO CÁO NHẬP KHO</h1>

            {!reportLoading && reportRows.length > 0 && (
              <button
                type="button"
                className="report-chart-btn"
                onClick={handleOpenChartModal}
              >
                Biểu đồ báo cáo
              </button>
            )}
          </div>

          <div className="report-date-range">
            Từ ngày: <strong>{formatDate(filters.start_date)}</strong>
            <span>-</span>
            Đến ngày: <strong>{formatDate(filters.end_date)}</strong>
          </div>

          <table className="warehouse-company-report-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Số phiếu nhập</th>
                <th>Ngày nhập</th>
                <th>Tổng tiền hàng</th>
                <th>Thuế VAT</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>

            <tbody>
              {reportLoading && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Đang tải dữ liệu báo cáo...
                  </td>
                </tr>
              )}

              {!reportLoading && groupedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    Không có dữ liệu báo cáo
                  </td>
                </tr>
              )}

              {!reportLoading &&
                groupedRows.map((group, groupIndex) => (
                    <Fragment key={group.companyId}>
                    <tr className="company-title-row">
                        <td colSpan={6}>
                        <strong>{group.companyName}</strong>
                        </td>
                    </tr>

                    {group.items.map((item, itemIndex) => (
                        <tr
                            key={`${group.companyId}-${item.receiptCode}-${itemIndex}`}
                            className={
                                selectedReceipt && getReceiptCode(selectedReceipt) === item.receiptCode
                                ? "report-row-selected"
                                : ""
                            }
                            onClick={() => fetchReceiptDetail(item.receiptCode)}
                            >
                            <td>{itemIndex + 1}</td>
                            <td
                                className="link-text"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenImportDetailPrint(item.receiptCode);
                                }}
                              >
                                {item.receiptCode}
                            </td>
                            <td>{formatDate(item.receiptDate)}</td>
                            <td className="text-right">{formatMoney(item.goodsAmount)}</td>
                            <td className="text-right">{formatMoney(item.vatAmount)}</td>
                            <td className="text-right">{formatMoney(item.totalAmount)}</td>
                        </tr>
                    ))}

                    <tr className="company-total-row">
                        <td></td>
                        <td colSpan={2}>Tổng cộng </td>
                        <td className="text-right">{formatMoney(group.goodsAmount)}</td>
                        <td className="text-right">{formatMoney(group.vatAmount)}</td>
                        <td className="text-right">{formatMoney(group.totalAmount)}</td>
                    </tr>
                    </Fragment>
                ))}

              {!reportLoading && groupedRows.length > 0 && (
                <tr className="grand-total-row">
                  <td></td>
                  <td colSpan={2}>TỔNG CỘNG</td>
                  <td className="text-right">
                    {formatMoney(grandTotal.goodsAmount)}
                  </td>
                  <td className="text-right">
                    {formatMoney(grandTotal.vatAmount)}
                  </td>
                  <td className="text-right">
                    {formatMoney(grandTotal.totalAmount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="report-detail-panel">
                <h3>
                    Chi tiết hàng hóa
                    {selectedReceipt && (
                    <span> - Phiếu nhập: {getReceiptCode(selectedReceipt)}</span>
                    )}
                </h3>

                <table className="report-detail-table">
                    <thead>
                    <tr>
                        <th>STT</th>
                        <th>Mã hàng</th>
                        <th>Tên hàng hóa</th>
                        <th>ĐVT</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                    </thead>

                    <tbody>
                    {detailLoading && (
                        <tr>
                        <td colSpan={7} className="empty-row">
                            Đang tải chi tiết hàng hóa...
                        </td>
                        </tr>
                    )}

                    {!detailLoading && !selectedReceipt && (
                        <tr>
                        <td colSpan={7} className="empty-row">
                            Bấm vào số phiếu nhập để xem chi tiết hàng hóa
                        </td>
                        </tr>
                    )}

                    {!detailLoading && selectedReceipt && detailRows.length === 0 && (
                        <tr>
                        <td colSpan={7} className="empty-row">
                            Phiếu nhập này chưa có chi tiết hàng hóa
                        </td>
                        </tr>
                    )}

                    {!detailLoading &&
                        detailRows.map((item, index) => {
                        const quantity = parseMoney(
                            item.original_quantity ||
                            item.real_quantity ||
                            item.actual_quantity ||
                            item.quantity ||
                            0
                        );

                        const unitPrice = parseMoney(item.unit_price || item.unitPrice || 0);
                        const amount = quantity * unitPrice;

                        return (
                            <tr key={item.inventory_id || item.goods_id || index}>
                            <td>{index + 1}</td>
                            <td>{item.goods_code || "-"}</td>
                            <td>{item.goods_name || "-"}</td>
                            <td>{item.unit_name || "-"}</td>
                            <td className="text-right">{formatNumber(quantity)}</td>
                            <td className="text-right">{formatMoney(unitPrice)}</td>
                            <td className="text-right">{formatMoney(amount)}</td>
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
                </div>

          <div className="report-note">
            Ghi chú: Báo cáo gồm các phiếu nhập kho đã hoàn thành.
          </div>
        </div>
      </div>
            {isChartModalOpen && (
        <div className="report-chart-modal-overlay">
          <div className="report-chart-modal">
            <div className="report-chart-modal-header">
              <h3>Chọn dữ liệu biểu đồ báo cáo</h3>

              <button
                type="button"
                onClick={() => setIsChartModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="report-chart-modal-body horizontal">
              <div className="report-chart-section company-section">
                <div className="report-chart-section-title">
                  <span>Công ty đang xem báo cáo</span>
                </div>

                <div className="report-chart-company-list">
                  {reportRows.map((company) => (
                    <label
                      key={company.company_id}
                      className="report-chart-check-row"
                    >
                      <input
                        type="checkbox"
                        checked={chartCompanyIds.includes(company.company_id)}
                        onChange={() => handleToggleChartCompany(company.company_id)}
                      />
                      <span>{company.company_name || "-"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="report-chart-section metric-section">
                <div className="report-chart-section-title">
                  <span>Chỉ tiêu hiển thị</span>
                </div>

                <div className="report-chart-metric-list">
                  <label className="report-chart-check-row">
                    <input
                      type="checkbox"
                      checked={chartMetrics.goodsAmount}
                      onChange={() => handleToggleChartMetric("goodsAmount")}
                    />
                    <span>Tổng tiền hàng</span>
                  </label>

                  <label className="report-chart-check-row">
                    <input
                      type="checkbox"
                      checked={chartMetrics.vatAmount}
                      onChange={() => handleToggleChartMetric("vatAmount")}
                    />
                    <span>Thuế VAT</span>
                  </label>

                  <label className="report-chart-check-row">
                    <input
                      type="checkbox"
                      checked={chartMetrics.totalAmount}
                      onChange={() => handleToggleChartMetric("totalAmount")}
                    />
                    <span>Tổng tiền</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="report-chart-modal-footer">
              <button
                type="button"
                className="report-cancel-btn"
                onClick={() => setIsChartModalOpen(false)}
              >
                Hủy
              </button>

              <button
                type="button"
                className="report-open-chart-btn"
                onClick={handleOpenReportChart}
              >
                Mở biểu đồ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WarehouseImportCompanyReportPage;