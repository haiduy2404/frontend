import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/ReleaseReportPage.css";

import { getWarehouses } from "../../services/warehouseService";
import { getReleaseReferencesPageable } from "../../services/releaseOrderService";
import GoodsFilterModal from "../../components/GoodsFilterModal";
import { useAuth } from "../../contexts/AuthContext";

const INITIAL_FILTERS = {
  warehouse_id: "",
  receiver_unit_id: "",
  release_target_id: "",
  start_date: "",
  end_date: "",
  search: "",
};

function unwrapList(responseData) {
  const payload = responseData?.data ?? responseData ?? [];

  if (Array.isArray(payload)) return payload;

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
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function normalizeOption(option) {
  if (option == null) return { value: "", label: "" };

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

function ReleaseReportPage() {
  const { canDo } = useAuth();

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [warehouses, setWarehouses] = useState([]);
  const [receiverUnits, setReceiverUnits] = useState([]);
  const [releaseTargets, setReleaseTargets] = useState([]);

  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);

  const [selectedGoodsFilter, setSelectedGoodsFilter] = useState({
    goods_group_ids: [],
    goods_ids: [],
  });
  const [showGoodsFilterModal, setShowGoodsFilterModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const warehouseOptions = useMemo(
    () => warehouses.map(normalizeOption).filter((item) => item.value),
    [warehouses]
  );

  const receiverUnitOptions = useMemo(
    () => receiverUnits.map(normalizeOption).filter((item) => item.value),
    [receiverUnits]
  );

  const releaseTargetOptions = useMemo(
    () => releaseTargets.map(normalizeOption).filter((item) => item.value),
    [releaseTargets]
  );

  const fetchWarehouses = useCallback(async () => {
    try {
      setWarehouseLoading(true);

      const response = await getWarehouses({
        search: "",
        page: 1,
        page_size: 100,
      });

      setWarehouses(unwrapList(response));
    } catch (error) {
      console.error(
        "LOAD WAREHOUSE LIST ERROR:",
        error?.response?.data || error
      );

      setWarehouses([]);
      setErrorMessage("Không tải được danh sách kho xuất.");
    } finally {
      setWarehouseLoading(false);
    }
  }, []);

  const fetchReleaseReferences = useCallback(async (warehouseId) => {
    if (!warehouseId) {
      setReceiverUnits([]);
      setReleaseTargets([]);
      return;
    }

    try {
      setReferenceLoading(true);

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

      setReleaseTargets(unwrapList(targetResponse));
      setReceiverUnits(unwrapList(receiverResponse));
    } catch (error) {
      console.error(
        "LOAD RELEASE REFERENCES ERROR:",
        error?.response?.data || error
      );

      setReceiverUnits([]);
      setReleaseTargets([]);
      setErrorMessage("Không tải được đơn vị lĩnh và đối tượng xuất kho.");
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
    if (
      filters.start_date &&
      filters.end_date &&
      filters.start_date > filters.end_date
    ) {
      return "Từ ngày không được lớn hơn Đến ngày.";
    }

    return "";
  };

  const handleConfirmGoods = (value) => {
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
    setFilters(INITIAL_FILTERS);
    setSelectedGoodsFilter({
      goods_group_ids: [],
      goods_ids: [],
    });
    setReceiverUnits([]);
    setReleaseTargets([]);
    setErrorMessage("");
  };

  const handleViewReport = (event) => {
    event.preventDefault();

    const validationMessage = validateFilters();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const reportConfig = {
      warehouse_id: filters.warehouse_id || "",
      receiver_unit_id: filters.receiver_unit_id || "",
      release_target_id: filters.release_target_id || "",
      start_date: filters.start_date || "",
      end_date: filters.end_date || "",
      search: String(filters.search || "").trim(),

      goods_group_ids: selectedGoodsFilter.goods_group_ids,
      goods_ids: selectedGoodsFilter.goods_ids,

      created_at: new Date().toISOString(),
    };

    const reportKey = `warehouse-release-report-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    try {
      localStorage.setItem(reportKey, JSON.stringify(reportConfig));
    } catch (error) {
      console.error("SAVE RELEASE REPORT CONFIG ERROR:", error);
      setErrorMessage("Không thể mở báo cáo. Vui lòng thử lại.");
      return;
    }

    const url = `/warehouse-release-report/view?reportKey=${encodeURIComponent(
      reportKey
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!canDo("view_report")) {
    return (
      <div className="no-permission-page">
        Tài khoản không có quyền truy cập báo cáo kho
      </div>
    );
  }

  const selectedGroupCount = selectedGoodsFilter.goods_group_ids.length;
  const selectedGoodsCount = selectedGoodsFilter.goods_ids.length;

  const hasGoodsFilter =
    selectedGroupCount > 0 || selectedGoodsCount > 0;

  const goodsFilterLabel = (() => {
    if (!hasGoodsFilter) {
      return "Tất cả mã vật tư";
    }

    const parts = [];

    if (selectedGroupCount > 0) {
      parts.push(`${selectedGroupCount} nhóm`);
    }

    if (selectedGoodsCount > 0) {
      parts.push(`${selectedGoodsCount} mã riêng`);
    }

    return `Đã chọn ${parts.join(" + ")}`;
  })();

  return (
    <section className="release-report-page">
      <header className="release-report-header">
        <div>
          <p className="release-report-breadcrumb">
            Báo cáo / Báo cáo xuất kho
          </p>

          <h1>Báo cáo xuất kho</h1>
        </div>
      </header>

      <form
        className="release-report-filter-card"
        onSubmit={handleViewReport}
      >
        <div className="release-report-filter-grid release-report-filter-grid-stacked">
          {/* HÀNG 1: TỪ NGÀY / ĐẾN NGÀY */}
          <div className="release-report-filter-row release-report-filter-row-dates">
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
          </div>

          {/* HÀNG 2: KHO XUẤT */}
          <div className="release-report-filter-row">
            <label className="release-report-field release-report-field-full">
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
                    : "-- Tất cả kho xuất --"}
                </option>

                {warehouseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* HÀNG 3: TÌM NHANH MÃ VẬT TƯ */}
          <div className="release-report-filter-row">
            <label className="release-report-field release-report-field-full">
              <span>Tìm kiếm</span>

              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Nhập nhanh mã vật tư để xem báo cáo"
              />
            </label>
          </div>

          {/* HÀNG 4: ĐƠN VỊ LĨNH */}
          <div className="release-report-filter-row">
            <label className="release-report-field release-report-field-full">
              <span>Đơn vị lĩnh vật tư</span>

              <select
                name="receiver_unit_id"
                value={filters.receiver_unit_id}
                onChange={handleFilterChange}
                disabled={!filters.warehouse_id || referenceLoading}
              >
                <option value="">
                  {!filters.warehouse_id
                    ? "-- Chọn kho để lọc thêm --"
                    : referenceLoading
                    ? "Đang tải đơn vị lĩnh..."
                    : "-- Tất cả đơn vị lĩnh --"}
                </option>

                {receiverUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* HÀNG 5: ĐỐI TƯỢNG XUẤT KHO */}
          <div className="release-report-filter-row">
            <label className="release-report-field release-report-field-full">
              <span>Đối tượng xuất kho</span>

              <select
                name="release_target_id"
                value={filters.release_target_id}
                onChange={handleFilterChange}
                disabled={!filters.warehouse_id || referenceLoading}
              >
                <option value="">
                  {!filters.warehouse_id
                    ? "-- Chọn kho để lọc thêm --"
                    : referenceLoading
                    ? "Đang tải đối tượng xuất..."
                    : "-- Tất cả đối tượng xuất --"}
                </option>

                {releaseTargetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* HÀNG 6: LỌC MÃ VẬT TƯ - GIỮ NGUYÊN LOGIC CŨ */}
          <div className="release-report-filter-row">
            <div className="release-report-field release-report-field-full">
              <span>Lọc mã vật tư</span>

              <div className="release-report-goods-filter-control">
                <button
                  type="button"
                  className="release-report-goods-filter-button"
                  onClick={() => setShowGoodsFilterModal(true)}
                >
                  {goodsFilterLabel}
                </button>

                {hasGoodsFilter && (
                  <button
                    type="button"
                    className="release-report-goods-filter-clear"
                    title="Bỏ lọc vật tư"
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

          {/* HÀNG 7: ACTION */}
          <div className="release-report-filter-actions release-report-filter-actions-bottom">
            <button
              type="submit"
              className="release-report-search-button"
              disabled={warehouseLoading || referenceLoading}
            >
              Xem báo cáo
            </button>

            <button
              type="button"
              className="release-report-reset-button"
              onClick={handleReset}
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

      {showGoodsFilterModal && (
        <GoodsFilterModal
          open={showGoodsFilterModal}
          multiple={true}
          value={selectedGoodsFilter.goods_group_ids}
          title="Lọc mã vật tư"
          onClose={() => setShowGoodsFilterModal(false)}
          onConfirm={handleConfirmGoods}
        />
      )}
    </section>
  );
}

export default ReleaseReportPage;