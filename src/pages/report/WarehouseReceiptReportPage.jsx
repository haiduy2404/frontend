import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/WarehouseReceiptReportPage.css";

import { getCompanies } from "../../services/companyService";
import GoodsFilterModal from "../../components/GoodsFilterModal";
import { useAuth } from "../../contexts/AuthContext";

function WarehouseReceiptReportPage() {
  const { canDo } = useAuth();

  const companyDropdownRef = useRef(null);
  const companyRequestIdRef = useRef(0);
  const skipFirstCompanySearchRef = useRef(true);

  const [filterMode, setFilterMode] = useState("company");

  const [commonFilters, setCommonFilters] = useState({
    start_date: "",
    end_date: "",
  });

  /* =========================
     COMPANY FILTER
  ========================= */
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyLoading, setCompanyLoading] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
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

  const unwrapData = (response) => response?.data ?? response;

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
  ========================= */
  const fetchCompanies = useCallback(async (keyword = "") => {
    const requestId = ++companyRequestIdRef.current;

    try {
      setCompanyLoading(true);

      const searchText = String(keyword || "").trim();
      const taxCodeKeyword = searchText.replace(/\D/g, "");

      const looksLikeTaxCode =
        searchText.length > 0 &&
        taxCodeKeyword.length > 0 &&
        /^[\d\s.\-]+$/.test(searchText);

      const params = {
        page: 1,
        page_size: 1000,
      };

      if (searchText) {
        params.search = searchText;
      }

      let response = await getCompanies(params);
      let body = unwrapData(response);
      let data = body?.data ?? body;

      let results = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      if (looksLikeTaxCode) {
        const filterByTaxCode = (list) =>
          list.filter((company) => {
            const companyTaxCode = String(
              company?.tax_code ||
                company?.taxCode ||
                company?.tax_office_code ||
                ""
            ).replace(/\D/g, "");

            return companyTaxCode.includes(taxCodeKeyword);
          });

        let taxMatches = filterByTaxCode(results);

        // Nếu API search chưa hỗ trợ MST thì lấy danh sách và tự dò tax_code.
        if (taxMatches.length === 0) {
          response = await getCompanies({
            page: 1,
            page_size: 1000,
          });

          body = unwrapData(response);
          data = body?.data ?? body;

          const allCompanies = Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
            ? data
            : [];

          taxMatches = filterByTaxCode(allCompanies);
        }

        results = taxMatches;
      }

      if (requestId !== companyRequestIdRef.current) return;

      setCompanies(results);
    } catch (error) {
      if (requestId !== companyRequestIdRef.current) return;

      console.error(
        "LOAD COMPANIES ERROR:",
        error?.response?.data || error
      );
      setCompanies([]);
    } finally {
      if (requestId === companyRequestIdRef.current) {
        setCompanyLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCompanies("");
  }, [fetchCompanies]);

  useEffect(() => {
    if (skipFirstCompanySearchRef.current) {
      skipFirstCompanySearchRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchCompanies(companySearch);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [companySearch, fetchCompanies]);

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

  const selectedCompanyText = useMemo(() => {
    if (selectedCompanyIds.length === 0) return "Tất cả công ty";

    if (selectedCompanyIds.length === 1) {
      const company = companies.find(
        (item) => String(item.id) === String(selectedCompanyIds[0])
      );

      return company?.supplier_name || "Đã chọn 1 công ty";
    }

    return `Đã chọn ${selectedCompanyIds.length} công ty`;
  }, [companies, selectedCompanyIds]);

  const handleToggleCompany = (companyId) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleToggleAllCompanies = () => {
    const allIds = companies.map((company) => company.id);

    const allSelected =
      allIds.length > 0 &&
      allIds.every((id) => selectedCompanyIds.includes(id));

    setSelectedCompanyIds(allSelected ? [] : allIds);
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
    setCompanySearch("");
    setSelectedGoodsFilter({
      goods_group_ids: [],
      goods_ids: [],
    });
    setGoodsSearch("");
    setIsCompanyDropdownOpen(false);
  };

  const handleChangeMode = (mode) => {
    setFilterMode(mode);
    setIsCompanyDropdownOpen(false);
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

  const renderCompanyDropdown = () => (
    <div
      ref={companyDropdownRef}
      className="company-dropdown-wrapper"
    >
      <button
        type="button"
        className="company-dropdown-button"
        onClick={() =>
          setIsCompanyDropdownOpen((prev) => !prev)
        }
      >
        <span>{selectedCompanyText}</span>
        <span>{isCompanyDropdownOpen ? "▴" : "▾"}</span>
      </button>

      {isCompanyDropdownOpen && (
        <div className="company-dropdown-menu">
          <div className="company-dropdown-list">
            {companyLoading && (
              <div className="company-dropdown-loading">
                Đang tìm công ty...
              </div>
            )}

            {!companyLoading && (
              <>
                <label className="company-dropdown-option all-option">
                  <input
                    type="checkbox"
                    checked={
                      companies.length > 0 &&
                      companies.every((company) =>
                        selectedCompanyIds.includes(company.id)
                      )
                    }
                    onChange={handleToggleAllCompanies}
                  />
                  <span>Chọn tất cả kết quả</span>
                </label>

                <div className="company-dropdown-divider" />

                {companies.length === 0 && (
                  <div className="company-dropdown-empty">
                    Không tìm thấy công ty
                  </div>
                )}

                {companies.map((company) => (
                  <label
                    key={company.id}
                    className="company-dropdown-option"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanyIds.includes(company.id)}
                      onChange={() => handleToggleCompany(company.id)}
                    />

                    <span>
                      <strong>{company.supplier_name}</strong>
                      <small>MST: {company.tax_code || "-"}</small>
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>

          <div className="company-dropdown-footer">
            <span>Đã chọn {selectedCompanyIds.length} công ty</span>

            <button
              type="button"
              onClick={() => setSelectedCompanyIds([])}
            >
              Xóa chọn
            </button>
          </div>
        </div>
      )}
    </div>
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
                <label className="report-filter-item receipt-report-wide-field">
                  <span>Tìm kiếm theo tên công ty</span>
                  <input
                    type="text"
                    value={companySearch}
                    placeholder="Nhập nhanh tên công ty hoặc MST để xem báo cáo"
                    onFocus={() => setIsCompanyDropdownOpen(true)}
                    onChange={(event) => {
                      setCompanySearch(event.target.value);
                      setIsCompanyDropdownOpen(true);
                    }}
                  />
                </label>
              </div>

              <div className="receipt-report-filter-row">
                <div className="report-filter-item company-multiselect receipt-report-wide-field">
                  <span>Lọc tên công ty muốn xem báo cáo</span>
                  {renderCompanyDropdown()}
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
                <label className="report-filter-item">
                  <span>Tìm nhanh mã vật tư</span>
                  <input
                    type="text"
                    value={goodsSearch}
                    placeholder="Mã vật tư / tên vật tư / số phiếu..."
                    onChange={(event) =>
                      setGoodsSearch(event.target.value)
                    }
                  />
                </label>

                <label className="report-filter-item">
                  <span>Tìm nhanh công ty / MST</span>
                  <input
                    type="text"
                    value={companySearch}
                    placeholder="Nhập tên công ty hoặc MST..."
                    onFocus={() => setIsCompanyDropdownOpen(true)}
                    onChange={(event) => {
                      setCompanySearch(event.target.value);
                      setIsCompanyDropdownOpen(true);
                    }}
                  />
                </label>
              </div>

              <div className="receipt-report-filter-row receipt-report-two-column-row">
                <div className="report-filter-item company-multiselect">
                  <span>Lọc công ty</span>
                  {renderCompanyDropdown()}
                </div>

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