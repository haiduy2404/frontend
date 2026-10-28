import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RiCheckboxCircleLine,
  RiDownload2Line,
  RiErrorWarningLine,
  RiFileExcel2Line,
} from "react-icons/ri";

import "../../styles/StockSummaryReportPage.css";

import GoodsFilterModal from "../../components/GoodsFilterModal";

import {
  REPORT_STOCK_SUMMARY,
  createReportExport,
  downloadReportExport,
  getReportExportStatus,
} from "../../services/reportExportService";
import { readBlobError, saveBlobFile } from "../../services/theKhoService";
import { getWarehouses } from "../../services/warehouseService";
import { useAuth } from "../../contexts/AuthContext";

// Job id được giữ lại để F5 giữa chừng vẫn theo dõi tiếp được, không phải xuất lại.
const STORAGE_KEY = "stock_summary_export_job_id";

const POLLING_DELAY = 2000;
const MAX_POLLING_ERRORS = 5;
const TERMINAL_STATES = ["done", "failed", "cancelled"];

// Celery chết thì AsyncResult trả PENDING mãi mãi, và API vẫn trả 200. Không có
// chốt chặn thì FE hỏi lại mỗi 2 giây đến khi user đóng tab — đúng kiểu spam
// request mà server đang chết lại càng không chịu nổi.
//
// Hai lớp xử lý, cố ý tách riêng:
//
//   1. GIÃN NHỊP: mỗi lần trạng thái không đổi thì chờ lâu hơn, tới trần 20s.
//      Giảm tải ngay cả khi job vẫn còn sống, không cần phán đoán gì.
//   2. NGƯỠNG TREO: không nhúc nhích quá 2 phút thì dừng hẳn, để user tự bấm
//      thử lại.
//
// Ngưỡng tính theo THỜI GIAN chứ không theo số lần hỏi: "5 lần không đổi" ở nhịp
// 2 giây mới là 10 giây, mà một job đang đọc số liệu nặng đứng yên lâu hơn thế
// là chuyện bình thường — đếm theo lần sẽ cắt nhầm job còn sống.
const MAX_POLLING_DELAY = 20000;
const POLLING_BACKOFF = 1.6;
const STALL_TIMEOUT_MS = 120000;

/** Dấu vân tay của tiến độ. Đổi dấu = job còn nhúc nhích. */
const progressSignature = (job) =>
  [
    job?.state,
    job?.stage,
    job?.percent,
    job?.processed_rows,
    job?.total_rows,
  ].join("|");

const EMPTY_GOODS_FILTER = {
  goods_group_ids: [],
  goods_ids: [],
};

const getCurrentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const formatMonth = (value) => {
  const [year, month] = String(value || "").split("-");
  return year && month ? `${month}/${year}` : value || "";
};

/** Số tháng trong khoảng, tính cả hai đầu. 0 nếu khoảng ngược. */
const countMonths = (from, to) => {
  const [fromYear, fromMonth] = String(from || "").split("-").map(Number);
  const [toYear, toMonth] = String(to || "").split("-").map(Number);

  if (!fromYear || !fromMonth || !toYear || !toMonth) return 0;

  const span = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
  return span > 0 ? span : 0;
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
    case "counting":
      return "Đang đọc số liệu…";

    case "writing":
      return job?.total_rows
        ? `Đang ghi file (${job.processed_rows ?? 0}/${job.total_rows} dòng)`
        : `Đang ghi file (${job?.processed_rows ?? 0} dòng)`;

    case "done":
      return "Hoàn thành";

    default:
      return job?.state === "queued" ? "Đang chờ xử lý…" : "Đang xử lý…";
  }
};

const getStateLabel = (state) =>
  ({
    queued: "Đang chờ",
    running: "Đang chạy",
    done: "Hoàn thành",
    failed: "Thất bại",
    cancelled: "Đã hủy",
  }[state] || "Chưa bắt đầu");

