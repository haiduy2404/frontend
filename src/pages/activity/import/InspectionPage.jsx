import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/InspectionPage.css";

import {
  getWarehouseReceiptsPageable,
  getWarehouseReceiptByCode,
} from "../../../services/warehouseReceiptService";

import {
  getDefaultImportOrderFilters,
  buildImportOrderFilterParams,
} from "./utils/importOrderFilterUtils";

import { RiEdit2Line } from "react-icons/ri";

function InspectionPage() {
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(getDefaultImportOrderFilters());

  const unwrapData = (response) => response?.data || response;
  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};
  const getInspectionCodeFromReceiptCode = (receiptCode) => {
    const text = String(receiptCode || "");

    const numbers = text.replace(/\D/g, "");

    if (!numbers) return "--";

    return numbers.slice(-2).padStart(2, "0");
  };

  const filteredInspections = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return inspections;
    }

    return inspections.filter((row) => {
      const inspectionCode = String(
        row.inspection_code || row.code || row.invoice_code || ""
      ).toLowerCase();

      const receiptCode = String(
        row.receipt_code ||
          row.warehouse_receipt_code ||
          row.code ||
          row.invoice_code ||
          ""
      ).toLowerCase();

      return (
        inspectionCode.includes(keyword) ||
        receiptCode.includes(keyword)
      );
    });
  }, [inspections, search]);

  const selectedRow = filteredInspections.find((item) => item.id === selectedId);

  const fetchInspectionDetail = async (code) => {
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
      console.error(
        "LOAD INSPECTION DETAIL ERROR:",
        error.response?.data || error
      );
      setSelectedReceiptDetail(null);
      setDetailRows([]);
      alert("Không tải được chi tiết hàng hóa");
    } finally {
      setDetailLoading(false);
    }
  };
