import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getReleaseReportPageable } from "../../services/releaseReportService";
import { getWarehouses } from "../../services/warehouseService";
import { getReleaseReferencesPageable } from "../../services/releaseOrderService";
import "../../styles/ReleaseReportPage.css";

const INITIAL_FILTERS = {
  warehouse_id: "",
  receiver_unit_id: "",
  release_target_id: "",
  start_date: "",
  end_date: "",
  search: "",
};

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
  if (!value) {
    return "—";
  }

  const text = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return text;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(text);

  if (Number.isNaN(parsedDate.getTime())) {
    return text;
  }

  return new Intl.DateTimeFormat("vi-VN").format(parsedDate);
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

function extractList(responseData) {
  const payload = responseData?.data ?? responseData ?? [];

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.results,
    payload?.items,
    payload?.rows,
    payload?.content,
    payload?.data,
    payload?.data?.results,
    payload?.data?.items,
    payload?.data?.rows,
    payload?.data?.content,
    payload?.data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeOption(option) {
  if (option === null || option === undefined) {
    return { value: "", label: "" };
  }

  if (typeof option === "string" || typeof option === "number") {
    return {
      value: String(option),
      label: String(option),
    };
  }

  const value =
    option.id ??
    option.value ??
    option.warehouse_id ??
    option.receiver_unit_id ??
    option.release_target_id ??
    "";

  const label =
    option.name ??
    option.label ??
    option.code_name ??
    option.warehouse_name ??
    option.receiver_unit_name ??
    option.release_target_name ??
    option.code ??
    value;

  return {
    value: String(value),
    label: String(label),
  };
}

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("left-ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 3) {
    pages.push("right-ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

export default function ReleaseReportPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [hasViewedReport, setHasViewedReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [warehouseList, setWarehouseList] = useState([]);
  const [receiverUnitList, setReceiverUnitList] = useState([]);
  const [releaseTargetList, setReleaseTargetList] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);

  const warehouseOptions = useMemo(
    () => warehouseList.map(normalizeOption).filter((item) => item.value),
    [warehouseList]
  );

  const receiverUnitOptions = useMemo(
    () => receiverUnitList.map(normalizeOption).filter((item) => item.value),
    [receiverUnitList]
  );

  const releaseTargetOptions = useMemo(
    () => releaseTargetList.map(normalizeOption).filter((item) => item.value),
    [releaseTargetList]
  );

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const pageItems = useMemo(
    () => buildPageItems(page, totalPages),
    [page, totalPages]
  );

  const fetchWarehouses = useCallback(async () => {
    setWarehouseLoading(true);

    try {
      const response = await getWarehouses({
        search: "",
        page: 1,
        page_size: 100,
      });

      setWarehouseList(extractList(response));
    } catch (error) {
      console.error(
        "LOAD WAREHOUSE LIST ERROR:",
        error?.response?.data || error
      );
      setWarehouseList([]);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Không tải được danh sách kho xuất."
      );
    } finally {
      setWarehouseLoading(false);
    }
  }, []);

  const fetchReleaseReferences = useCallback(async (warehouseId) => {
    if (!warehouseId) {
      setReceiverUnitList([]);
      setReleaseTargetList([]);
      return;
    }

    setReferenceLoading(true);

    try {
      const [targetResponse, receiverResponse] = await Promise.all([
        getReleaseReferencesPageable({
          warehouse_id: warehouseId,
          type: "RELEASE_TARGET",
          page: 1,
          page_size: 100,
        }),
        getReleaseReferencesPageable({
          warehouse_id: warehouseId,
          type: "RECEIVER_UNIT",
          page: 1,
          page_size: 100,
        }),
      ]);

      setReleaseTargetList(extractList(targetResponse));
      setReceiverUnitList(extractList(receiverResponse));
    } catch (error) {
      console.error(
        "LOAD RELEASE REFERENCES ERROR:",
        error?.response?.data || error
      );
      setReceiverUnitList([]);
      setReleaseTargetList([]);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Không tải được đơn vị lĩnh và đối tượng xuất kho."
      );
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchReleaseReferences(filters.warehouse_id);
  }, [filters.warehouse_id, fetchReleaseReferences]);

  const fetchReport = useCallback(async () => {
    if (!hasViewedReport) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const params = {
        warehouse_id: appliedFilters.warehouse_id,
        receiver_unit_id: appliedFilters.receiver_unit_id,
        release_target_id: appliedFilters.release_target_id,
        start_date: appliedFilters.start_date,
        end_date: appliedFilters.end_date,
        page,
        page_size: pageSize,
      };

      const searchText = appliedFilters.search.trim();

      if (searchText) {
        params.search = searchText;
      }

      const response = await getReleaseReportPageable(params);
      const normalized = normalizeResponse(response);

      setRows(normalized.rows);
      setTotalRows(normalized.total);
    } catch (error) {
      setRows([]);
      setTotalRows(0);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Không tải được dữ liệu báo cáo xuất kho."
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, hasViewedReport, page, pageSize]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (hasViewedReport && page > totalPages) {
      setPage(totalPages);
    }
  }, [hasViewedReport, page, totalPages]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setErrorMessage("");

    setFilters((current) => {
      if (name === "warehouse_id") {
        return {
          ...current,
          warehouse_id: value,
          receiver_unit_id: "",
          release_target_id: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const validateFilters = () => {
    if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
      return "Từ ngày không được lớn hơn đến ngày.";
    }

    return "";
  };

  const handleViewReport = (event) => {
    event.preventDefault();

    const validationMessage = validateFilters();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage("");
    setPage(1);
    setAppliedFilters({ ...filters });
    setHasViewedReport(true);
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setRows([]);
    setTotalRows(0);
    setPage(1);
    setPageSize(20);
    setHasViewedReport(false);
    setReceiverUnitList([]);
    setReleaseTargetList([]);
    setErrorMessage("");
  };

  const handlePageSizeChange = (event) => {
    const nextPageSize = Math.min(100, Number(event.target.value) || 20);

    setPageSize(nextPageSize);
    setPage(1);
  };

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
        "release_target",
        "release_target_name",
        "target_name",
        "release_target.name",
      ]),
      releaseTargetName: firstValue(row, [
        "goods_name",
        "goods.name",
        "release_target_name",
        "target_name",
        "release_target.name",
      ]),
      quantity,
      averagePrice,
      amount,
    };
  };

  const firstRowNumber = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRowNumber = Math.min(page * pageSize, totalRows);

  return (
    <section className="release-report-page">
      <header className="release-report-header">
        <div>
          <p className="release-report-breadcrumb">
            Báo cáo / Báo cáo xuất kho
          </p>

          <h1>Báo cáo xuất kho</h1>

          <p className="release-report-description">
            Có thể để trống các điều kiện lọc và bấm Xem báo cáo. Dữ liệu chỉ
            lấy các lệnh xuất kho đã hoàn thành.
          </p>
        </div>
      </header>

      <form
        className="release-report-filter-card"
        onSubmit={handleViewReport}
      >
        <div className="release-report-filter-grid">
          <label className="release-report-field">
            <span>Kho xuất</span>

            <select
              name="warehouse_id"
              value={filters.warehouse_id}
              onChange={handleFilterChange}
              disabled={warehouseLoading}
            >
              <option value="">
                {warehouseLoading
                  ? "Đang tải danh sách kho..."
                  : "-- Chọn kho xuất --"}
              </option>

              {warehouseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="release-report-field">
            <span>Đơn vị lĩnh vật tư</span>

            <select
              name="receiver_unit_id"
              value={filters.receiver_unit_id}
              onChange={handleFilterChange}
              disabled={!filters.warehouse_id || referenceLoading}
            >
              <option value="">
                {!filters.warehouse_id
                  ? "-- Chọn kho xuất trước --"
                  : referenceLoading
                  ? "Đang tải đơn vị lĩnh..."
                  : "-- Chọn đơn vị lĩnh --"}
              </option>

              {receiverUnitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="release-report-field">
            <span>Đối tượng xuất kho</span>

            <select
              name="release_target_id"
              value={filters.release_target_id}
              onChange={handleFilterChange}
              disabled={!filters.warehouse_id || referenceLoading}
            >
              <option value="">
                {!filters.warehouse_id
                  ? "-- Chọn kho xuất trước --"
                  : referenceLoading
                  ? "Đang tải đối tượng xuất kho..."
                  : "-- Chọn đối tượng xuất kho --"}
              </option>

              {releaseTargetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="release-report-field">
            <span>Từ ngày</span>

            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              max={filters.end_date || undefined}
              onChange={handleFilterChange}
            />
          </label>

          <label className="release-report-field">
            <span>Đến ngày</span>

            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              min={filters.start_date || undefined}
              onChange={handleFilterChange}
            />
          </label>

          <label className="release-report-field release-report-search-field">
            <span>Từ khóa</span>

            <input
              type="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Tên vật tư, mã vật tư hoặc mã lệnh XK..."
              autoComplete="off"
            />
          </label>

          <div className="release-report-filter-actions">
            <button
              type="submit"
              className="release-report-search-button"
              disabled={loading || warehouseLoading || referenceLoading}
            >
              {loading ? "Đang tải..." : "Xem báo cáo"}
            </button>

            <button
              type="button"
              className="release-report-reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </form>

      {errorMessage && (
        <div className="release-report-alert" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="release-report-table-card">
        <div className="release-report-table-toolbar">
          <div>
            <h2>BÁO CÁO XUẤT KHO</h2>

            {hasViewedReport ? (
              <p>
                Từ ngày: <strong>{formatDate(appliedFilters.start_date)}</strong>
                {" - "}
                Đến ngày: <strong>{formatDate(appliedFilters.end_date)}</strong>
              </p>
            ) : (
              <p>Vui lòng chọn điều kiện lọc để xem báo cáo.</p>
            )}
          </div>

          {hasViewedReport && (
            <label className="release-report-page-size">
              <span>Số dòng</span>

              <select value={pageSize} onChange={handlePageSizeChange}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {hasViewedReport && (
          <div className="release-report-result-summary">
            Hiển thị {firstRowNumber}-{lastRowNumber} trên {totalRows} kết quả
          </div>
        )}

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
              {!hasViewedReport ? (
                <tr>
                  <td colSpan={12} className="release-report-state-cell">
                    Chọn kho xuất, đơn vị lĩnh, đối tượng xuất kho và khoảng
                    ngày, sau đó bấm Xem báo cáo.
                  </td>
                </tr>
              ) : loading && rows.length === 0 ? (
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

        {hasViewedReport && totalRows > 0 && (
          <footer className="release-report-pagination">
            <span>
              Trang {page}/{totalPages}
            </span>

            <div className="release-report-pagination-buttons">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                aria-label="Trang đầu"
              >
                «
              </button>

              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || loading}
                aria-label="Trang trước"
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
                    onClick={() => setPage(item)}
                    disabled={loading}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages || loading}
                aria-label="Trang sau"
              >
                ›
              </button>

              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                aria-label="Trang cuối"
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