import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/ReleaseReportPage.css";

import { getReleaseReportPageable } from "../../services/releaseReportService";
import ReportExcelExportButton from "../../components/ReportExcelExportButton";
import { REPORT_RELEASE } from "../../services/reportExportService";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

function getByPath(source, path) {
  return String(path)
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), source);
}

function firstValue(source, paths, fallback = "") {
  for (const path of paths) {
    const value = getByPath(source, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function normalizeNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === "") {
    return 0;
  }

  let normalized = String(value).trim();

  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d+,\d+$/.test(normalized)) {
    normalized = normalized.replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatQuantity(value) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  }).format(normalizeNumber(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(normalizeNumber(value));
}

function formatDate(value) {
  if (!value) return "—";

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(text);

  return Number.isNaN(parsedDate.getTime())
    ? text
    : new Intl.DateTimeFormat("vi-VN").format(parsedDate);
}

function normalizeResponse(responseData) {
  const payload = responseData?.data ?? responseData ?? {};

  const rows =
    payload?.items ??
    payload?.rows ??
    payload?.content ??
    payload?.results ??
    payload?.data ??
    (Array.isArray(payload) ? payload : []);

  const safeRows = Array.isArray(rows) ? rows : [];

  const total = Number(
    payload?.total_items ??
      payload?.total ??
      payload?.total_elements ??
      payload?.totalElements ??
      payload?.count ??
      safeRows.length
  );

  return {
    rows: safeRows,
    total: Number.isFinite(total) ? total : safeRows.length,
  };
}

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];

  if (currentPage > 4) pages.push("left-ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 3) pages.push("right-ellipsis");

  pages.push(totalPages);

  return pages;
}

