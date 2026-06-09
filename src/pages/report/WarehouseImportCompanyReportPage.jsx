import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/WarehouseImportCompanyReportPage.css";

import {
  getWarehouseReceiptsPageable,
  getWarehouseReceiptByCode,
} from "../../services/warehouseReceiptService";
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

        const response = await getWarehouseReceiptsPageable(params);
        const data = unwrapData(response);

        const results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

        setReportRows(results);
        setSelectedReceipt(null);
        setDetailRows([]);
    } catch (error) {
        console.error("LOAD IMPORT COMPANY REPORT ERROR:", error.response?.data || error);
        alert("Không tải được báo cáo nhập kho theo công ty");
        setReportRows([]);
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

    const getCompanyId = (row) => {
        return row.company_id;
    };

    const getCompanyName = (row) => {
    const company = companies.find(
        (item) => String(item.id) === String(filters.companyIds[0])
    );

    return company?.supplier_name || "Đã chọn 1 công ty";
    };

    const getCompanyTaxCode = (row) => {
    const company = companies.find(
        (item) => String(item.id) === String(row.company_id)
    );

    return company?.tax_code || "";
    };

  const getReceiptCode = (row) => {
    return row.code || row.receipt_code || row.receiptCode || "-";
  };

  const getReceiptDate = (row) => {
    return row.receipt_date || row.receiptDate || row.import_date || "-";
  };

  const getInventoryLines = (row) => {
    const lines =
      row.inventory_lines ||
      row.inventoryLines ||
      row.inventory ||
      row.items ||
      row.details ||
      [];

    return Array.isArray(lines) ? lines : [];
  };

  const getGoodsAmount = (row) => {
    if (row.goods_amount !== undefined) return parseMoney(row.goods_amount);
    if (row.goodsAmount !== undefined) return parseMoney(row.goodsAmount);
    if (row.total_goods_amount !== undefined) return parseMoney(row.total_goods_amount);
    if (row.sub_total !== undefined) return parseMoney(row.sub_total);
    if (row.amount !== undefined) return parseMoney(row.amount);

    const lines = getInventoryLines(row);

    return lines.reduce((sum, item) => {
      const quantity = parseMoney(
        item.original_quantity ||
          item.real_quantity ||
          item.actual_quantity ||
          item.quantity ||
          0
      );

      const unitPrice = parseMoney(item.unit_price || item.unitPrice || 0);

      return sum + quantity * unitPrice;
    }, 0);
  };

  const getVatAmount = (row) => {
    if (row.vat_amount !== undefined) return parseMoney(row.vat_amount);
    if (row.vatAmount !== undefined) return parseMoney(row.vatAmount);

    const goodsAmount = getGoodsAmount(row);
    const vatRate = parseMoney(row.vat || row.vat_rate || row.vatRate || 0);

    return goodsAmount * (vatRate / 100);
  };

  const getTotalAmount = (row) => {
    if (row.total_amount !== undefined) return parseMoney(row.total_amount);
    if (row.totalAmount !== undefined) return parseMoney(row.totalAmount);
    if (row.grand_total !== undefined) return parseMoney(row.grand_total);

    return getGoodsAmount(row) + getVatAmount(row);
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
        (item) => item.id === filters.companyIds[0]
        );

        return company.supplier_name;
    }

    return `Đã chọn ${filters.companyIds.length} công ty`;
    }, [companies, filters.companyIds]);

    const filteredReportRows = useMemo(() => {
        return reportRows;
    }, [reportRows]);

  const groupedRows = useMemo(() => {
    const map = new Map();

    filteredReportRows.forEach((row) => {
      const companyId = getCompanyId(row);

      if (!map.has(companyId)) {
        map.set(companyId, {
          companyId,
          companyName: getCompanyName(row),
          companyTaxCode: getCompanyTaxCode(row),
          items: [],
          totalQuantity: 0,
          goodsAmount: 0,
          vatAmount: 0,
          totalAmount: 0,
        });
      }

      const group = map.get(companyId);

    const item = {
        raw: row,
        receiptCode: getReceiptCode(row),
        receiptDate: getReceiptDate(row),
        goodsAmount: getGoodsAmount(row),
        vatAmount: getVatAmount(row),
        totalAmount: getTotalAmount(row),
    };

      group.items.push(item);
      group.goodsAmount += item.goodsAmount;
      group.vatAmount += item.vatAmount;
      group.totalAmount += item.totalAmount;
    });

    return Array.from(map.values());
  }, [filteredReportRows, companies]);

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

  const handlePrint = () => {
    window.print();
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
        <div className="report-card-actions">
          <button
            type="button"
            className="report-print-btn"
            onClick={handlePrint}
          >
            In báo cáo
          </button>
        </div>

        <div className="warehouse-company-report-paper">
          <h1>BÁO CÁO NHẬP KHO THEO CÔNG TY</h1>

          <div className="report-date-range">
            Từ ngày: <strong>{formatDate(filters.start_date)}</strong>
            <span>-</span>
            Đến ngày: <strong>{formatDate(filters.end_date)}</strong>
          </div>

          <div className="report-selected-company">
            Công ty: <strong>{selectedCompanyText}</strong>
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
                        {group.companyTaxCode && <span>MST: {group.companyTaxCode}</span>}
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
                            <td className="link-text">{item.receiptCode}</td>
                            <td>{formatDate(item.receiptDate)}</td>
                            <td className="text-right">{formatMoney(item.goodsAmount)}</td>
                            <td className="text-right">{formatMoney(item.vatAmount)}</td>
                            <td className="text-right">{formatMoney(item.totalAmount)}</td>
                        </tr>
                    ))}

                    <tr className="company-total-row">
                        <td></td>
                        <td colSpan={2}>Tổng cộng {group.companyName}</td>
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
    </div>
  );
}

export default WarehouseImportCompanyReportPage;