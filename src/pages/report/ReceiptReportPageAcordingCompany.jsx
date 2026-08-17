import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "../../styles/ReceiptReportViewPage.css";

import { getWarehouseReceiptCompanySummary } from "../../services/warehouseReceiptReportService";
import { getWarehouseReceiptByCode } from "../../services/warehouseReceiptService";
import ReportExcelExportButton from "../../components/ReportExcelExportButton";
import { REPORT_RECEIPT_SUMMARY } from "../../services/reportExportService";
import { useAuth } from "../../contexts/AuthContext";

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

const formatDate = (value) => {
  if (!value) return "-";

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return text;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  }

  return text;
};

function ReceiptReportPageAcordingCompany() {
  const { canDo } = useAuth();

  const [reportConfig, setReportConfig] = useState(null);

  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* =========================================================
     ĐỌC THÔNG SỐ DO WarehouseReceiptReportPage LƯU
  ========================================================= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportKey = params.get("reportKey");

    if (!reportKey) {
      alert("Thiếu reportKey của báo cáo");
      return;
    }

    try {
      const raw = localStorage.getItem(reportKey);

      if (!raw) {
        alert(
          "Không tìm thấy thông số báo cáo. Vui lòng quay lại trang lọc và mở lại báo cáo."
        );
        return;
      }

      const parsed = JSON.parse(raw);

      if (parsed?.mode !== "company") {
        alert("Bộ lọc này không phải báo cáo theo công ty");
        return;
      }

      setReportConfig(parsed);
    } catch (error) {
      console.error("READ RECEIPT REPORT CONFIG ERROR:", error);
      alert("Không đọc được thông số báo cáo");
    }
  }, []);

  /* =========================================================
     PAYLOAD DÙNG CHUNG CHO BẢNG + EXCEL
  ========================================================= */
  const buildReportPayload = useCallback(() => {
    if (!reportConfig) {
      return {};
    }

    const payload = {};

    if (reportConfig.start_date) {
      payload.start_date = reportConfig.start_date;
    }

    if (reportConfig.end_date) {
      payload.end_date = reportConfig.end_date;
    }

    if (
      Array.isArray(reportConfig.company_ids) &&
      reportConfig.company_ids.length > 0
    ) {
      payload.list_company = reportConfig.company_ids;
    }

    return payload;
  }, [reportConfig]);

  /* =========================================================
     LOAD REPORT
  ========================================================= */
  useEffect(() => {
    if (!reportConfig || !canDo("view_report")) {
      return;
    }

    let cancelled = false;

    const fetchReport = async () => {
      try {
        setReportLoading(true);

        const response = await getWarehouseReceiptCompanySummary(
          buildReportPayload()
        );

        const body = response?.data ?? response;
        const data = body?.data ?? body;

        const results = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        if (cancelled) return;

        setReportRows(results);
        setSelectedReceipt(null);
        setDetailRows([]);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "LOAD RECEIPT COMPANY REPORT ERROR:",
          error?.response?.data || error
        );

        setReportRows([]);
        alert("Không tải được báo cáo nhập kho theo công ty");
      } finally {
        if (!cancelled) {
          setReportLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [buildReportPayload, canDo, reportConfig]);

  /* =========================================================
     CHUẨN HÓA DỮ LIỆU
  ========================================================= */
  const groupedRows = useMemo(() => {
    return reportRows.map((company) => ({
      companyId: company.company_id,
      companyName: company.company_name || "-",
      companyTaxCode: company.tax_code || "",

      items: Array.isArray(company.receipts)
        ? company.receipts.map((receipt) => ({
            receiptId: receipt.pnk_id,
            receiptCode: receipt.pnk_code,
            receiptDate: receipt.receipt_date,
            goodsAmount: parseNumber(receipt.goods_amount),
            vatAmount: parseNumber(receipt.vat_amount),
            totalAmount: parseNumber(receipt.total_amount),
          }))
        : [],

      goodsAmount: parseNumber(company.company_goods_amount),
      vatAmount: parseNumber(company.company_vat_amount),
      totalAmount: parseNumber(company.company_total_amount),
    }));
  }, [reportRows]);

  const grandTotal = useMemo(() => {
    return groupedRows.reduce(
      (sum, group) => {
        sum.goodsAmount += group.goodsAmount;
        sum.vatAmount += group.vatAmount;
        sum.totalAmount += group.totalAmount;
        sum.receiptCount += group.items.length;
        return sum;
      },
      {
        goodsAmount: 0,
        vatAmount: 0,
        totalAmount: 0,
        receiptCount: 0,
      }
    );
  }, [groupedRows]);

  const selectedCompanyText = useMemo(() => {
    if (!reportConfig) return "-";

    if (
      !Array.isArray(reportConfig.companies) ||
      reportConfig.companies.length === 0
    ) {
      return "Tất cả công ty";
    }

    const names = reportConfig.companies
      .map(
        (company) =>
          company?.supplier_name ||
          company?.company_name ||
          company?.name
      )
      .filter(Boolean);

    return names.length > 0
      ? names.join(", ")
      : `${reportConfig.company_ids?.length || 0} công ty`;
  }, [reportConfig]);

  const getReceiptCode = (receipt) =>
    receipt?.pnk_code ||
    receipt?.receipt_code ||
    receipt?.code ||
    receipt?.receiptCode ||
    "-";

  /* =========================================================
     CLICK ICON MẮT => LOAD CHI TIẾT PHIẾU
  ========================================================= */
  const fetchReceiptDetail = async (receiptCode) => {
    if (!receiptCode || receiptCode === "-") return;

    try {
      setDetailLoading(true);

      const response = await getWarehouseReceiptByCode(receiptCode);
      const body = response?.data ?? response;
      const data = body?.data ?? body;

      const rows =
        data?.inventory_lines ||
        data?.inventory ||
        data?.items ||
        data?.details ||
        [];

      setSelectedReceipt(data);
      setDetailRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error(
        "LOAD RECEIPT DETAIL ERROR:",
        error?.response?.data || error
      );

      alert("Không tải được chi tiết phiếu nhập");
      setSelectedReceipt(null);
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open import order detail page in a new tab with mode=print
  const openReceiptInNewTab = (receiptCode) => {
    if (!receiptCode) return;

    const path = `/dashboard/activity/import/order-detail/${encodeURIComponent(
      receiptCode
    )}?mode=print`;

    const url = window.location.origin + path;

    try {
      // Use noopener for security
      window.open(url, "_blank", "noopener");
    } catch (e) {
      // Fallback: navigate in same tab
      window.location.href = path;
    }
  };

  if (!canDo("view_report")) {
    return (
      <div className="receipt-report-view-no-permission">
        Tài khoản không có quyền truy cập báo cáo kho
      </div>
    );
  }

  if (!reportConfig) {
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
        {/* HEADER TRẮNG - KHÔNG SIDEBAR / KHÔNG DASHBOARD */}
        <div className="receipt-report-view-header">
          <div className="receipt-report-view-title">
            <h1>BÁO CÁO NHẬP KHO THEO CÔNG TY</h1>

            <div className="receipt-report-view-date">
              <span>
                Từ ngày:{" "}
                <strong>{formatDate(reportConfig.start_date)}</strong>
              </span>

              <span>
                Đến ngày:{" "}
                <strong>{formatDate(reportConfig.end_date)}</strong>
              </span>
            </div>
          </div>

          {/* CHỈ CÓ XUẤT EXCEL - KHÔNG CÓ NÚT IN */}
          <div className="receipt-report-export">
            <ReportExcelExportButton
              report={REPORT_RECEIPT_SUMMARY}
              getFilters={buildReportPayload}
              disabled={reportLoading}
              fileName="bao-cao-nhap-kho-theo-cong-ty.xlsx"
            />
          </div>
        </div>

        {/* BẢNG TỔNG HỢP */}
        <div className="receipt-report-view-table-wrap">
          <table className="receipt-report-company-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Công ty / Số phiếu nhập</th>
                <th>Ngày nhập</th>
                <th>Tổng tiền hàng</th>
                <th>Tiền thuế</th>
                <th>Tổng cộng</th>
                <th>Số phiếu</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {reportLoading && (
                <tr>
                  <td colSpan={8} className="receipt-report-view-empty">
                    Đang tải dữ liệu báo cáo...
                  </td>
                </tr>
              )}

              {!reportLoading && groupedRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="receipt-report-view-empty">
                    Không có dữ liệu báo cáo
                  </td>
                </tr>
              )}

              {!reportLoading &&
                groupedRows.map((group, groupIndex) => (
                  <Fragment key={group.companyId || groupIndex}>
                    <tr className="receipt-report-company-group">
                      <td>{groupIndex + 1}</td>

                      <td>{group.companyName}</td>

                      <td></td>

                      <td className="text-right">
                        {formatMoney(group.goodsAmount)}
                      </td>

                      <td className="text-right">
                        {formatMoney(group.vatAmount)}
                      </td>

                      <td className="text-right">
                        {formatMoney(group.totalAmount)}
                      </td>

                      <td className="text-center">
                        {group.items.length}
                      </td>

                      <td></td>
                    </tr>

                    {group.items.length === 0 && (
                      <tr className="receipt-report-company-empty-row">
                        <td></td>
                        <td colSpan={7}>
                          Không có phiếu nhập kho nào
                        </td>
                      </tr>
                    )}

                    {group.items.map((item, itemIndex) => {
                      const isActive =
                        selectedReceipt &&
                        getReceiptCode(selectedReceipt) ===
                          item.receiptCode;

                      return (
                        <tr
                          key={`${group.companyId}-${item.receiptCode}-${itemIndex}`}
                          className={
                            isActive ? "receipt-report-row-active" : ""
                          }
                            onClick={() => fetchReceiptDetail(item.receiptCode)}
                            role={"button"}
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                fetchReceiptDetail(item.receiptCode);
                              }
                            }}
                          >
                            <td>
                              {groupIndex + 1}.{itemIndex + 1}
                            </td>

                            <td>
                              {item.receiptCode ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReceiptInNewTab(item.receiptCode);
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
                                  {item.receiptCode}
                                </button>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="text-center">
                              {formatDate(item.receiptDate)}
                            </td>

                            <td className="text-right">
                              {formatMoney(item.goodsAmount)}
                            </td>

                            <td className="text-right">
                              {formatMoney(item.vatAmount)}
                            </td>

                            <td className="text-right">
                              {formatMoney(item.totalAmount)}
                            </td>

                            <td></td>

                            <td></td>
                          </tr>
                      );
                    })}
                  </Fragment>
                ))}

              {!reportLoading && groupedRows.length > 0 && (
                <tr className="receipt-report-grand-total">
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

                  <td className="text-center">
                    {grandTotal.receiptCount}
                  </td>

                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CHI TIẾT PHIẾU */}
        <div className="receipt-report-detail-section">
          <div className="receipt-report-detail-title">
            CHI TIẾT PHIẾU NHẬP:
            <strong>
                {selectedReceipt ? (
                  <>
                    {" "}
                    {getReceiptCode(selectedReceipt) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReceiptInNewTab(getReceiptCode(selectedReceipt));
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
                        {getReceiptCode(selectedReceipt)}
                      </button>
                    ) : (
                      " -"
                    )}
                  </>
                ) : (
                  " -"
                )}
              </strong>
          </div>

          {selectedReceipt && (
            <div className="receipt-report-detail-meta">
              <span>
                <strong>Công ty:</strong>{" "}
                {selectedReceipt.company_name ||
                  selectedReceipt.supplier_name ||
                  "-"}
              </span>

              <span>
                <strong>Ngày nhập:</strong>{" "}
                {formatDate(
                  selectedReceipt.receipt_date ||
                    selectedReceipt.warehouse_receipt_date
                )}
              </span>

              <span>
                <strong>Số hợp đồng:</strong>{" "}
                {selectedReceipt.contract_code || "-"}
              </span>
            </div>
          )}

          <div className="receipt-report-view-table-wrap">
            <table className="receipt-report-detail-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã vật tư</th>
                  <th>Tên vật tư</th>
                  <th>ĐVT</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>

              <tbody>
                {detailLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="receipt-report-view-empty"
                    >
                      Đang tải chi tiết phiếu...
                    </td>
                  </tr>
                )}

                {!detailLoading && !selectedReceipt && (
                  <tr>
                    <td
                      colSpan={7}
                      className="receipt-report-view-empty"
                    >
                      Bấm vào dòng phiếu nhập để xem chi tiết; bấm vào số phiếu để mở chi tiết lệnh nhập kho (mở tab mới).
                    </td>
                  </tr>
                )}

                {!detailLoading &&
                  selectedReceipt &&
                  detailRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="receipt-report-view-empty"
                      >
                        Phiếu nhập chưa có chi tiết hàng hóa
                      </td>
                    </tr>
                  )}

                {!detailLoading &&
                  detailRows.map((item, index) => {
                    const quantity = parseNumber(
                      item.original_quantity ||
                        item.real_quantity ||
                        item.actual_quantity ||
                        item.quantity ||
                        0
                    );

                    const unitPrice = parseNumber(
                      item.unit_price || item.unitPrice || 0
                    );

                    const amount = quantity * unitPrice;

                    return (
                      <tr
                        key={
                          item.inventory_id ||
                          item.goods_id ||
                          `${index}-${item.goods_code}`
                        }
                      >
                        <td>{index + 1}</td>

                        <td>{item.goods_code || "-"}</td>

                        <td>{item.goods_name || "-"}</td>

                        <td className="text-center">
                          {item.unit_name || "-"}
                        </td>

                        <td className="text-right">
                          {formatQuantity(quantity)}
                        </td>

                        <td className="text-right">
                          {formatMoney(unitPrice)}
                        </td>

                        <td className="text-right">
                          {formatMoney(amount)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptReportPageAcordingCompany;