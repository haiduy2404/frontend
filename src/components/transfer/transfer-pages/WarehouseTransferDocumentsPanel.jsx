import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  RiDeleteBin6Line,
  RiDownload2Line,
  RiFileTextLine,
  RiLoader4Line,
  RiUpload2Line,
} from "react-icons/ri";

import attachmentService, {
  ATTACHMENT_TICKET_TYPES,
} from "../../../services/attachmentService";

import { formatApiDateVi } from "../../../utils/dateUtils";


export default function WarehouseTransferDocumentsPanel({
  transferId,
  canManage = false,
}) {
  const fileInputRef =
    useRef(null);

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadPercent,
    setUploadPercent,
  ] = useState(0);

  const [
    downloadingId,
    setDownloadingId,
  ] = useState(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");


  /* =========================================================
     LOAD ATTACHMENTS
  ========================================================= */

  const loadAttachments =
    async () => {
      if (!transferId) {
        setAttachments([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await attachmentService.getAttachments(
            ATTACHMENT_TICKET_TYPES.TRANSFER,
            transferId
          );

        setAttachments(
          response?.data?.results ||
          []
        );
      } catch (err) {
        setAttachments([]);

        setError(
          attachmentService.getAttachmentErrorMessage(
            err
          )
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    setError("");
    setNotice("");

    loadAttachments();
  }, [transferId]);


  /* =========================================================
     OPEN FILE PICKER
  ========================================================= */

  const handleOpenFilePicker =
    () => {
      if (
        !canManage ||
        uploading
      ) {
        return;
      }

      fileInputRef.current?.click();
    };


  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleFileChange =
    async (event) => {
      const files =
        Array.from(
          event.target.files ||
          []
        );

      /*
       * Reset input để nếu user chọn lại
       * đúng file cũ thì onChange vẫn chạy.
       */
      event.target.value = "";

      if (
        !transferId ||
        files.length === 0
      ) {
        return;
      }

      const validation =
        attachmentService.validateAttachmentFiles(
          files
        );

      if (!validation.valid) {
        setError(
          validation.message
        );

        return;
      }

      setUploading(true);
      setUploadPercent(0);

      setError("");
      setNotice("");

      try {
        const response =
          await attachmentService.uploadAttachments(
            ATTACHMENT_TICKET_TYPES.TRANSFER,
            transferId,
            files,
            (percent) => {
              setUploadPercent(
                percent
              );
            }
          );

        const uploaded =
          response?.data?.uploaded ||
          [];

        const duplicates =
          response?.data?.duplicates ||
          [];

        if (
          duplicates.length > 0
        ) {
          setNotice(
            `${uploaded.length} file đã tải lên. ` +
            `${duplicates.length} file đã có trong phiếu, đã bỏ qua.`
          );
        } else {
          setNotice(
            response?.message ||
            `Đã tải lên ${uploaded.length} file.`
          );
        }

        await loadAttachments();
      } catch (err) {
        setError(
          attachmentService.getAttachmentErrorMessage(
            err
          )
        );
      } finally {
        setUploading(false);
        setUploadPercent(0);
      }
    };


  /* =========================================================
     DOWNLOAD
  ========================================================= */

  const handleDownload =
    async (attachment) => {
      if (!attachment?.id) {
        return;
      }

      setDownloadingId(
        attachment.id
      );

      setError("");

      try {
        await attachmentService.downloadAttachment(
          attachment.id
        );
      } catch (err) {
        setError(
          attachmentService.getAttachmentErrorMessage(
            err
          )
        );
      } finally {
        setDownloadingId(
          null
        );
      }
    };


  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete =
    async (attachment) => {
      if (
        !canManage ||
        !attachment?.id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa file "${attachment.original_name}"?`
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        attachment.id
      );

      setError("");
      setNotice("");

      try {
        const response =
          await attachmentService.deleteAttachment(
            attachment.id
          );

        /*
         * File đã bị xóa logic khỏi BE,
         * bỏ ngay khỏi danh sách FE.
         */
        setAttachments(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                attachment.id
            )
        );

        const data =
          response?.data;

        if (
          data?.purged === false
        ) {
          setNotice(
            `Đã xóa file. File được giữ lại ${
              data?.purge_after_days ?? 7
            } ngày trước khi xóa hẳn.`
          );
        } else {
          setNotice(
            "Đã xóa file khỏi hệ thống."
          );
        }
      } catch (err) {
        setError(
          attachmentService.getAttachmentErrorMessage(
            err
          )
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  // Ngày của API là chuỗi DD/MM/YYYY; new Date() đọc theo kiểu Mỹ nên "05/10"
  // thành 10/05, còn ngày > 12 thì ra Invalid Date. Xem parseApiDateTime.
  const formatDate = (value) =>
    formatApiDateVi(value, "");


  /* =========================================================
     NO TRANSFER
  ========================================================= */

  if (!transferId) {
    return null;
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="warehouse-transfer-side-card warehouse-transfer-documents-card">
      <div className="warehouse-transfer-documents-title">
        <h3>
          TÀI LIỆU LIÊN QUAN
        </h3>

        <span className="warehouse-transfer-documents-count">
          {attachments.length}
        </span>
      </div>


      {/* =====================================================
          UPLOAD
      ===================================================== */}

      {canManage && (
        <div className="warehouse-transfer-document-upload">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={
              handleFileChange
            }
          />

          <button
            type="button"
            className="warehouse-transfer-document-upload-btn"
            disabled={
              uploading
            }
            onClick={
              handleOpenFilePicker
            }
          >
            {uploading ? (
              <RiLoader4Line className="warehouse-transfer-spin" />
            ) : (
              <RiUpload2Line />
            )}

            <span>
              {uploading
                ? `Đang tải ${uploadPercent}%`
                : "Thêm tài liệu"}
            </span>
          </button>


          {uploading && (
            <div className="warehouse-transfer-document-progress">
              <div
                className="warehouse-transfer-document-progress-bar"
                style={{
                  width:
                    `${uploadPercent}%`,
                }}
              />
            </div>
          )}


          <small className="warehouse-transfer-document-hint">
            Tối đa 25 MB/file, 20 file/lần
          </small>
        </div>
      )}


      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {error && (
        <div className="warehouse-transfer-document-message error">
          {error}
        </div>
      )}

      {notice && (
        <div className="warehouse-transfer-document-message success">
          {notice}
        </div>
      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="warehouse-transfer-document-empty">
          <RiLoader4Line className="warehouse-transfer-spin" />

          <span>
            Đang tải tài liệu...
          </span>
        </div>
      ) : attachments.length === 0 ? (
        /* ===================================================
           EMPTY
        =================================================== */

        <div className="warehouse-transfer-document-empty">
          <RiFileTextLine />

          <span>
            Chưa có tài liệu đính kèm
          </span>
        </div>
      ) : (
        /* ===================================================
           LIST
        =================================================== */

        <div className="warehouse-transfer-document-list">
          {attachments.map(
            (attachment) => {
              const downloading =
                downloadingId ===
                attachment.id;

              const deleting =
                deletingId ===
                attachment.id;

              return (
                <div
                  key={
                    attachment.id
                  }
                  className="warehouse-transfer-document-item"
                >
                  <div className="warehouse-transfer-document-file-icon">
                    <RiFileTextLine />
                  </div>


                  <div className="warehouse-transfer-document-info">
                    <strong
                      title={
                        attachment.original_name
                      }
                    >
                      {
                        attachment.original_name
                      }
                    </strong>

                    <small>
                      {attachmentService.formatAttachmentSize(
                        attachment.size_bytes
                      )}

                      {attachment.created_at
                        ? ` • ${formatDate(
                            attachment.created_at
                          )}`
                        : ""}
                    </small>
                  </div>


                  <div className="warehouse-transfer-document-actions">
                    {/* DOWNLOAD */}

                    <button
                      type="button"
                      title="Tải xuống"
                      disabled={
                        downloading
                      }
                      onClick={() =>
                        handleDownload(
                          attachment
                        )
                      }
                    >
                      {downloading ? (
                        <RiLoader4Line className="warehouse-transfer-spin" />
                      ) : (
                        <RiDownload2Line />
                      )}
                    </button>


                    {/* DELETE */}

                    {canManage && (
                      <button
                        type="button"
                        className="danger"
                        title="Xóa file"
                        disabled={
                          deleting
                        }
                        onClick={() =>
                          handleDelete(
                            attachment
                          )
                        }
                      >
                        {deleting ? (
                          <RiLoader4Line className="warehouse-transfer-spin" />
                        ) : (
                          <RiDeleteBin6Line />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}