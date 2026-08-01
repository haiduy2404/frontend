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
  RiRefreshLine,
} from "react-icons/ri";
import "../../styles/TheKhoExportPage.css";
import { getGoods } from "../../services/goodsService";
import {
  createTheKhoExport,
  downloadTheKhoExport,
  getTheKhoExportStatus,
  readBlobError,
  saveBlobFile,
} from "../../services/theKhoService";
import { useAuth } from "../../contexts/AuthContext";

const STORAGE_KEY = "the_kho_export_job_id";
const POLLING_DELAY = 2500;
const MAX_POLLING_ERRORS = 5;
const MAX_GOODS = 20000;
const TERMINAL_STATES = ["done", "failed", "cancelled"];

const getCurrentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const unwrapResponseData = (response) => response?.data ?? response;

const getGoodsUnitName = (goods) =>
  goods?.units?.find((unit) => unit.is_default)?.unit_name ||
  goods?.units?.[0]?.unit_name ||
  "-";

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

  const [goodsList, setGoodsList] = useState([]);
  const [selectedGoods, setSelectedGoods] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingGoods, setLoadingGoods] = useState(false);

  const [periodMonth, setPeriodMonth] = useState(getCurrentMonth);
  const [formats, setFormats] = useState(["xlsx"]);
  const [creatingExport, setCreatingExport] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [exportJob, setExportJob] = useState(null);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [connectionErrorCount, setConnectionErrorCount] = useState(0);

  const selectAllRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const pollingFunctionRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const pollingErrorCountRef = useRef(0);

  const selectedIds = useMemo(
    () => Object.keys(selectedGoods),
    [selectedGoods]
  );

  const pageGoodsIds = useMemo(
    () => goodsList.map((goods) => goods.id).filter(Boolean),
    [goodsList]
  );

  const selectedCountOnPage = useMemo(
    () => pageGoodsIds.filter((id) => Boolean(selectedGoods[id])).length,
    [pageGoodsIds, selectedGoods]
  );

  const allPageSelected =
    pageGoodsIds.length > 0 &&
    selectedCountOnPage === pageGoodsIds.length;

  const hasPartialPageSelection =
    selectedCountOnPage > 0 &&
    selectedCountOnPage < pageGoodsIds.length;

  const isJobActive = ["queued", "running"].includes(exportJob?.state);

  const canViewReport =
    canDo("view_opening_stock") || canDo("view_report");

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

  const fetchGoods = useCallback(
    async (
      keyword = debouncedSearch,
      pageNumber = page,
      size = pageSize,
      status = stockStatus
    ) => {
      setLoadingGoods(true);

      try {
        const response = await getGoods({
          search: keyword,
          page: pageNumber,
          page_size: size,
          stock_status: status,
        });

        const payload = response?.data || response;
        const results = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : [];

        const totalItems =
          payload?.total ?? payload?.count ?? results.length;

        setGoodsList(results);
        setTotal(totalItems);
        setTotalPages(
          payload?.total_pages ??
            Math.max(1, Math.ceil(totalItems / size))
        );
      } catch (error) {
        console.error(
          "GET GOODS ERROR:",
          error?.response?.data || error
        );
        alert("Không tải được danh mục vật tư hàng hóa");
        setGoodsList([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoadingGoods(false);
      }
    },
    [debouncedSearch, page, pageSize, stockStatus]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 700);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchGoods(debouncedSearch, page, pageSize, stockStatus);
  }, [
    debouncedSearch,
    fetchGoods,
    page,
    pageSize,
    stockStatus,
  ]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = hasPartialPageSelection;
    }
  }, [hasPartialPageSelection]);

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

  const handleToggleGoods = (goods) => {
    if (!goods?.id) {
      return;
    }

    setSelectedGoods((previous) => {
      if (previous[goods.id]) {
        const next = { ...previous };
        delete next[goods.id];
        return next;
      }

      if (Object.keys(previous).length >= MAX_GOODS) {
        alert(`Chỉ được chọn tối đa ${MAX_GOODS} mã vật tư.`);
        return previous;
      }

      return {
        ...previous,
        [goods.id]: goods,
      };
    });
  };

  const handleSelectAllCurrentPage = (event) => {
    const checked = event.target.checked;

    setSelectedGoods((previous) => {
      const next = { ...previous };

      if (!checked) {
        goodsList.forEach((goods) => {
          if (goods?.id) {
            delete next[goods.id];
          }
        });

        return next;
      }

      const newIds = goodsList.filter(
        (goods) => goods?.id && !next[goods.id]
      );

      if (Object.keys(next).length + newIds.length > MAX_GOODS) {
        alert(`Chỉ được chọn tối đa ${MAX_GOODS} mã vật tư.`);
        return previous;
      }

      newIds.forEach((goods) => {
        next[goods.id] = goods;
      });

      return next;
    });
  };

  const handleToggleFormat = (format) => {
    setFormats((previous) =>
      previous.includes(format)
        ? previous.filter((item) => item !== format)
        : [...previous, format]
    );
  };

  const handleCreateExport = async () => {
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một vật tư.");
      return;
    }

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
      const response = await createTheKhoExport({
        goods_ids: selectedIds,
        period_month: periodMonth,
        formats,
      });

      const job = unwrapResponseData(response);

      if (!job?.job_id) {
        throw new Error("API không trả về job_id.");
      }

      const initialJob = {
        ...job,
        percent: Number(job.percent) || 0,
        warnings: Array.isArray(job.warnings) ? job.warnings : [],
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

  const handleClearSelection = () => {
    setSelectedGoods({});
  };

  if (!canViewReport) {
    return (
      <div className="no-permission-page">
        Bạn không có quyền xem hoặc xuất báo cáo thẻ kho
      </div>
    );
  }

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

  return (
    <div className="the-kho-export-page">
      <div className="the-kho-filter-card">
        <div className="the-kho-filter-grid">
          <label className="the-kho-field">
            <span>Tháng thẻ kho</span>
            <input
              type="month"
              value={periodMonth}
              onChange={(event) => setPeriodMonth(event.target.value)}
              disabled={creatingExport}
            />
          </label>

          <div className="the-kho-field">
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

          <div className="the-kho-export-actions">
            <div className="the-kho-selected-summary">
              Đã chọn <strong>{selectedIds.length}</strong>/{MAX_GOODS} mã
            </div>

            {selectedIds.length > 0 && (
              <button
                type="button"
                className="the-kho-clear-btn"
                onClick={handleClearSelection}
                disabled={creatingExport}
              >
                Bỏ chọn
              </button>
            )}

            <button
              type="button"
              className="the-kho-export-btn"
              onClick={handleCreateExport}
              disabled={
                creatingExport ||
                selectedIds.length === 0 ||
                formats.length === 0
              }
            >
              {creatingExport
                ? "Đang tạo yêu cầu…"
                : isJobActive
                ? "Xem tiến độ"
                : "Xuất thẻ kho"}
            </button>
          </div>
        </div>
      </div>

<div className="the-kho-table-card">
  <div className="the-kho-table-toolbar">
    <div className="the-kho-toolbar-left">
      <input
        className="the-kho-search"
        placeholder="🔍  Tìm mã hoặc tên vật tư"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />

      <div className="the-kho-status-tabs">
        <button
          type="button"
          className={stockStatus === "all" ? "active" : ""}
          onClick={() => {
            setStockStatus("all");
            setPage(1);
          }}
        >
          Tất cả
        </button>

        <button
          type="button"
          className={stockStatus === "out_of_stock" ? "active" : ""}
          onClick={() => {
            setStockStatus("out_of_stock");
            setPage(1);
          }}
        >
          Hết hàng
        </button>
      </div>
    </div>

    <button
      type="button"
      className="the-kho-refresh-btn"
      title="Làm mới danh sách"
      onClick={() =>
        fetchGoods(
          debouncedSearch,
          page,
          pageSize,
          stockStatus
        )
      }
      disabled={loadingGoods}
    >
      <RiRefreshLine />
    </button>
  </div>

  {/* Phân trang đặt phía trên bảng */}
  <div className="the-kho-pagination the-kho-pagination-top">
    <div className="the-kho-pagination-summary">
      Tổng số: <strong>{total}</strong>

      <span className="the-kho-pagination-divider">|</span>

      Đã chọn: <strong>{selectedIds.length}</strong>
    </div>

    <div className="the-kho-pagination-controls">
      <span>Số dòng/trang</span>

      <select
        value={pageSize}
        onChange={(event) => {
          setPageSize(Number(event.target.value));
          setPage(1);
        }}
      >
        <option value={100}>100</option>
        <option value={200}>200</option>
        <option value={300}>300</option>
        <option value={500}>500</option>
        <option value={1000}>1000</option>
      </select>

      <span className="the-kho-page-range">
        {total === 0 ? 0 : (page - 1) * pageSize + 1}
        {" - "}
        {Math.min(page * pageSize, total)}
        {" / "}
        {total}
      </span>

      <span className="the-kho-page-number">
        Trang {page}/{totalPages}
      </span>

      <button
        type="button"
        title="Trang trước"
        disabled={page <= 1 || loadingGoods}
        onClick={() =>
          setPage((currentPage) => Math.max(1, currentPage - 1))
        }
      >
        ‹
      </button>

      <button
        type="button"
        title="Trang sau"
        disabled={page >= totalPages || loadingGoods}
        onClick={() =>
          setPage((currentPage) =>
            Math.min(totalPages, currentPage + 1)
          )
        }
      >
        ›
      </button>
    </div>
  </div>

  <div className="the-kho-table-wrapper">
    <table className="the-kho-table">
      <thead>
        <tr>
          <th className="the-kho-checkbox-col">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allPageSelected}
              onChange={handleSelectAllCurrentPage}
              aria-label="Chọn toàn bộ vật tư trên trang"
            />
          </th>

          <th>Mã hàng</th>
          <th>Tên hàng</th>
          <th>ĐVT chính</th>
        </tr>
      </thead>

      <tbody>
        {loadingGoods && goodsList.length === 0 && (
          <tr>
            <td colSpan={4} className="the-kho-empty-row">
              Đang tải dữ liệu…
            </td>
          </tr>
        )}

        {goodsList.map((goods) => (
          <tr
            key={goods.id}
            className={
              selectedGoods[goods.id]
                ? "the-kho-row selected"
                : "the-kho-row"
            }
            onClick={() => handleToggleGoods(goods)}
          >
            <td
              className="the-kho-checkbox-col"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={Boolean(selectedGoods[goods.id])}
                onChange={() => handleToggleGoods(goods)}
                aria-label={`Chọn ${goods.code || goods.name}`}
              />
            </td>

            <td>{goods.code || "-"}</td>
            <td>{goods.name || "-"}</td>
            <td>{getGoodsUnitName(goods)}</td>
          </tr>
        ))}

        {!loadingGoods && goodsList.length === 0 && (
          <tr>
            <td colSpan={4} className="the-kho-empty-row">
              Không có dữ liệu
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

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
                    {exportJob.total_goods ?? selectedIds.length}
                  </strong>
                </div>

                <div>
                  <span>Thời gian</span>
                  <strong>
                    {Number(exportJob.elapsed_seconds || 0).toFixed(1)} giây
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
                      Job vẫn có thể đang chạy. Bấm thử lại để tiếp tục
                      cập nhật tiến độ.
                    </span>
                  </div>
                  <button type="button" onClick={handleRetryPolling}>
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
                    {downloading ? "Đang tải…" : "Tải file ZIP"}
                  </button>
                ) : (
                  <div className="the-kho-no-download">
                    Không có file để tải vì tất cả mã được chọn đều bị
                    chặn.
                  </div>
                )}

                <p className="the-kho-retention-note">
                  File chỉ được lưu trong 24 giờ. Sau thời gian này cần
                  xuất lại.
                </p>
              </div>
            )}

            {exportJob.state === "failed" && (
              <div className="the-kho-job-error">
                <RiErrorWarningLine />
                <div>
                  <strong>Xuất thẻ kho thất bại</strong>
                  <span>
                    {exportJob.error || "Không xác định được nguyên nhân."}
                  </span>
                </div>
              </div>
            )}

            {exportJob.state === "cancelled" && (
              <div className="the-kho-job-error cancelled">
                <RiAlertLine />
                <div>
                  <strong>Yêu cầu đã bị hủy</strong>
                  <span>Job xuất thẻ kho không tiếp tục xử lý.</span>
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="the-kho-warnings-section">
                <div className="the-kho-warnings-heading">
                  <h3>Cảnh báo số liệu ({warnings.length})</h3>

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
                      key={`${warning.goods_id || "warning"}-${index}`}
                      className={`the-kho-warning-item ${
                        warning.severity === "blocking"
                          ? "blocking"
                          : "warning"
                      }`}
                    >
                      <div className="the-kho-warning-icon">
                        {warning.severity === "blocking" ? "⛔" : "⚠️"}
                      </div>

                      <div className="the-kho-warning-content">
                        <strong>
                          {[warning.goods_code, warning.goods_name]
                            .filter(Boolean)
                            .join(" - ") || "Cảnh báo"}
                        </strong>

                        <p>{warning.message}</p>

                        {Array.isArray(warning.details) &&
                          warning.details.length > 0 && (
                            <ul>
                              {warning.details.map((detail, detailIndex) => (
                                <li key={`${detail}-${detailIndex}`}>
                                  {detail}
                                </li>
                              ))}
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
                {isJobActive ? "Đóng và chạy ngầm" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TheKhoExportPage;