const fetchInspections = async (customParams = {}) => {
  try {
    setLoading(true);
    const filterParams = buildImportOrderFilterParams(filters);

    const response = await getWarehouseReceiptsPageable({
      search,
      page,
      page_size: pageSize,
      ...filterParams,
      ...customParams,
    });

      const data = unwrapData(response);
      const results = Array.isArray(data?.results) ? data.results : [];

      setInspections(results);
      setSelectedIds([]);
      setTotal(data?.total || results.length);

      if (results.length > 0) {
        const firstRow = results[0];

        setSelectedId(firstRow.id);
        fetchInspectionDetail(firstRow.code);
      } else {
        setSelectedId(null);
        setDetailRows([]);
        setSelectedReceiptDetail(null);
      }
    } catch (error) {
      console.error("LOAD INSPECTIONS ERROR:", error.response?.data || error);
      alert("Không tải được danh sách biên bản kiểm nghiệm");
      setInspections([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [page, pageSize]);

  const isAllChecked =
    filteredInspections.length > 0 &&
    filteredInspections.every((row) => selectedIds.includes(row.id));

  const handleToggleAll = (e) => {
    const checked = e.target.checked;

    if (checked) {
      setSelectedIds(filteredInspections.map((row) => row.id));
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

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
        setPage(1);
        fetchInspections();
        }
    };

    const handleEditInspection = () => {
    if (!selectedRow) {
        alert("Vui lòng chọn biên bản kiểm nghiệm cần chỉnh sửa");
        return;
    }

    const receiptCode =
        selectedRow.receipt_code ||
        selectedRow.warehouse_receipt_code ||
        selectedRow.code ||
        selectedRow.invoice_code;

    if (!receiptCode) {
        alert("Không tìm thấy phiếu nhập kho tham chiếu");
        return;
    }

    navigate(`/dashboard/activity/import/inspection-detail/${receiptCode}`);
    };

  const handleFilterChange = (e) => {
  const { name, value } = e.target;

  const nextFilters = {
    ...filters,
    [name]: value,
  };

  setFilters(nextFilters);

  if (nextFilters.time_type === "custom") {
    if (!nextFilters.start_date || !nextFilters.end_date) {
      return;
    }

    if (new Date(nextFilters.start_date) > new Date(nextFilters.end_date)) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
  }

  const filterParams = buildImportOrderFilterParams(nextFilters);

  setPage(1);

  fetchInspections({
    page: 1,
    ...filterParams,
  });
};

  const handleTimeTypeChange = (e) => {
    const value = e.target.value;

    const nextFilters = {
      ...filters,
      time_type: value,
      start_date: value === "custom" ? filters.start_date : "",
      end_date: value === "custom" ? filters.end_date : "",
    };

    setFilters(nextFilters);
    setPage(1);

    if (value === "custom") {
      return;
    }

    const filterParams = buildImportOrderFilterParams(nextFilters);

    fetchInspections({
      page: 1,
      ...filterParams,
    });
  };

  return (
    <div className="inspection-page">
      <div className="inspection-toolbar">
        <div className="inspection-filters">
          <input
            className="inspection-search"
            placeholder="🔍  Tìm kiếm số biên bản"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          <select
            className="inspection-time-select"
            name="time_type"
            value={filters.time_type}
            onChange={handleTimeTypeChange}
          >
            <option value="this_month">Tháng này</option>
            <option value="quarter_1">Quý 1</option>
            <option value="quarter_2">Quý 2</option>
            <option value="quarter_3">Quý 3</option>
            <option value="quarter_4">Quý 4</option>
            <option value="custom">Tùy chọn</option>
          </select>

          {filters.time_type === "custom" && (
            <>
              <input
                type="date"
                name="start_date"
                className="inspection-date-input"
                value={filters.start_date}
                onChange={handleFilterChange}
              />

              <input
                type="date"
                name="end_date"
                className="inspection-date-input"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </>
          )}
            </div>
                <div className="inspection-actions">
                <button
                    type="button"
                    className="inspection-edit-btn"
                    disabled={!selectedRow}
                    onClick={handleEditInspection}
                    >
                    <RiEdit2Line />
                    <span>Chỉnh sửa</span>
                </button>
            </div>
      </div>

      <div className="inspection-main">
        <div className="inspection-table-wrapper">
          <table className="inspection-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={isAllChecked}
                    onChange={handleToggleAll}
                  />
                </th>
                <th>Số biên bản kiểm nghiệm</th>
                <th>Tham chiếu phiếu nhập kho</th>
                <th>Ngày nhập kho</th>
              </tr>
            </thead>

            <tbody>
            {!loading &&
            filteredInspections.map((row) => {
                const receiptCode =
                  row.receipt_code ||
                  row.warehouse_receipt_code ||
                  row.code ||
                  row.invoice_code ||
                "-";
                const receiptDate =
                  row.receipt_date ||
                  row.warehouse_receipt_date ||
                  row.import_date ||
                  row.created_at ||
                  row.date ||
                null;

                const inspectionCode = getInspectionCodeFromReceiptCode(receiptCode);

                return (
                <tr
                    key={row.id}
                    className={selectedId === row.id ? "selected" : ""}
                    onClick={() => {
                    setSelectedId(row.id);
                    fetchInspectionDetail(row.code);
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
                            `/dashboard/activity/import/inspection-detail/${row.code || row.id}?mode=print`
                        );
                    }}
                    >
                    {inspectionCode}
                    </td>

                    <td>{receiptCode}</td>
                    <td>{formatDate(receiptDate)}</td>
                </tr>
                );
            })}

              {!loading && filteredInspections.length === 0 && (
                <tr>
                  <td className="inspection-empty-row" colSpan={4}>
                    Không có biên bản kiểm nghiệm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="inspection-pagination">
          <div>
            Tổng số: <strong>{total}</strong>
          </div>

          <div className="inspection-pagination-right">
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
              {filteredInspections.length > 0
                ? `${(page - 1) * pageSize + 1} - ${
                    (page - 1) * pageSize + filteredInspections.length
                  }`
                : "0 - 0"}
            </strong>

            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
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

        <div className="inspection-detail-splitter">⌄</div>

        <div className="inspection-detail">
          <h3>Chi tiết hàng hóa</h3>

          <div className="inspection-detail-table-wrapper">
            <table className="inspection-detail-table">
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Mã hàng</th>
                    <th>Tên hàng</th>
                    <th>Đơn vị tính</th>
                    <th>Số lượng theo chứng từ</th>
                    <th>Số lượng đúng quy cách, phẩm chất</th>
                    <th>Số lượng không đúng quy cách, phẩm chất</th>
                </tr>
            </thead>

              <tbody>
                {detailLoading && (
                  <tr>
                    <td className="inspection-empty-row" colSpan={7}>
                      Đang tải chi tiết...
                    </td>
                  </tr>
                )}

                {!detailLoading && detailRows.length === 0 && (
                  <tr>
                    <td className="inspection-empty-row" colSpan={7}>
                      Không có chi tiết hàng hóa
                    </td>
                  </tr>
                )}

                    {!detailLoading &&
                        detailRows.map((item, index) => {
                    const formatQuantity = (value) => {
                      if (value === null || value === undefined || value === "") return "-";

                      const number = Number(value);

                      if (Number.isNaN(number)) return value;

                      return number.toLocaleString("vi-VN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    };

                    const documentQuantity = formatQuantity(item.original_quantity);

                    const acceptedQuantity = formatQuantity(item.accepted_quantity);

                    const rejectedQuantity = formatQuantity(item.rejected_quantity);

                        return (
                        <tr key={item.inventory_id || item.goods_id || index}>
                            <td>{index + 1}</td>
                            <td>{item.goods_code || "-"}</td>
                            <td>{item.goods_name || "-"}</td>
                            <td>{item.unit_name || "-"}</td>
                            <td className="number-col">{documentQuantity}</td>
                            <td className="number-col">{acceptedQuantity}</td>
                            <td className="number-col">{rejectedQuantity}</td>
                        </tr>
                        );
                    })}
              </tbody>
            </table>
          </div>

          <div className="inspection-detail-pagination">
            <div>
              Tổng số: <strong>{detailRows.length}</strong>
            </div>

            <div className="inspection-detail-pagination-right">
              <span>Số dòng/trang</span>

              <select defaultValue={30}>
                <option value={30}>30</option>
              </select>

              <strong>
                {detailRows.length > 0 ? `1 - ${detailRows.length}` : "0 - 0"}
              </strong>

              <button disabled>‹</button>
              <button disabled>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InspectionPage;