function ReleaseReportViewPage() {
  const { canDo } = useAuth();
  const requestIdRef = useRef(0);

  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportKey = params.get("reportKey");

    if (!reportKey) {
      setErrorMessage("Thiếu thông tin mở báo cáo.");
      return;
    }

    try {
      const raw = localStorage.getItem(reportKey);

      if (!raw) {
        setErrorMessage(
          "Không tìm thấy thông số báo cáo. Vui lòng mở lại từ trang bộ lọc."
        );
        return;
      }

      setConfig(JSON.parse(raw));
    } catch (error) {
      console.error("READ RELEASE REPORT CONFIG ERROR:", error);
      setErrorMessage("Không đọc được thông số báo cáo.");
    }
  }, []);

  const buildPayload = useCallback(
    (currentPage = page, currentPageSize = pageSize) => {
      if (!config) return {};

      const payload = {
        page: currentPage,
        page_size: currentPageSize,
      };

      if (config.warehouse_id) {
        payload.warehouse_id = config.warehouse_id;
      }

      if (config.receiver_unit_id) {
        payload.receiver_unit_id = config.receiver_unit_id;
      }

      if (config.release_target_id) {
        payload.release_target_id = config.release_target_id;
      }

      if (config.start_date) {
        payload.start_date = config.start_date;
      }

      if (config.end_date) {
        payload.end_date = config.end_date;
      }

      if (
        Array.isArray(config.goods_group_ids) &&
        config.goods_group_ids.length > 0
      ) {
        payload.goods_group_ids = config.goods_group_ids;
      }

      if (Array.isArray(config.goods_ids) && config.goods_ids.length > 0) {
        payload.goods_ids = config.goods_ids;
      }

      return payload;
    },
    [config, page, pageSize]
  );

  const buildExportFilters = useCallback(() => {
    const payload = buildPayload(1, DEFAULT_PAGE_SIZE);

    delete payload.page;
    delete payload.page_size;

    return payload;
  }, [buildPayload]);

  const fetchReport = useCallback(
    async (currentPage = page, currentPageSize = pageSize) => {
      if (!config) return;

      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setErrorMessage("");

        const response = await getReleaseReportPageable(
          buildPayload(currentPage, currentPageSize)
        );

        const normalized = normalizeResponse(response);

        if (requestId !== requestIdRef.current) return;

        setRows(normalized.rows);
        setTotalRows(normalized.total);
        setPage(currentPage);
        setPageSize(currentPageSize);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        setRows([]);
        setTotalRows(0);
        setErrorMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Không tải được dữ liệu báo cáo xuất kho."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [buildPayload, config, page, pageSize]
  );

  useEffect(() => {
    if (!config || !canDo("view_report")) return;

    fetchReport(1, DEFAULT_PAGE_SIZE);
  }, [config, canDo]);

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const pageItems = useMemo(
    () => buildPageItems(page, totalPages),
    [page, totalPages]
  );

  const goodsGroupCount = Array.isArray(config?.goods_group_ids)
    ? config.goods_group_ids.length
    : 0;

  const goodsCount = Array.isArray(config?.goods_ids)
    ? config.goods_ids.length
    : 0;

  const goodsFilterText = useMemo(() => {
    if (goodsGroupCount === 0 && goodsCount === 0) {
      return "Tất cả";
    }

    const parts = [];

    if (goodsGroupCount > 0) {
      parts.push(`${goodsGroupCount} nhóm`);
    }

    if (goodsCount > 0) {
      parts.push(`${goodsCount} mã riêng`);
    }

    return parts.join(" + ");
  }, [goodsGroupCount, goodsCount]);

  const getRowView = (row) => {
    const quantity = firstValue(row, [
      "actual_quantity",
      "released_quantity",
      "release_quantity",
      "quantity",
      "completed_quantity",
    ]);

    const averagePrice = firstValue(row, [
      "average_price",
      "average_unit_price",
      "avg_price",
      "unit_price",
    ]);

    const rawAmount = firstValue(row, [
      "amount",
      "total_amount",
      "total_value",
      "value",
    ]);

    const amount =
      rawAmount === ""
        ? normalizeNumber(quantity) * normalizeNumber(averagePrice)
        : rawAmount;

    return {
      releaseCode: firstValue(row, [
        "warehouse_release_code",
        "release_code",
        "release_order_code",
        "order_code",
        "code",
        "release.code",
      ]),
      releaseDate: firstValue(row, [
        "release_date",
        "date",
        "release.release_date",
      ]),
      warehouseName: firstValue(row, [
        "warehouse_name",
        "warehouse.name",
      ]),
      goodsCode: firstValue(row, [
        "goods_code",
        "material_code",
        "item_code",
        "goods.code",
      ]),
      goodsName: firstValue(row, [
        "goods_name",
        "material_name",
        "item_name",
        "goods.name",
      ]),
      unitName: firstValue(row, [
        "default_goods_unit",
        "goods_unit_name",
        "unit_name",
        "uom_name",
        "goods.unit_name",
      ]),
      receiverUnitName: firstValue(row, [
        "receiver_unit.name",
        "receiver_unit_name",
        "receiver_unit",
      ]),
      releaseTargetName: firstValue(row, [
        "release_target.name",
        "release_target_name",
        "release_target",
      ]),
      quantity,
      averagePrice,
      amount,
    };
  };

  if (!canDo("view_report")) {
    return (
      <div className="no-permission-page">
        Tài khoản không có quyền truy cập báo cáo kho
      </div>
    );
  }

  return (
    <section className="release-report-page release-report-view-page">
      <header className="release-report-view-header">
        <div>
          <h1>BÁO CÁO XUẤT KHO</h1>
        </div>

        <ReportExcelExportButton
          report={REPORT_RELEASE}
          getFilters={buildExportFilters}
          disabled={!config || loading}
          fileName="bao-cao-xuat-kho.xlsx"
        />
      </header>

      {config && (
        <div className="release-report-view-toolbar">
          <div>
            <span>Kho xuất</span>
            <strong>{config.warehouse_id ? "Đã chọn" : "Tất cả"}</strong>
          </div>

          <div>
            <span>Đơn vị lĩnh</span>
            <strong>{config.receiver_unit_id ? "Đã chọn" : "Tất cả"}</strong>
          </div>

          <div>
            <span>Đối tượng xuất</span>
            <strong>{config.release_target_id ? "Đã chọn" : "Tất cả"}</strong>
          </div>

          <div>
            <span>Từ ngày</span>
            <strong>{formatDate(config.start_date)}</strong>
          </div>

          <div>
            <span>Đến ngày</span>
            <strong>{formatDate(config.end_date)}</strong>
          </div>

          <div>
            <span>Mã vật tư</span>
            <strong>{goodsCount > 0 ? `${goodsCount} mã` : "Tất cả"}</strong>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="release-report-alert" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="release-report-table-card">
        <div className="release-report-table-toolbar">
          <div className="release-report-result-summary">
            Hiển thị{" "}
            {totalRows === 0 ? 0 : (page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalRows)} trên {totalRows} kết quả
          </div>

          <label className="release-report-page-size">
            <span>Số dòng</span>

            <select
              value={pageSize}
              disabled={loading}
              onChange={(event) =>
                fetchReport(1, Number(event.target.value))
              }
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="release-report-table-wrapper">
          <table className="release-report-table">
            <thead>
              <tr>
                <th className="release-report-center">STT</th>
                <th>Mã lệnh XK</th>
                <th>Ngày xuất</th>
                <th>Kho xuất</th>
                <th>Mã vật tư</th>
                <th>Tên vật tư</th>
                <th>ĐVT</th>
                <th>Đơn vị lĩnh</th>
                <th>Đối tượng xuất kho</th>
                <th className="release-report-number">SL thực xuất</th>
                <th className="release-report-number">Đơn giá bình quân</th>
                <th className="release-report-number">Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="release-report-state-cell">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="release-report-state-cell">
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const view = getRowView(row);
                  const rowNumber = (page - 1) * pageSize + index + 1;
                  const rowKey = `${view.releaseCode}-${view.goodsCode}-${index}`;

                  return (
                    <tr key={rowKey}>
                      <td className="release-report-center">{rowNumber}</td>

                      <td className="release-report-code">
                        {view.releaseCode || "—"}
                      </td>

                      <td>{formatDate(view.releaseDate)}</td>
                      <td>{view.warehouseName || "—"}</td>
                      <td>{view.goodsCode || "—"}</td>

                      <td className="release-report-goods-name">
                        {view.goodsName || "—"}
                      </td>

                      <td>{view.unitName || "—"}</td>
                      <td>{view.receiverUnitName || "—"}</td>
                      <td>{view.releaseTargetName || "—"}</td>

                      <td className="release-report-number">
                        {formatQuantity(view.quantity)}
                      </td>

                      <td className="release-report-number">
                        {formatMoney(view.averagePrice)}
                      </td>

                      <td className="release-report-number release-report-total">
                        {formatMoney(view.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalRows > 0 && (
          <footer className="release-report-pagination">
            <span>
              Trang {page}/{totalPages}
            </span>

            <div className="release-report-pagination-buttons">
              <button
                type="button"
                onClick={() => fetchReport(1, pageSize)}
                disabled={page === 1 || loading}
              >
                «
              </button>

              <button
                type="button"
                onClick={() =>
                  fetchReport(Math.max(1, page - 1), pageSize)
                }
                disabled={page === 1 || loading}
              >
                ‹
              </button>

              {pageItems.map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="release-report-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={item === page ? "is-active" : ""}
                    onClick={() => fetchReport(item, pageSize)}
                    disabled={loading}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  fetchReport(Math.min(totalPages, page + 1), pageSize)
                }
                disabled={page === totalPages || loading}
              >
                ›
              </button>

              <button
                type="button"
                onClick={() => fetchReport(totalPages, pageSize)}
                disabled={page === totalPages || loading}
              >
                »
              </button>
            </div>
          </footer>
        )}
      </div>
    </section>
  );
}

export default ReleaseReportViewPage;