const formatBytes = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${
    units[index]
  }`;
};

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

function StockSummaryReportPage() {
  const { canDo } = useAuth();

  const [fromMonth, setFromMonth] = useState(getCurrentMonth);
  const [toMonth, setToMonth] = useState(getCurrentMonth);


  // Rỗng = toàn công ty (không tính điều chuyển). Có kho = mỗi kho một khối, và
  // điều chuyển tính là xuất ở kho nguồn, nhập ở kho đích — giống thẻ kho.
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseIds, setWarehouseIds] = useState([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);

  const [goodsFilter, setGoodsFilter] = useState(EMPTY_GOODS_FILTER);
  const [showGoodsFilterModal, setShowGoodsFilterModal] = useState(false);

  const [creatingExport, setCreatingExport] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportJob, setExportJob] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [connectionErrorCount, setConnectionErrorCount] = useState(0);
  const [stalledSeconds, setStalledSeconds] = useState(0);
  const [formError, setFormError] = useState("");

  const warehouseBoxRef = useRef(null);
  const warehouseRequestIdRef = useRef(0);
  const warehouseSearchTimerRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const pollingFunctionRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const pollingErrorCountRef = useRef(0);
  const pollingDelayRef = useRef(POLLING_DELAY);
  const lastSignatureRef = useRef(null);
  const stalledSinceRef = useRef(null);

  const canViewReport = canDo("view_report");
  const isJobActive = ["queued", "running"].includes(exportJob?.state);
  const monthCount = countMonths(fromMonth, toMonth);

  /* =========================
     KHO
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

      // Bỏ qua kết quả của request cũ: gõ nhanh thì phản hồi về không theo thứ tự.
      if (requestId !== warehouseRequestIdRef.current) return;

      setWarehouses(unwrapWarehouseList(response));
    } catch (error) {
      if (requestId !== warehouseRequestIdRef.current) return;

      console.error("LOAD WAREHOUSES ERROR:", error?.response?.data || error);
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
        warehouseBoxRef.current &&
        !warehouseBoxRef.current.contains(event.target)
      ) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleWarehouse = (id) => {
    const key = String(id);

    setWarehouseIds((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  };

  const selectedWarehouseText = useMemo(() => {
    if (warehouseIds.length === 0) return "Toàn công ty";

    const selected = warehouses.filter((warehouse) =>
      warehouseIds.includes(String(warehouse?.id))
    );

    if (selected.length > 0 && selected.length <= 3) {
      return selected.map((warehouse) => warehouse.code).join(", ");
    }

    return `Đã chọn ${warehouseIds.length} kho`;
  }, [warehouses, warehouseIds]);

  const goodsFilterText = useMemo(() => {
    const groups = goodsFilter.goods_group_ids.length;
    const singles = goodsFilter.goods_ids.length;

    if (!groups && !singles) return "Tất cả vật tư";

    const parts = [];
    if (groups) parts.push(`${groups} nhóm`);
    if (singles) parts.push(`${singles} mã riêng`);

    return `Đã chọn ${parts.join(" + ")}`;
  }, [goodsFilter]);

  /* =========================
     THEO DÕI JOB
  ========================= */

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  /** Về lại nhịp nhanh nhất. Gọi khi job vừa nhúc nhích, hoặc khi user thử lại. */
  const resetPollingPace = useCallback(() => {
    pollingDelayRef.current = POLLING_DELAY;
    lastSignatureRef.current = null;
    stalledSinceRef.current = null;
    setStalledSeconds(0);
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
      if (!jobId || activeJobIdRef.current !== jobId) return;

      try {
        const response = await getReportExportStatus(jobId);
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

        const signature = progressSignature(job);

        if (signature !== lastSignatureRef.current) {
          lastSignatureRef.current = signature;
          stalledSinceRef.current = null;
          pollingDelayRef.current = POLLING_DELAY;
          setStalledSeconds(0);
        } else {
          stalledSinceRef.current ??= Date.now();
          const stalledFor = Date.now() - stalledSinceRef.current;
          setStalledSeconds(Math.round(stalledFor / 1000));

          if (stalledFor >= STALL_TIMEOUT_MS) {
            // Không kết luận "thất bại": job có thể vẫn đang chạy, chỉ là FE
            // không còn cơ sở nào để tin như vậy. Dừng hỏi và nhường cho user.
            stopPolling();
            setPollingStopped(true);
            return;
          }

          pollingDelayRef.current = Math.min(
            Math.round(pollingDelayRef.current * POLLING_BACKOFF),
            MAX_POLLING_DELAY
          );
        }

        schedulePolling(jobId, pollingDelayRef.current);
      } catch (error) {
        const status = error?.response?.status;

        // 400/404 là kết luận cuối: job không tồn tại hoặc file đã bị dọn. Hỏi
        // lại cũng không đổi gì, nên dừng hẳn thay vì quay vòng.
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
                ? "Không tìm thấy job hoặc file đã hết hạn."
                : getApiErrorMessage(error, "Không đọc được trạng thái job."),
          }));

          return;
        }

        // Lỗi mạng thì thử lại vài lần rồi mới bỏ cuộc — job vẫn đang chạy ở
        // server, mất kết nối tạm thời không có nghĩa là job hỏng.
        pollingErrorCountRef.current += 1;
        setConnectionErrorCount(pollingErrorCountRef.current);

        if (pollingErrorCountRef.current >= MAX_POLLING_ERRORS) {
          stopPolling();
          setPollingStopped(true);
          return;
        }

        // Giãn nhịp cả khi lỗi: server đang hỏng thì dội thêm request vào chỉ
        // làm nó hỏng lâu hơn.
        pollingDelayRef.current = Math.min(
          Math.round(pollingDelayRef.current * POLLING_BACKOFF),
          MAX_POLLING_DELAY
        );

        schedulePolling(jobId, pollingDelayRef.current);
      }
    },
    [schedulePolling, stopPolling]
  );

  useEffect(() => {
    pollingFunctionRef.current = pollExportJob;
  }, [pollExportJob]);

  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);
    if (!savedJobId) return;

    activeJobIdRef.current = savedJobId;
    setExportJob({
      job_id: savedJobId,
      state: "queued",
      stage: "counting",
      percent: 0,
    });
    setShowProgressModal(true);
    pollExportJob(savedJobId);
  }, [pollExportJob]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  /* =========================
     HÀNH ĐỘNG
  ========================= */

  const handleResetFilters = () => {
    setFromMonth(getCurrentMonth());
    setToMonth(getCurrentMonth());
    setGoodsFilter(EMPTY_GOODS_FILTER);
    setWarehouseIds([]);
    setWarehouseSearch("");
    setShowWarehouseDropdown(false);
    setFormError("");
  };

  const handleCreateExport = async () => {
    setFormError("");

    if (!fromMonth || !toMonth) {
      setFormError("Chọn tháng bắt đầu và tháng kết thúc.");
      return;
    }

    if (monthCount === 0) {
      setFormError("Tháng kết thúc phải từ tháng bắt đầu trở đi.");
      return;
    }

    if (isJobActive) {
      setShowProgressModal(true);
      return;
    }

    setCreatingExport(true);

    try {
      const response = await createReportExport(REPORT_STOCK_SUMMARY, {
        from_month: fromMonth,
        to_month: toMonth,
        warehouse_ids: warehouseIds,
        goods_ids: goodsFilter.goods_ids,
        goods_group_ids: goodsFilter.goods_group_ids,
      });

      const job = unwrapResponseData(response);
      const jobId = job?.job_id;

      if (!jobId) {
        setFormError("Server không trả về job_id.");
        return;
      }

      activeJobIdRef.current = jobId;
      localStorage.setItem(STORAGE_KEY, jobId);
      pollingErrorCountRef.current = 0;
      resetPollingPace();
      setConnectionErrorCount(0);
      setPollingStopped(false);
      setExportJob({ ...job, state: job?.state || "queued", percent: 0 });
      setShowProgressModal(true);

      schedulePolling(jobId, 600);
    } catch (error) {
      console.error("CREATE EXPORT ERROR:", error?.response?.data || error);
      setFormError(getApiErrorMessage(error, "Không tạo được job xuất file."));
    } finally {
      setCreatingExport(false);
    }
  };

  const handleRetryPolling = () => {
    const jobId = exportJob?.job_id;
    if (!jobId) return;

    activeJobIdRef.current = jobId;
    pollingErrorCountRef.current = 0;
    resetPollingPace();
    setConnectionErrorCount(0);
    setPollingStopped(false);
    pollExportJob(jobId);
  };

  const handleDownload = async () => {
    const jobId = exportJob?.job_id;
    if (!jobId) return;

    setDownloading(true);

    try {
      const fallbackName =
        exportJob?.result?.file_name ||
        `stock-summary-${fromMonth}-${toMonth}.xlsx`;

      const file = await downloadReportExport(jobId, fallbackName);
      saveBlobFile(file);
    } catch (error) {
      const message = await readBlobError(error, "Không tải được file.");
      setExportJob((previous) => ({ ...(previous || {}), error: message }));
    } finally {
      setDownloading(false);
    }
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);

    // Job xong rồi thì đóng là xong. Còn đang chạy thì giữ vòng lặp lại, để mở
    // modal lên là thấy tiến độ hiện tại chứ không phải bắt đầu đếm từ đầu.
    if (!isJobActive) {
      stopPolling();
      activeJobIdRef.current = null;
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  /* =========================
     GIAO DIỆN
  ========================= */

  if (!canViewReport) {
    return (
      <div className="no-permission-page">
        <RiErrorWarningLine size={48} />
        <h2>Không có quyền truy cập</h2>
        <p>Bạn cần quyền xem báo cáo để dùng chức năng này.</p>
      </div>
    );
  }

  const percent = Math.min(100, Math.max(0, Number(exportJob?.percent) || 0));
  const result = exportJob?.result;

  return (
    <div className="stock-summary-page">
      <div className="stock-summary-page-header">
        <div>
          <div className="stock-summary-page-kicker">BÁO CÁO KHO</div>
          <h1>Báo cáo nhập - xuất - tồn</h1>
          <p>
            Tồn đầu kỳ, phát sinh nhập, phát sinh xuất và tồn cuối kỳ của từng
            mã vật tư theo từng tháng. Không chọn kho thì gộp toàn công ty và
            không tính điều chuyển; chọn kho thì mỗi kho một khối, điều chuyển
            tính là xuất ở kho nguồn và nhập ở kho đích.
          </p>
        </div>
      </div>

      <div className="stock-summary-filter-card">
        <div className="stock-summary-filter-grid">
          <div className="stock-summary-field">
            <label htmlFor="stock-summary-from">Từ tháng</label>
            <input
              id="stock-summary-from"
              type="month"
              value={fromMonth}
              onChange={(event) => setFromMonth(event.target.value)}
            />
          </div>

          <div className="stock-summary-field">
            <label htmlFor="stock-summary-to">Đến tháng</label>
            <input
              id="stock-summary-to"
              type="month"
              value={toMonth}
              onChange={(event) => setToMonth(event.target.value)}
            />
          </div>

          <div className="stock-summary-field" ref={warehouseBoxRef}>
            <label htmlFor="stock-summary-warehouse">Kho</label>
            <button
              id="stock-summary-warehouse"
              type="button"
              className="stock-summary-select-button"
              onClick={() => setShowWarehouseDropdown((open) => !open)}
            >
              <span>{selectedWarehouseText}</span>
              <span className="stock-summary-caret">▾</span>
            </button>

            {showWarehouseDropdown && (
              <div className="stock-summary-dropdown">
                <input
                  type="text"
                  className="stock-summary-dropdown-search"
                  placeholder="Tìm theo mã hoặc tên kho…"
                  value={warehouseSearch}
                  onChange={(event) => setWarehouseSearch(event.target.value)}
                />

                {warehouseIds.length > 0 && (
                  <button
                    type="button"
                    className="stock-summary-dropdown-clear"
                    onClick={() => setWarehouseIds([])}
                  >
                    Bỏ chọn — xem toàn công ty
                  </button>
                )}

                <div className="stock-summary-dropdown-list">
                  {warehouseLoading && (
                    <div className="stock-summary-dropdown-status">
                      Đang tải…
                    </div>
                  )}

                  {!warehouseLoading && warehouses.length === 0 && (
                    <div className="stock-summary-dropdown-status">
                      Không có kho nào khớp.
                    </div>
                  )}

                  {warehouses.map((warehouse) => (
                    <label
                      key={warehouse.id}
                      className="stock-summary-dropdown-option"
                    >
                      <input
                        type="checkbox"
                        checked={warehouseIds.includes(String(warehouse.id))}
                        onChange={() => toggleWarehouse(warehouse.id)}
                      />
                      <span>
                        <strong>{warehouse.code}</strong>
                        {warehouse.name ? ` — ${warehouse.name}` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="stock-summary-field">
            <label htmlFor="stock-summary-goods">Vật tư</label>
            <div className="stock-summary-goods-control">
              <button
                id="stock-summary-goods"
                type="button"
                className="stock-summary-select-button"
                onClick={() => setShowGoodsFilterModal(true)}
              >
                <span>{goodsFilterText}</span>
                <span className="stock-summary-caret">▾</span>
              </button>

              {goodsFilterText !== "Tất cả vật tư" && (
                <button
                  type="button"
                  className="stock-summary-goods-clear"
                  onClick={() => setGoodsFilter(EMPTY_GOODS_FILTER)}
                >
                  Bỏ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="stock-summary-hint">
          {monthCount > 0
            ? `Sẽ xuất ${monthCount} tháng: ${formatMonth(
                fromMonth
              )} - ${formatMonth(toMonth)}.`
            : "Chọn khoảng tháng hợp lệ."}
          {warehouseIds.length === 0
            ? " Toàn công ty: gộp mọi kho, không tính điều chuyển."
            : ` Theo ${warehouseIds.length} kho: mỗi kho một khối, có tính điều chuyển.`}
          {" Để trống vật tư nghĩa là lấy tất cả."}
        </div>

        {formError && (
          <div className="stock-summary-form-error">
            <RiErrorWarningLine /> {formError}
          </div>
        )}

        <div className="stock-summary-actions">
          <button
            type="button"
            className="stock-summary-reset-btn"
            onClick={handleResetFilters}
            disabled={creatingExport}
          >
            Đặt lại
          </button>

          {isJobActive ? (
            <button
              type="button"
              className="stock-summary-running-btn"
              onClick={() => setShowProgressModal(true)}
            >
              Đang xuất — xem tiến độ
            </button>
          ) : (
            <button
              type="button"
              className="stock-summary-export-btn"
              onClick={handleCreateExport}
              disabled={creatingExport || monthCount === 0}
            >
              <RiFileExcel2Line />
              {creatingExport ? "Đang tạo job…" : "Xuất Excel"}
            </button>
          )}
        </div>
      </div>

      {showGoodsFilterModal && (
        <GoodsFilterModal
          value={goodsFilter.goods_group_ids}
          goodsIds={goodsFilter.goods_ids}
          title="Lọc mã vật tư"
          onClose={() => setShowGoodsFilterModal(false)}
          onConfirm={(value) => {
            setGoodsFilter({
              goods_group_ids: Array.isArray(value?.goods_group_ids)
                ? value.goods_group_ids
                : [],
              goods_ids: Array.isArray(value?.goods_ids) ? value.goods_ids : [],
            });
            setShowGoodsFilterModal(false);
          }}
        />
      )}

      {showProgressModal && exportJob && (
        <div
          className="stock-summary-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseProgressModal();
            }
          }}
        >
          <div className="stock-summary-progress-modal">
            <div className="stock-summary-modal-header">
              <h3>Xuất báo cáo nhập - xuất - tồn</h3>
              <button
                type="button"
                className="stock-summary-modal-close"
                onClick={handleCloseProgressModal}
              >
                ×
              </button>
            </div>

            <div className="stock-summary-progress-section">
              <div className="stock-summary-progress-meta">
                <span
                  className={`stock-summary-state-badge state-${
                    exportJob.state || "unknown"
                  }`}
                >
                  {getStateLabel(exportJob.state)}
                </span>
                <span>{getStageText(exportJob)}</span>
                <span>{percent}%</span>
              </div>

              <div className="stock-summary-progress-track">
                <div
                  className="stock-summary-progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {connectionErrorCount > 0 && !pollingStopped && (
              <div className="stock-summary-connection-warning">
                Mất kết nối tạm thời ({connectionErrorCount}/
                {MAX_POLLING_ERRORS}) — job vẫn đang chạy trên server.
              </div>
            )}

            {stalledSeconds >= 20 && !pollingStopped && (
              <div className="stock-summary-connection-warning">
                Tiến độ chưa đổi trong {stalledSeconds}s — đang giãn nhịp kiểm
                tra. Sẽ ngừng theo dõi nếu đứng yên quá{" "}
                {Math.round(STALL_TIMEOUT_MS / 1000)}s.
              </div>
            )}

            {pollingStopped && (
              <div className="stock-summary-connection-error">
                <span>
                  {connectionErrorCount >= MAX_POLLING_ERRORS
                    ? "Không kết nối được tới server, đã ngừng theo dõi."
                    : `Tiến độ đứng yên quá ${Math.round(
                        STALL_TIMEOUT_MS / 1000
                      )}s, đã ngừng theo dõi. Có thể worker đã dừng.`}
                </span>
                <button type="button" onClick={handleRetryPolling}>
                  Thử lại
                </button>
              </div>
            )}

            {exportJob.error && (
              <div className="stock-summary-job-error">
                <RiErrorWarningLine /> {exportJob.error}
              </div>
            )}

            {exportJob.state === "done" && (
              <div className="stock-summary-result-box">
                <div className="stock-summary-result-title">
                  <RiCheckboxCircleLine /> File đã sẵn sàng
                </div>

                <div className="stock-summary-result-grid">
                  <div>
                    <span>Số dòng</span>
                    <strong>{result?.written_rows ?? 0}</strong>
                  </div>
                  <div>
                    <span>Dung lượng</span>
                    <strong>{formatBytes(result?.file_size_bytes)}</strong>
                  </div>
                  <div>
                    <span>Thời gian chạy</span>
                    <strong>{result?.elapsed_seconds ?? 0}s</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="stock-summary-download-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  <RiDownload2Line />
                  {downloading ? "Đang tải…" : "Tải file .xlsx"}
                </button>

                <div className="stock-summary-retention-note">
                  File được giữ trong 24 giờ, sau đó phải xuất lại.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StockSummaryReportPage;
