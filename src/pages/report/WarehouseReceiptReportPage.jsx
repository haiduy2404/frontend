import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/WarehouseReceiptReportPage.css";

import { getCompanies } from "../../services/companyService";
import GoodsFilterModal from "../../components/GoodsFilterModal";
import CompanyMultiSelect from "../../components/report/CompanyMultiSelect";
import { useAuth } from "../../contexts/AuthContext";

// Chỉ gọi API và bóc danh sách — không đụng state, để effect và nút "Thử lại"
// cùng dùng mà effect không setState đồng bộ.
async function fetchCompanyList() {
  const response = await getCompanies();
  const body = response?.data ?? response;
  const data = body?.data ?? body;
  if (Array.isArray(data?.results)) return data.results;
  return Array.isArray(data) ? data : [];
}

function WarehouseReceiptReportPage() {
  const { canDo } = useAuth();

  const [filterMode, setFilterMode] = useState("company");

  const [commonFilters, setCommonFilters] = useState({
    start_date: "",
    end_date: "",
  });

  /* =========================
     COMPANY FILTER
  ========================= */
  const [companies, setCompanies] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);

  /* =========================
     GOODS FILTER
  ========================= */
  const [showGoodsFilterModal, setShowGoodsFilterModal] = useState(false);
  const [selectedGoodsFilter, setSelectedGoodsFilter] = useState({
    goods_group_ids: [],
    goods_ids: [],
  });
  const [goodsSearch, setGoodsSearch] = useState("");

  const validateDateRange = () => {
    if (
      commonFilters.start_date &&
      commonFilters.end_date &&
      commonFilters.start_date > commonFilters.end_date
    ) {
      alert("Từ ngày không được lớn hơn Đến ngày");
      return false;
    }

    return true;
  };

  /* =========================
     LOAD COMPANIES
     Danh sách công ty nhỏ (~100) và /inventory/company trả về toàn bộ, nên nạp
     MỘT lần rồi để ô chọn tự lọc theo tên/MST — không request nào theo phím gõ.
  ========================= */
  const applyCompanyResult = useCallback((list, error) => {
    if (error) {
      console.error("LOAD COMPANIES ERROR:", error?.response?.data || error);
    }
    setCompanies(list);
    setCompanyError(
      error
        ? error?.response?.data?.message || "Không tải được danh sách công ty."
        : ""
    );
    setCompanyLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;

    fetchCompanyList().then(
      (list) => alive && applyCompanyResult(list, null),
      (error) => alive && applyCompanyResult([], error)
    );

    return () => {
      alive = false;
    };
  }, [applyCompanyResult]);

  const retryLoadCompanies = () => {
    setCompanyLoading(true);
    setCompanyError("");
    fetchCompanyList().then(
      (list) => applyCompanyResult(list, null),
      (error) => applyCompanyResult([], error)
    );
  };

  const handleConfirmGoodsFilter = (value) => {
    setSelectedGoodsFilter({
      goods_group_ids: Array.isArray(value?.goods_group_ids)
        ? value.goods_group_ids
        : [],
      goods_ids: Array.isArray(value?.goods_ids)
        ? value.goods_ids
        : [],
    });

    setShowGoodsFilterModal(false);
  };

  const handleReset = () => {
    setCommonFilters({
      start_date: "",
      end_date: "",
    });

    setSelectedCompanyIds([]);
    setSelectedGoodsFilter({
      goods_group_ids: [],
      goods_ids: [],
    });
    setGoodsSearch("");
  };

  const handleChangeMode = (mode) => {
    setFilterMode(mode);
  };

  const selectedGoodsFilterText = useMemo(() => {
    const groupCount = selectedGoodsFilter.goods_group_ids.length;
    const goodsCount = selectedGoodsFilter.goods_ids.length;

    if (groupCount === 0 && goodsCount === 0) {
      return "Tất cả vật tư";
    }

    const parts = [];

    if (groupCount > 0) {
      parts.push(`${groupCount} nhóm`);
    }

    if (goodsCount > 0) {
      parts.push(`${goodsCount} mã riêng`);
    }

    return `Đã chọn ${parts.join(" + ")}`;
  }, [selectedGoodsFilter]);

  const hasGoodsFilter =
    selectedGoodsFilter.goods_group_ids.length > 0 ||
    selectedGoodsFilter.goods_ids.length > 0;

  const renderCompanySelect = (inputId) => (
    <CompanyMultiSelect
      id={inputId}
      companies={companies}
      value={selectedCompanyIds}
      onChange={setSelectedCompanyIds}
      loading={companyLoading}
      error={companyError}
      onRetry={retryLoadCompanies}
    />
  );

  /*
   * PAGE NÀY CHỈ CHỌN THÔNG SỐ.
   * KHÔNG CALL API REPORT.
   * KHÔNG RENDER BẢNG REPORT.
   *
   * Khi bấm Xem báo cáo:
   * 1. Lưu bộ lọc tạm vào localStorage.
   * 2. Mở tab trắng riêng theo đúng mode.
   * 3. Tab mới tự gọi API và tự render bảng + Xuất Excel.
   */
  const handleViewReport = () => {
    if (!validateDateRange()) return;

    const reportKey = `warehouse-receipt-report-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const selectedCompanies = selectedCompanyIds.map((companyId) => {
      const company = companies.find(
        (item) => String(item.id) === String(companyId)
      );

      return company
        ? {
            id: company.id,
            supplier_name: company.supplier_name,
            tax_code: company.tax_code,
          }
        : {
            id: companyId,
          };
    });

    const reportConfig = {
      mode: filterMode,

      start_date: commonFilters.start_date || "",
      end_date: commonFilters.end_date || "",

      company_ids: selectedCompanyIds,
      companies: selectedCompanies,

      goods_group_ids:
        filterMode === "goods"
          ? selectedGoodsFilter.goods_group_ids
          : [],

      goods_ids:
        filterMode === "goods"
          ? selectedGoodsFilter.goods_ids
          : [],

      search:
        filterMode === "goods"
          ? String(goodsSearch || "").trim()
          : "",

      created_at: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(reportKey, JSON.stringify(reportConfig));
    } catch (error) {
      console.error("SAVE REPORT CONFIG ERROR:", error);
      alert("Không thể mở báo cáo. Vui lòng thử lại.");
      return;
    }

    const reportPath =
      filterMode === "company"
        ? "/warehouse-receipt-report/company"
        : "/warehouse-receipt-report/goods";

    const reportUrl = `${reportPath}?reportKey=${encodeURIComponent(
      reportKey
    )}`;

    window.open(reportUrl, "_blank", "noopener,noreferrer");
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
      <div className="warehouse-receipt-report-page-header">
        <div className="warehouse-receipt-report-breadcrumb">
          Báo cáo / Báo cáo nhập kho
        </div>
        <h1>Báo cáo nhập kho</h1>
      </div>

      <div className="warehouse-company-report-toolbar">
        <div className="report-filter-mode-switch">
          <button
            type="button"
            className={filterMode === "company" ? "active" : ""}
            onClick={() => handleChangeMode("company")}
          >
            Lọc theo công ty
          </button>

          <button
            type="button"
            className={filterMode === "goods" ? "active" : ""}
            onClick={() => handleChangeMode("goods")}
          >
            Lọc theo mã vật tư
          </button>
        </div>

        <div className="warehouse-company-report-filters">
          {filterMode === "company" ? (
            <div className="receipt-report-filter-layout">
              <div className="receipt-report-filter-row receipt-report-date-row">
                <label className="report-filter-item">
                  <span>Từ ngày</span>
                  <input
                    type="date"
                    value={commonFilters.start_date}
                    onChange={(event) =>
                      setCommonFilters((prev) => ({
                        ...prev,
                        start_date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="report-filter-item">
                  <span>Đến ngày</span>
                  <input
                    type="date"
                    value={commonFilters.end_date}
                    onChange={(event) =>
                      setCommonFilters((prev) => ({
                        ...prev,
                        end_date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="receipt-report-filter-row">
                <div className="report-filter-item receipt-report-wide-field">
                  <label htmlFor="receipt-report-company-by-company"><span>Công ty</span></label>
                  {renderCompanySelect("receipt-report-company-by-company")}
                </div>
              </div>

              <div className="receipt-report-action-row">
                <button
                  type="button"
                  className="report-primary-btn"
                  onClick={handleViewReport}
                >
                  Xem báo cáo
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
          ) : (
            <div className="receipt-report-filter-layout">
              <div className="receipt-report-filter-row receipt-report-date-row">
                <label className="report-filter-item">
                  <span>Từ ngày</span>
                  <input
                    type="date"
                    value={commonFilters.start_date}
                    onChange={(event) =>
                      setCommonFilters((prev) => ({
                        ...prev,
                        start_date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="report-filter-item">
                  <span>Đến ngày</span>
                  <input
                    type="date"
                    value={commonFilters.end_date}
                    onChange={(event) =>
                      setCommonFilters((prev) => ({
                        ...prev,
                        end_date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="receipt-report-filter-row receipt-report-two-column-row">
                <div className="report-filter-item report-goods-filter-item">
                  <span>Lọc mã vật tư</span>

                  <div className="report-goods-filter-control">
                    <button
                      type="button"
                      className="report-goods-filter-btn"
                      onClick={() => setShowGoodsFilterModal(true)}
                    >
                      {selectedGoodsFilterText}
                    </button>

                    {hasGoodsFilter && (
                      <button
                        type="button"
                        className="report-goods-filter-clear"
                        title="Bỏ chọn mã vật tư"
                        onClick={() =>
                          setSelectedGoodsFilter({
                            goods_group_ids: [],
                            goods_ids: [],
                          })
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <label className="report-filter-item">
                  <span>Tìm nhanh vật tư / số phiếu</span>
                  <input
                    type="text"
                    value={goodsSearch}
                    placeholder="Mã vật tư / tên vật tư / số phiếu..."
                    onChange={(event) =>
                      setGoodsSearch(event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="receipt-report-filter-row">
                <div className="report-filter-item receipt-report-wide-field">
                  <label htmlFor="receipt-report-company-by-goods"><span>Công ty</span></label>
                  {renderCompanySelect("receipt-report-company-by-goods")}
                </div>
              </div>

              <div className="receipt-report-action-row">
                <button
                  type="button"
                  className="report-primary-btn"
                  onClick={handleViewReport}
                >
                  Xem báo cáo
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
          )}
        </div>
      </div>

      {showGoodsFilterModal && (
        <GoodsFilterModal
          open={showGoodsFilterModal}
          multiple={true}
          title="Lọc mã vật tư"
          value={selectedGoodsFilter.goods_group_ids}
          goodsIds={selectedGoodsFilter.goods_ids}
          onClose={() => setShowGoodsFilterModal(false)}
          onConfirm={handleConfirmGoodsFilter}
        />
      )}
    </div>
  );
}

export default WarehouseReceiptReportPage;