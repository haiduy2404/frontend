import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  createReportExport,
  downloadReportExport,
  getReportExportStatus,
  readBlobError,
  saveBlobFile,
} from "../services/reportExportService";
import "../styles/ReportExcelExportButton.css";

// Tiến độ chỉ nhảy sau mỗi lô 1000 dòng nên hỏi dày hơn 1.2 giây là vô ích.
const POLL_INTERVAL_MS = 1200;
// Lỗi mạng lẻ tẻ thì bỏ qua; quá ngưỡng này mới coi là mất kết nối.
const MAX_POLL_ERRORS = 5;

const STAGE_LABEL = {
  counting: "Đang đếm số dòng...",
  writing: "Đang ghi file Excel...",
  done: "Hoàn thành",
};

/**
 * Nút "Xuất Excel" dùng chung cho các trang báo cáo.
 *
 * BE xuất file bằng Celery nên luồng là: tạo job -> hỏi tiến độ -> tải file.
 * Component tự tải file ngay khi job xong, user không phải bấm thêm lần nữa;
 * nút "Tải lại" chỉ để dùng khi trình duyệt chặn lần tải tự động.
 *
 * props:
 *   report       "receipt-company-summary" | "release"
 *   getFilters   () => object — bộ lọc đang áp dụng trên màn hình
 *   disabled     chặn bấm khi chưa xem báo cáo
 *   fileName     tên file dự phòng nếu header không có
 */
export default function ReportExcelExportButton({
  report,
  getFilters,
  disabled = false,
  fileName = "bao-cao.xlsx",
  className = "",
}) {
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const errorCountRef = useRef(0);
  const activeJobRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Dừng hẳn khi rời trang: không thì component đã unmount mà timer vẫn gọi API.
  useEffect(() => () => clearTimer(), [clearTimer]);

  const schedule = useCallback(
    (jobId, delay = POLL_INTERVAL_MS) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        pollRef.current?.(jobId);
      }, delay);
    },
    [clearTimer]
  );

  const finish = useCallback(
    async (jobId, result) => {
      clearTimer();
      activeJobRef.current = null;

      const rows = result?.written_rows ?? 0;

      if (!result?.file_name) {
        setBusy(false);
        setErrorMessage("Job không tạo ra file nào.");
        return;
      }

      try {
        const file = await downloadReportExport(
          jobId,
          result.file_name || fileName
        );

        saveBlobFile(file);
        setDoneMessage(`Đã tải ${file.filename} (${rows} dòng).`);
      } catch (error) {
        // Trình duyệt chặn tải tự động, hoặc file đã bị dọn.
        setErrorMessage(
          await readBlobError(error, "Không tải được file Excel.")
        );
      } finally {
        setBusy(false);
      }
    },
    [clearTimer, fileName]
  );

  const poll = useCallback(
    async (jobId) => {
      if (activeJobRef.current !== jobId) {
        return;
      }

      try {
        const response = await getReportExportStatus(jobId);
        const data = response?.data || {};

        errorCountRef.current = 0;
        setJob(data);

        if (data.state === "done") {
          await finish(jobId, data.result);
          return;
        }

        if (data.state === "failed" || data.state === "cancelled") {
          clearTimer();
          activeJobRef.current = null;
          setBusy(false);
          setErrorMessage(data.error || "Xuất Excel thất bại.");
          return;
        }

        schedule(jobId);
      } catch (error) {
        errorCountRef.current += 1;

        if (errorCountRef.current >= MAX_POLL_ERRORS) {
          clearTimer();
          activeJobRef.current = null;
          setBusy(false);
          setErrorMessage(
            "Mất kết nối khi theo dõi tiến độ. Hãy thử xuất lại."
          );
          return;
        }

        schedule(jobId, POLL_INTERVAL_MS * 2);
      }
    },
    [clearTimer, finish, schedule]
  );

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const handleClick = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setDoneMessage("");
    setJob(null);
    errorCountRef.current = 0;

    try {
      const filters = getFilters ? getFilters() : {};
      const response = await createReportExport(report, filters);
      const created = response?.data;

      if (!created?.job_id) {
        throw new Error("API không trả về job_id.");
      }

      activeJobRef.current = created.job_id;
      setJob(created);
      // Hỏi lần đầu sớm: báo cáo nhỏ xong gần như tức thì.
      schedule(created.job_id, 400);
    } catch (error) {
      setBusy(false);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Không tạo được yêu cầu xuất Excel."
      );
    }
  }, [busy, getFilters, report, schedule]);

  const percent = Math.min(100, Math.max(0, Number(job?.percent) || 0));
  const stageLabel = STAGE_LABEL[job?.stage] || "Đang chuẩn bị...";

  return (
    <div className={`report-export ${className}`.trim()}>
      <button
        type="button"
        className="report-export-button"
        onClick={handleClick}
        disabled={disabled || busy}
        title={
          disabled
            ? "Hãy xem báo cáo trước khi xuất Excel"
            : "Xuất Excel theo đúng điều kiện lọc đang áp dụng"
        }
      >
        {busy ? "Đang xuất..." : "Xuất Excel"}
      </button>

      {busy && (
        <div className="report-export-progress" role="status">
          <div className="report-export-progress-bar">
            <span style={{ width: `${percent}%` }} />
          </div>

          <span className="report-export-progress-text">
            {stageLabel}
            {job?.total_rows
              ? ` ${job.processed_rows || 0}/${job.total_rows} dòng`
              : ""}
          </span>
        </div>
      )}

      {doneMessage && !busy && (
        <span className="report-export-done">{doneMessage}</span>
      )}

      {errorMessage && !busy && (
        <span className="report-export-error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
