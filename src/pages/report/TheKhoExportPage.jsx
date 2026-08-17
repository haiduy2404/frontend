import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiDownload2Line,
  RiErrorWarningLine,
  RiFileExcel2Line,
  RiFilePdf2Line,
} from "react-icons/ri";

import "../../styles/TheKhoExportPage.css";

import GoodsFilterModal from "../../components/GoodsFilterModal";

import {
  createTheKhoExport,
  downloadTheKhoExport,
  getTheKhoExportStatus,
  readBlobError,
  saveBlobFile,
} from "../../services/theKhoService";

import { getWarehouses } from "../../services/warehouseService";
import { useAuth } from "../../contexts/AuthContext";

const STORAGE_KEY = "the_kho_export_job_id";
const POLLING_DELAY = 2500;
const MAX_POLLING_ERRORS = 5;
const TERMINAL_STATES = ["done", "failed", "cancelled"];

const EMPTY_GOODS_FILTER = {
  goods_group_ids: [],
  goods_ids: [],
};

const getCurrentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const formatPeriodMonth = (value) => {
  if (!value) return "";

  const [year, month] = String(value).split("-");

  if (!year || !month) return value;

  return `${month}/${year}`;
};

const unwrapResponseData = (response) => response?.data ?? response;

const unwrapWarehouseList = (response) => {
  const body = response?.data ?? response;
  const data = body?.data ?? body;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const getStageText = (job) => {
  switch (job?.stage) {
    case "checking":
      return "Đang kiểm tra số liệu…";

    case "exporting":
      return `Đang xuất thẻ kho (${job?.processed_goods ?? 0}/${
        job?.total_goods ?? 0
      })`;

    case "zipping":
      return "Đang nén file…";

    case "done":
      return "Hoàn thành";

    default:
      return job?.state === "queued"
        ? "Đang chờ xử lý…"
        : "Đang xử lý…";
  }
};

const getStateLabel = (state) => {
  switch (state) {
    case "queued":
      return "Đang chờ";
    case "running":
      return "Đang chạy";
    case "done":
      return "Hoàn thành";
    case "failed":
      return "Thất bại";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Chưa bắt đầu";
  }
};

const formatBytes = (bytes) => {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / 1024 ** unitIndex).toFixed(
    unitIndex === 0 ? 0 : 1
  )} ${units[unitIndex]}`;
};

const getApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  error?.response?.data?.error ||
  error?.message ||
  fallbackMessage;

function TheKhoExportPage() {
  const { canDo } = useAuth();

  /* =========================
     THÔNG SỐ XUẤT
  ========================= */

  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth);
  const [formats, setFormats] = useState(["xlsx"]);
  const periodMonthPickerRef = useRef(null);

  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] =
    useState(false);

  const warehouseDropdownRef = useRef(null);
  const warehouseSearchTimerRef = useRef(null);
  const warehouseRequestIdRef = useRef(0);

  /*
   * Dùng chung contract GoodsFilterModal mới:
   *
   * {
   *   goods_group_ids: [
   *     {
   *       goods_group_id: "...",
   *       choosen_goods: []
   *     }
   *   ],
   *   goods_ids: []
   * }
   *
   * goods_group_ids = [] + goods_ids = []
   * => BE hiểu là không lọc vật tư / xuất tất cả vật tư.
   */
  const [goodsFilter, setGoodsFilter] = useState(EMPTY_GOODS_FILTER);
  const [showGoodsFilterModal, setShowGoodsFilterModal] = useState(false);

  const [creatingExport, setCreatingExport] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* =========================
     JOB / POLLING
  ========================= */

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [exportJob, setExportJob] = useState(null);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [connectionErrorCount, setConnectionErrorCount] = useState(0);

  const pollingTimerRef = useRef(null);
  const pollingFunctionRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const pollingErrorCountRef = useRef(0);

  const isJobActive = ["queued", "running"].includes(exportJob?.state);

  const canViewReport =
    canDo("view_opening_stock") || canDo("view_report");

  const selectedWarehouse = useMemo(
    () =>
      warehouses.find(
        (warehouse) =>
          String(warehouse?.id) === String(warehouseId)
      ) || null,
    [warehouses, warehouseId]
  );

  const selectedWarehouseText = selectedWarehouse
    ? `${selectedWarehouse.code || ""}${
        selectedWarehouse.code ? " - " : ""
      }${selectedWarehouse.name || ""}`
    : "Tất cả kho";

  const selectedGroupCount = goodsFilter.goods_group_ids.length;
  const standaloneGoodsCount = goodsFilter.goods_ids.length;

  const hasGoodsFilter =
    selectedGroupCount > 0 || standaloneGoodsCount > 0;

  const goodsFilterText = useMemo(() => {
    if (!hasGoodsFilter) {
      return "Tất cả vật tư";
    }

    const parts = [];

    if (selectedGroupCount > 0) {
      parts.push(`${selectedGroupCount} nhóm`);
    }

    if (standaloneGoodsCount > 0) {
      parts.push(`${standaloneGoodsCount} mã riêng`);
    }

    return `Đã chọn ${parts.join(" + ")}`;
  }, [
    hasGoodsFilter,
    selectedGroupCount,
    standaloneGoodsCount,
  ]);

  /* =========================
     WAREHOUSE FILTER
  ========================= */

  const fetchWarehouses = useCallback(async (keyword = "") => {
    const requestId = ++warehouseRequestIdRef.current;

    try {
      setWarehouseLoading(true);

      const response = await getWarehouses({
        search: String(keyword || "").trim(),
        page: 1,
        page_size: 100,
      });

      if (requestId !== warehouseRequestIdRef.current) {
        return;
      }

      setWarehouses(unwrapWarehouseList(response));
    } catch (error) {
      if (requestId !== warehouseRequestIdRef.current) {
        return;
      }

      console.error(
        "LOAD WAREHOUSES ERROR:",
        error?.response?.data || error
      );

      setWarehouses([]);
    } finally {
      if (requestId === warehouseRequestIdRef.current) {
        setWarehouseLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWarehouses("");
  }, [fetchWarehouses]);

  useEffect(() => {
    if (warehouseSearchTimerRef.current) {
      window.clearTimeout(warehouseSearchTimerRef.current);
    }

    warehouseSearchTimerRef.current = window.setTimeout(() => {
      fetchWarehouses(warehouseSearch);
    }, 500);

    return () => {
      if (warehouseSearchTimerRef.current) {
        window.clearTimeout(warehouseSearchTimerRef.current);
      }
    };
  }, [warehouseSearch, fetchWarehouses]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        warehouseDropdownRef.current &&
        !warehouseDropdownRef.current.contains(event.target)
      ) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectWarehouse = (warehouse) => {
    setWarehouseId(warehouse?.id || "");
    setWarehouseSearch("");
    setShowWarehouseDropdown(false);
  };

  /* =========================
     POLLING
  ========================= */

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const schedulePolling = useCallback(
    (jobId, delay = POLLING_DELAY) => {
      stopPolling();

      pollingTimerRef.current = window.setTimeout(() => {
        pollingFunctionRef.current?.(jobId);
      }, delay);
    },
    [stopPolling]
  );

  const pollExportJob = useCallback(
    async (jobId) => {
      if (!jobId || activeJobIdRef.current !== jobId) {
        return;
      }

      try {
        const response = await getTheKhoExportStatus(jobId);
        const job = unwrapResponseData(response);

        pollingErrorCountRef.current = 0;
        setConnectionErrorCount(0);
        setPollingStopped(false);
        setExportJob(job);

        if (TERMINAL_STATES.includes(job?.state)) {
          stopPolling();
          activeJobIdRef.current = null;
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        schedulePolling(jobId);
      } catch (error) {
        const status = error?.response?.status;

        if (status === 400 || status === 404) {
          stopPolling();
          activeJobIdRef.current = null;
          localStorage.removeItem(STORAGE_KEY);
          setPollingStopped(true);

          setExportJob((previous) => ({
            ...(previous || {}),
            job_id: jobId,
            state: "failed",
            error:
              status === 404
                ? "Không tìm thấy job hoặc file job đã hết hạn."
                : getApiErrorMessage(
                    error,
                    "Không thể đọc trạng thái job."
                  ),
          }));

          return;
        }

        pollingErrorCountRef.current += 1;
        const nextErrorCount = pollingErrorCountRef.current;

        setConnectionErrorCount(nextErrorCount);

        if (nextErrorCount >= MAX_POLLING_ERRORS) {
          stopPolling();
          setPollingStopped(true);
          return;
        }

        schedulePolling(jobId);
      }
    },
    [schedulePolling, stopPolling]
  );

  useEffect(() => {
    pollingFunctionRef.current = pollExportJob;
  }, [pollExportJob]);

  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);

    if (!savedJobId) {
      return undefined;
    }

    activeJobIdRef.current = savedJobId;

    setExportJob({
      job_id: savedJobId,
      state: "queued",
      stage: "checking",
      percent: 0,
      warnings: [],
    });

    setShowProgressModal(true);
    pollExportJob(savedJobId);

    return undefined;
  }, [pollExportJob]);

  useEffect(
    () => () => {
      stopPolling();
    },
    [stopPolling]
  );

  /* =========================
     GOODS FILTER MODAL
  ========================= */

  const handleConfirmGoodsFilter = (value) => {
    setGoodsFilter({
      goods_group_ids: Array.isArray(value?.goods_group_ids)
        ? value.goods_group_ids
        : [],

      goods_ids: Array.isArray(value?.goods_ids)
        ? value.goods_ids
        : [],
    });

    setShowGoodsFilterModal(false);
  };

  const handleClearGoodsFilter = () => {
    setGoodsFilter({
      goods_group_ids: [],
      goods_ids: [],
    });
  };

  const handleResetFilters = () => {
    setPeriodMonth(getCurrentMonth());
    setWarehouseId("");
    setWarehouseSearch("");
    setGoodsFilter({
      goods_group_ids: [],
      goods_ids: [],
    });
    setFormats(["xlsx"]);
    setShowWarehouseDropdown(false);
  };

  /* =========================
     FORMAT
  ========================= */

  const handleToggleFormat = (format) => {
    setFormats((previous) =>
      previous.includes(format)
        ? previous.filter((item) => item !== format)
        : [...previous, format]
    );
  };

  /* =========================
     CREATE EXPORT
  ========================= */

  const handleCreateExport = async () => {
    if (!periodMonth) {
      alert("Vui lòng chọn tháng xuất thẻ kho.");
      return;
    }

    if (formats.length === 0) {
      alert("Vui lòng chọn ít nhất một định dạng.");
      return;
    }

    if (isJobActive) {
      setShowProgressModal(true);
      return;
    }

    setCreatingExport(true);

    try {
      /*
       * CHỖ THAY ĐỔI QUAN TRỌNG SO VỚI CODE CŨ:
       *
       * Không còn gửi danh sách selectedIds lấy từ table pageable.
       * Gửi thẳng filter theo đúng contract giống báo cáo nhập/xuất:
       *
       * goods_group_ids:
       *   - [] => không lọc theo group / tất cả
       *   - choosen_goods: [] => toàn bộ group
       *   - choosen_goods: [id...] => chỉ các mã đó trong group
       *
       * goods_ids vẫn giữ để BE hỗ trợ các mã riêng.
       */
      const payload = {
        period_month: periodMonth,

        // Không chọn kho => null => toàn bộ kho.
        // Có chọn kho => đúng kho được chọn.
        warehouse_id: warehouseId || null,

        formats,
      };

      // Giống báo cáo nhập/xuất:
      // chỉ gửi filter vật tư khi người dùng thực sự chọn.
      if (
        Array.isArray(goodsFilter.goods_group_ids) &&
        goodsFilter.goods_group_ids.length > 0
      ) {
        payload.goods_group_ids = goodsFilter.goods_group_ids;
      }

      if (
        Array.isArray(goodsFilter.goods_ids) &&
        goodsFilter.goods_ids.length > 0
      ) {
        payload.goods_ids = goodsFilter.goods_ids;
      }

      const response = await createTheKhoExport(payload);

      const job = unwrapResponseData(response);

      if (!job?.job_id) {
        throw new Error("API không trả về job_id.");
      }

      const initialJob = {
        ...job,
        percent: Number(job.percent) || 0,
        warnings: Array.isArray(job.warnings)
          ? job.warnings
          : [],
      };

      stopPolling();

      pollingErrorCountRef.current = 0;
      setConnectionErrorCount(0);
      setPollingStopped(false);
      setExportJob(initialJob);
      setShowProgressModal(true);

      activeJobIdRef.current = job.job_id;
      localStorage.setItem(STORAGE_KEY, job.job_id);

      schedulePolling(job.job_id, 500);
    } catch (error) {
      console.error(
        "CREATE THE KHO EXPORT ERROR:",
        error?.response?.data || error
      );

      alert(
        getApiErrorMessage(
          error,
          "Không thể tạo yêu cầu xuất thẻ kho."
        )
      );
    } finally {
      setCreatingExport(false);
    }
  };

  /* =========================
     JOB ACTIONS
  ========================= */

  const handleRetryPolling = () => {
    const jobId = exportJob?.job_id;

    if (!jobId) {
      return;
    }

    pollingErrorCountRef.current = 0;
    setConnectionErrorCount(0);
    setPollingStopped(false);

    activeJobIdRef.current = jobId;
    localStorage.setItem(STORAGE_KEY, jobId);

    pollExportJob(jobId);
  };

  const handleDownload = async () => {
    const jobId = exportJob?.job_id;

    if (!jobId) {
      alert("Không tìm thấy job để tải file.");
      return;
    }

    setDownloading(true);

    try {
      const file = await downloadTheKhoExport(jobId);
      saveBlobFile(file);
    } catch (error) {
      const status = error?.response?.status;

      const message = await readBlobError(
        error,
        "Không thể tải file thẻ kho."
      );

      if (status === 404) {
        alert("File đã hết hạn hoặc đã bị xóa. Vui lòng xuất lại.");
      } else if (status === 400) {
        alert(message || "Job chưa hoàn thành hoặc không có file.");
      } else {
        alert(message);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
  };

  /* =========================
     PERMISSION
  ========================= */

  if (!canViewReport) {
    return (
      <div className="no-permission-page">
        Bạn không có quyền xem hoặc xuất báo cáo thẻ kho
      </div>
    );
  }

  /* =========================
     JOB VIEW DATA
  ========================= */

  const progressPercent = Math.min(
    100,
    Math.max(0, Number(exportJob?.percent) || 0)
  );

  const warnings = Array.isArray(exportJob?.warnings)
    ? exportJob.warnings
    : [];

  const blockingWarnings = warnings.filter(
    (warning) => warning?.severity === "blocking"
  );

  const normalWarnings = warnings.filter(
    (warning) => warning?.severity !== "blocking"
  );

  const result = exportJob?.result || {};

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="the-kho-export-page">
      <div className="the-kho-filter-card">
        <div className="the-kho-filter-grid the-kho-filter-grid-stacked">
          {/* THÁNG THẺ KHO */}
          <label className="the-kho-field the-kho-field-full">
            <span>Tháng thẻ kho</span>

            <div className="the-kho-month-picker">
              <input
                type="text"
                value={formatPeriodMonth(periodMonth)}
                placeholder="MM/YYYY"
                readOnly
                onClick={() => {
                  const picker = periodMonthPickerRef.current;

                  if (!picker || creatingExport) return;

                  if (typeof picker.showPicker === "function") {
                    picker.showPicker();
                  } else {
                    picker.click();
                  }
                }}
                disabled={creatingExport}
              />

              <input
                ref={periodMonthPickerRef}
                type="month"
                className="the-kho-native-month-input"
                value={periodMonth}
                onChange={(event) =>
                  setPeriodMonth(event.target.value)
                }
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </label>

          {/* CHỌN KHO - OPTIONAL */}
          <div className="the-kho-field the-kho-field-full">
            <span>Chọn kho cần xuất thẻ kho</span>

            <div
              className="the-kho-warehouse-select"
              ref={warehouseDropdownRef}
            >
              <button
                type="button"
                className="the-kho-warehouse-button"
                onClick={() =>
                  setShowWarehouseDropdown((previous) => !previous)
                }
                disabled={creatingExport}
              >
                <span>{selectedWarehouseText}</span>
                <span>{showWarehouseDropdown ? "▴" : "▾"}</span>
              </button>

              {showWarehouseDropdown && (
                <div className="the-kho-warehouse-dropdown">
                  <div className="the-kho-warehouse-search-wrap">
                    <input
                      type="text"
                      value={warehouseSearch}
                      placeholder="Tìm theo mã kho hoặc tên kho..."
                      autoFocus
                      onChange={(event) =>
                        setWarehouseSearch(event.target.value)
                      }
                    />

                    {warehouseSearch && (
                      <button
                        type="button"
                        title="Xóa tìm kiếm"
                        onClick={() => setWarehouseSearch("")}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="the-kho-warehouse-list">
                    <button
                      type="button"
                      className={`the-kho-warehouse-option ${
                        !warehouseId ? "selected" : ""
                      }`}
                      onClick={() => handleSelectWarehouse(null)}
                    >
                      <strong>Tất cả kho</strong>
                      <small>
                        Không chọn kho - xuất thẻ kho toàn bộ kho
                      </small>
                    </button>

                    {warehouseLoading && (
                      <div className="the-kho-warehouse-status">
                        Đang tìm kho...
                      </div>
                    )}

                    {!warehouseLoading &&
                      warehouses.length === 0 && (
                        <div className="the-kho-warehouse-status">
                          Không tìm thấy kho
                        </div>
                      )}

                    {!warehouseLoading &&
                      warehouses.map((warehouse) => (
                        <button
                          type="button"
                          key={warehouse.id}
                          className={`the-kho-warehouse-option ${
                            String(warehouse.id) ===
                            String(warehouseId)
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleSelectWarehouse(warehouse)
                          }
                        >
                          <strong>
                            {warehouse.code || "Không mã"}
                            {warehouse.name
                              ? ` - ${warehouse.name}`
                              : ""}
                          </strong>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LỌC MÃ VẬT TƯ */}
          <div className="the-kho-field the-kho-goods-filter-field the-kho-field-full">
            <span>Lọc mã vật tư</span>

            <div className="the-kho-goods-filter-control">
              <button
                type="button"
                className="the-kho-goods-filter-btn"
                onClick={() => setShowGoodsFilterModal(true)}
                disabled={creatingExport}
              >
                {goodsFilterText}
              </button>

              {hasGoodsFilter && (
                <button
                  type="button"
                  className="the-kho-goods-filter-clear"
                  title="Bỏ lọc vật tư"
                  onClick={handleClearGoodsFilter}
                  disabled={creatingExport}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* ĐỊNH DẠNG */}
          <div className="the-kho-field the-kho-field-full">
            <span>Định dạng</span>

            <div className="the-kho-format-list">
              <label
                className={`the-kho-format-option ${
                  formats.includes("xlsx") ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={formats.includes("xlsx")}
                  onChange={() => handleToggleFormat("xlsx")}
                  disabled={creatingExport}
                />

                <RiFileExcel2Line />
                Excel
              </label>

              <label
                className={`the-kho-format-option ${
                  formats.includes("pdf") ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={formats.includes("pdf")}
                  onChange={() => handleToggleFormat("pdf")}
                  disabled={creatingExport}
                />

                <RiFilePdf2Line />
                PDF
              </label>
            </div>
          </div>

          {/* ACTION */}
          <div className="the-kho-export-actions the-kho-export-actions-bottom">
            <button
              type="button"
              className="the-kho-export-btn"
              onClick={handleCreateExport}
              disabled={
                creatingExport ||
                formats.length === 0
              }
            >
              {creatingExport
                ? "Đang tạo yêu cầu…"
                : isJobActive
                ? "Xem tiến độ"
                : "Xuất thẻ kho"}
            </button>

            <button
              type="button"
              className="the-kho-reset-btn"
              onClick={handleResetFilters}
              disabled={creatingExport}
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* CỐ Ý ĐỂ TRỐNG PHẦN DƯỚI.
          Không còn table goods pageable ở page này.
          Sau này có thể gắn thêm nội dung khác nếu cần. */}
      <div className="the-kho-empty-workspace" />

      {showGoodsFilterModal && (
        <GoodsFilterModal
          open={showGoodsFilterModal}
          multiple={true}
          value={goodsFilter.goods_group_ids}
          goodsIds={goodsFilter.goods_ids}
          title="Lọc mã vật tư"
          onClose={() => setShowGoodsFilterModal(false)}
          onConfirm={handleConfirmGoodsFilter}
        />
      )}

      {showProgressModal && exportJob && (
        <div
          className="the-kho-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseProgressModal();
            }
          }}
        >
          <div
            className="the-kho-progress-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="the-kho-progress-title"
          >
            <div className="the-kho-modal-header">
              <div>
                <h2 id="the-kho-progress-title">
                  Tiến độ xuất thẻ kho
                </h2>

                <span
                  className={`the-kho-state-badge state-${
                    exportJob.state || "unknown"
                  }`}
                >
                  {getStateLabel(exportJob.state)}
                </span>
              </div>

              <button
                type="button"
                className="the-kho-modal-close"
                title="Đóng"
                onClick={handleCloseProgressModal}
              >
                <RiCloseLine />
              </button>
            </div>

            <div className="the-kho-progress-section">
              <div className="the-kho-progress-meta">
                <span>{getStageText(exportJob)}</span>
                <strong>{progressPercent}%</strong>
              </div>

              <div
                className="the-kho-progress-track"
                aria-label={`Tiến độ ${progressPercent}%`}
              >
                <div
                  className="the-kho-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="the-kho-job-stats">
                <div>
                  <span>Đã xử lý</span>

                  <strong>
                    {exportJob.processed_goods ?? 0}/
                    {exportJob.total_goods ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Thời gian</span>

                  <strong>
                    {Number(
                      exportJob.elapsed_seconds || 0
                    ).toFixed(1)}{" "}
                    giây
                  </strong>
                </div>
              </div>
            </div>

            {connectionErrorCount > 0 && !pollingStopped && (
              <div className="the-kho-connection-warning">
                <RiAlertLine />

                Kết nối tạm thời không ổn định. Đang thử lại (
                {connectionErrorCount}/{MAX_POLLING_ERRORS})…
              </div>
            )}

            {pollingStopped &&
              !TERMINAL_STATES.includes(exportJob.state) && (
                <div className="the-kho-connection-error">
                  <RiErrorWarningLine />

                  <div>
                    <strong>Mất kết nối tới máy chủ</strong>

                    <span>
                      Job vẫn có thể đang chạy. Bấm thử lại để
                      tiếp tục cập nhật tiến độ.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRetryPolling}
                  >
                    Thử lại
                  </button>
                </div>
              )}

            {exportJob.state === "done" && (
              <div className="the-kho-result-box">
                <div className="the-kho-result-title">
                  <RiCheckboxCircleLine />

                  <div>
                    <strong>Xuất thẻ kho hoàn tất</strong>

                    <span>
                      Đã xuất{" "}
                      {result.exported_goods ??
                        exportJob.processed_goods ??
                        0}
                      /
                      {result.total_goods ??
                        exportJob.total_goods ??
                        0}{" "}
                      mã vật tư.
                    </span>
                  </div>
                </div>

                <div className="the-kho-result-grid">
                  <div>
                    <span>Số file</span>
                    <strong>{result.files_written ?? 0}</strong>
                  </div>

                  <div>
                    <span>Tên file</span>
                    <strong>{result.zip_name || "-"}</strong>
                  </div>

                  <div>
                    <span>Dung lượng</span>
                    <strong>
                      {formatBytes(result.zip_size_bytes)}
                    </strong>
                  </div>
                </div>

                {exportJob.download_url ? (
                  <button
                    type="button"
                    className="the-kho-download-btn"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    <RiDownload2Line />

                    {downloading
                      ? "Đang tải…"
                      : "Tải file ZIP"}
                  </button>
                ) : (
                  <div className="the-kho-no-download">
                    Không có file để tải vì tất cả mã được chọn
                    đều bị chặn.
                  </div>
                )}

                <p className="the-kho-retention-note">
                  File chỉ được lưu trong 24 giờ. Sau thời gian
                  này cần xuất lại.
                </p>
              </div>
            )}

            {exportJob.state === "failed" && (
              <div className="the-kho-job-error">
                <RiErrorWarningLine />

                <div>
                  <strong>Xuất thẻ kho thất bại</strong>

                  <span>
                    {exportJob.error ||
                      "Không xác định được nguyên nhân."}
                  </span>
                </div>
              </div>
            )}

            {exportJob.state === "cancelled" && (
              <div className="the-kho-job-error cancelled">
                <RiAlertLine />

                <div>
                  <strong>Yêu cầu đã bị hủy</strong>
                  <span>
                    Job xuất thẻ kho không tiếp tục xử lý.
                  </span>
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="the-kho-warnings-section">
                <div className="the-kho-warnings-heading">
                  <h3>
                    Cảnh báo số liệu ({warnings.length})
                  </h3>

                  <div className="the-kho-warning-counts">
                    {blockingWarnings.length > 0 && (
                      <span className="blocking">
                        {blockingWarnings.length} chặn xuất
                      </span>
                    )}

                    {normalWarnings.length > 0 && (
                      <span className="warning">
                        {normalWarnings.length} cảnh báo
                      </span>
                    )}
                  </div>
                </div>

                <div className="the-kho-warning-list">
                  {warnings.map((warning, index) => (
                    <div
                      key={`${
                        warning.goods_id || "warning"
                      }-${index}`}
                      className={`the-kho-warning-item ${
                        warning.severity === "blocking"
                          ? "blocking"
                          : "warning"
                      }`}
                    >
                      <div className="the-kho-warning-icon">
                        {warning.severity === "blocking"
                          ? "⛔"
                          : "⚠️"}
                      </div>

                      <div className="the-kho-warning-content">
                        <strong>
                          {[
                            warning.goods_code,
                            warning.goods_name,
                          ]
                            .filter(Boolean)
                            .join(" - ") || "Cảnh báo"}
                        </strong>

                        <p>{warning.message}</p>

                        {Array.isArray(warning.details) &&
                          warning.details.length > 0 && (
                            <ul>
                              {warning.details.map(
                                (detail, detailIndex) => (
                                  <li
                                    key={`${detail}-${detailIndex}`}
                                  >
                                    {detail}
                                  </li>
                                )
                              )}
                            </ul>
                          )}

                        <span className="the-kho-warning-note">
                          {warning.severity === "blocking"
                            ? "Mã này không có trong file xuất."
                            : "Mã vẫn được xuất nhưng số liệu có thể cần kiểm tra."}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="the-kho-modal-footer">
              <button
                type="button"
                className="the-kho-secondary-btn"
                onClick={handleCloseProgressModal}
              >
                {isJobActive
                  ? "Đóng và chạy ngầm"
                  : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TheKhoExportPage;