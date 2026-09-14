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


function ImportOrderAttachments({
  receiptId,
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
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    downloadingId,
    setDownloadingId,
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
      if (!receiptId) {
        setAttachments([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await attachmentService.getAttachments(
            ATTACHMENT_TICKET_TYPES.RECEIPT,
            receiptId
          );

        setAttachments(
          response?.data?.results || []
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
    setNotice("");
    setError("");

    loadAttachments();
  }, [receiptId]);


  /* =========================================================
     SELECT / UPLOAD
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


  const handleFileChange =
    async (event) => {
      const files =
        Array.from(
          event.target.files || []
        );

      /*
       * Reset input ngay.
       * Nhờ vậy chọn lại đúng file vừa chọn
       * vẫn phát sinh onChange.
       */
      event.target.value = "";

      if (
        !receiptId ||
        !files.length
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
            ATTACHMENT_TICKET_TYPES.RECEIPT,
            receiptId,
            files,
            (percent) => {
              setUploadPercent(
                percent
              );
            }
          );

        const uploaded =
          response?.data?.uploaded || [];

        const duplicates =
          response?.data?.duplicates || [];

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
        /*
         * API chỉ lấy presigned URL.
         * Browser sẽ tải trực tiếp từ MinIO.
         */
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

        /*
         * Xóa luôn khỏi UI,
         * không cần đợi gọi list lại.
         */
        setAttachments(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                attachment.id
            )
        );
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
     DATE
     ========================================================= */

  const formatDate =
    (value) => {
      if (!value) {
        return "";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return date.toLocaleDateString(
        "vi-VN"
      );
    };


  /* =========================================================
     RENDER
     ========================================================= */

  if (!receiptId) {
    return null;
  }


  return (
    <section className="import-order-side-card">
      <div className="import-order-side-title import-order-attachment-title">
        <span>
          TÀI LIỆU LIÊN QUAN
        </span>

        <span className="import-order-attachment-count">
          {attachments.length}
        </span>
      </div>


      {/* =================================
          UPLOAD
      ================================= */}
      {canManage && (
        <div className="import-order-attachment-upload">
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
            className="import-order-attachment-upload-button"
            disabled={
              uploading
            }
            onClick={
              handleOpenFilePicker
            }
          >
            {uploading ? (
              <RiLoader4Line className="import-action-loading-icon" />
            ) : (
              <RiUpload2Line />
            )}

            <span>
              {uploading
                ? `Đang tải ${uploadPercent}%`
                : "Thêm tài liệu"}
            </span>
          </button>

          <div className="import-order-attachment-hint">
            Tối đa 25 MB/file, 20 file/lần
          </div>

          {uploading && (
            <div className="import-order-attachment-progress">
              <div
                className="import-order-attachment-progress-bar"
                style={{
                  width:
                    `${uploadPercent}%`,
                }}
              />
            </div>
          )}
        </div>
      )}


      {/* =================================
          MESSAGE
      ================================= */}
      {error && (
        <div className="import-order-attachment-message error">
          {error}
        </div>
      )}

      {notice && (
        <div className="import-order-attachment-message success">
          {notice}
        </div>
      )}


      {/* =================================
          CONTENT
      ================================= */}
      {loading ? (
        <div className="import-order-attachment-loading">
          <RiLoader4Line className="import-action-loading-icon" />

          <span>
            Đang tải tài liệu...
          </span>
        </div>
      ) : attachments.length === 0 ? (
        <div className="import-order-attachment-empty">
          <RiFileTextLine />

          <span>
            Chưa có tài liệu đính kèm
          </span>
        </div>
      ) : (
        <div className="import-order-document-list">
          {attachments.map(
            (attachment) => {
              const deleting =
                deletingId ===
                attachment.id;

              const downloading =
                downloadingId ===
                attachment.id;

              return (
                <div
                  key={
                    attachment.id
                  }
                  className="import-order-document-item import-order-attachment-item"
                >
                  <RiFileTextLine className="import-order-attachment-file-icon" />

                  <div className="import-order-attachment-info">
                    <strong
                      title={
                        attachment.original_name
                      }
                    >
                      {
                        attachment.original_name
                      }
                    </strong>

                    <span>
                      {attachmentService.formatAttachmentSize(
                        attachment.size_bytes
                      )}

                      {attachment.created_at
                        ? ` • ${formatDate(
                            attachment.created_at
                          )}`
                        : ""}
                    </span>
                  </div>


                  <div className="import-order-attachment-actions">
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
                        <RiLoader4Line className="import-action-loading-icon" />
                      ) : (
                        <RiDownload2Line />
                      )}
                    </button>


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
                          <RiLoader4Line className="import-action-loading-icon" />
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


export default ImportOrderAttachments;