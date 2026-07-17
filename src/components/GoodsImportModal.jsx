import { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiFileExcel2Line, RiUploadCloud2Line } from "react-icons/ri";
import { importGoodsExcel } from "../services/goodsService";
import "../styles/GoodsImportModal.css";

const ACCEPTED_EXTENSIONS = [".xls", ".xlsx"];

// idle -> uploading -> processing -> done | error
function GoodsImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [processPercent, setProcessPercent] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const processTimerRef = useRef(null);

  const isRunning = phase === "uploading" || phase === "processing";

  useEffect(() => {
    return () => clearInterval(processTimerRef.current);
  }, []);

  const isAcceptedFile = (candidate) => {
    const name = (candidate?.name || "").toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const handlePickFile = (candidate) => {
    if (!candidate) return;

    if (!isAcceptedFile(candidate)) {
      alert("Chỉ hỗ trợ file Excel (.xls, .xlsx)");
      return;
    }

    setFile(candidate);
    setPhase("idle");
    setResult(null);
    setErrorMessage("");
    setUploadPercent(0);
    setProcessPercent(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (isRunning) return;
    handlePickFile(e.dataTransfer.files?.[0]);
  };

  // Server xử lý trong 1 request nên không có tiến độ thật cho giai đoạn
  // ghi dữ liệu — mô phỏng thanh chạy dần tới 90%, nhảy 100% khi có kết quả.
  const startProcessingAnimation = () => {
    setProcessPercent(5);
    processTimerRef.current = setInterval(() => {
      setProcessPercent((prev) => (prev < 90 ? prev + Math.max(0.5, (90 - prev) / 20) : prev));
    }, 200);
  };

  const stopProcessingAnimation = (finalValue) => {
    clearInterval(processTimerRef.current);
    processTimerRef.current = null;
    setProcessPercent(finalValue);
  };

  const handleImport = async () => {
    if (!file || isRunning) return;

    const formData = new FormData();
    formData.append("file", file);

    setPhase("uploading");
    setUploadPercent(0);
    setProcessPercent(0);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await importGoodsExcel(formData, (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadPercent(percent);
        if (percent >= 100) {
          setPhase((prev) => {
            if (prev === "uploading") {
              startProcessingAnimation();
              return "processing";
            }
            return prev;
          });
        }
      });

      stopProcessingAnimation(100);
      setUploadPercent(100);
      setResult(response?.data || response);
      setPhase("done");
      onSuccess?.();
    } catch (error) {
      console.error("IMPORT GOODS ERROR:", error.response?.data || error);
      stopProcessingAnimation(0);

      const data = error.response?.data;
      const detail =
        data?.message && data.message !== "Success" ? data.message : null;
      const fieldError =
        data?.data && typeof data.data === "object"
          ? Object.values(data.data).flat().join("; ")
          : null;
      setErrorMessage(fieldError || detail || "Import thất bại, vui lòng thử lại.");
      setPhase("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPhase("idle");
    setResult(null);
    setErrorMessage("");
    setUploadPercent(0);
    setProcessPercent(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSkipped = result
    ? (result.skipped_duplicate_db || 0) +
      (result.skipped_duplicate_in_file || 0) +
      (result.skipped_incomplete || 0) +
      (result.skipped_invalid || 0)
    : 0;

  return (
    <div className="goods-import-overlay" onMouseDown={(e) => {
      if (e.target === e.currentTarget && !isRunning) onClose();
    }}>
      <div className="goods-import-modal">
        <div className="goods-import-header">
          <h2>Nhập danh mục vật tư từ Excel</h2>
          <button
            className="goods-import-close"
            onClick={onClose}
            disabled={isRunning}
            title="Đóng"
          >
            <RiCloseLine />
          </button>
        </div>

        <div className="goods-import-body">
          <p className="goods-import-hint">
            File cần có các cột: <strong>Mã vật tư</strong>, <strong>Tên vật tư</strong>,{" "}
            <strong>Đơn vị tính</strong> (tùy chọn: <strong>Ghi chú</strong>). Các dòng
            thiếu dữ liệu và mã vật tư đã tồn tại sẽ được bỏ qua.
          </p>

          <div
            className={`goods-import-dropzone ${dragOver ? "drag-over" : ""} ${
              isRunning ? "disabled" : ""
            }`}
            onClick={() => !isRunning && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isRunning) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              hidden
              onChange={(e) => handlePickFile(e.target.files?.[0])}
            />

            {file ? (
              <div className="goods-import-file">
                <RiFileExcel2Line className="file-icon" />
                <div className="file-meta">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatSize(file.size)}</span>
                </div>
              </div>
            ) : (
              <div className="goods-import-placeholder">
                <RiUploadCloud2Line className="upload-icon" />
                <span>Kéo thả file vào đây hoặc bấm để chọn file</span>
                <span className="placeholder-sub">Hỗ trợ .xls, .xlsx</span>
              </div>
            )}
          </div>

          {(isRunning || phase === "done") && (
            <div className="goods-import-progress-group">
              <div className="goods-import-progress-item">
                <div className="progress-label">
                  <span>Tải file lên server</span>
                  <span>{uploadPercent}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>

              <div className="goods-import-progress-item">
                <div className="progress-label">
                  <span>Kiểm tra & ghi dữ liệu</span>
                  <span>{Math.round(processPercent)}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${
                      phase === "processing" ? "progress-fill-active" : ""
                    }`}
                    style={{ width: `${processPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="goods-import-error">{errorMessage}</div>
          )}

          {phase === "done" && result && (
            <div className="goods-import-result">
              <div className="result-cards">
                <div className="result-card result-created">
                  <span className="result-number">{result.created_goods ?? 0}</span>
                  <span className="result-label">Vật tư tạo mới</span>
                </div>
                <div className="result-card result-units">
                  <span className="result-number">{result.created_units ?? 0}</span>
                  <span className="result-label">ĐVT tạo mới</span>
                </div>
                <div className="result-card result-skipped">
                  <span className="result-number">{totalSkipped}</span>
                  <span className="result-label">Dòng bỏ qua</span>
                </div>
                <div className="result-card result-scanned">
                  <span className="result-number">{result.rows_scanned ?? 0}</span>
                  <span className="result-label">Dòng đã quét</span>
                </div>
              </div>

              {totalSkipped > 0 && (
                <ul className="result-skip-detail">
                  {result.skipped_duplicate_db > 0 && (
                    <li>{result.skipped_duplicate_db} dòng trùng mã đã có trong hệ thống</li>
                  )}
                  {result.skipped_duplicate_in_file > 0 && (
                    <li>{result.skipped_duplicate_in_file} dòng trùng mã ngay trong file</li>
                  )}
                  {result.skipped_incomplete > 0 && (
                    <li>{result.skipped_incomplete} dòng ghi chú / thiếu dữ liệu bắt buộc</li>
                  )}
                  {result.skipped_invalid > 0 && (
                    <li>{result.skipped_invalid} dòng dữ liệu không hợp lệ</li>
                  )}
                </ul>
              )}

              {result.duplicate_codes?.length > 0 && (
                <details className="result-collapsible">
                  <summary>
                    Mã bị trùng đã bỏ qua ({result.skipped_duplicate_db})
                  </summary>
                  <div className="result-codes">{result.duplicate_codes.join(", ")}</div>
                </details>
              )}

              {result.warnings?.length > 0 && (
                <details className="result-collapsible">
                  <summary>Cảnh báo ({result.warnings.length})</summary>
                  <ul className="result-warnings">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="goods-import-footer">
          {phase === "done" ? (
            <>
              <button className="secondary-btn" onClick={handleReset}>
                Nhập file khác
              </button>
              <button className="primary-btn" onClick={onClose}>
                Hoàn tất
              </button>
            </>
          ) : (
            <>
              <button className="secondary-btn" onClick={onClose} disabled={isRunning}>
                Hủy
              </button>
              <button
                className="primary-btn"
                onClick={handleImport}
                disabled={!file || isRunning}
              >
                {isRunning ? "Đang nhập..." : "Bắt đầu nhập"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoodsImportModal;
