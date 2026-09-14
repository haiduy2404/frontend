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


function ReleaseOrderAttachments({
  releaseId,
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
     LOAD
  ========================================================= */

  const loadAttachments =
    async () => {
      if (!releaseId) {
        setAttachments([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await attachmentService.getAttachments(
            ATTACHMENT_TICKET_TYPES.RELEASE,
            releaseId
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
  }, [releaseId]);


  /* =========================================================
     UPLOAD
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
          event.target.files ||
          []
        );

      event.target.value = "";

      if (
        !releaseId ||
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
            ATTACHMENT_TICKET_TYPES.RELEASE,
            releaseId,
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
        await attachmentService.deleteAttachment(
          attachment.id
        );

        setAttachments(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                attachment.id
            )
        );

        setNotice(
          "Đã xóa file."
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
     FORMAT DATE
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


  if (!releaseId) {
    return null;
  }


  return (
    <section className="release-order-side-card">
      <div className="release-order-side-title">
        TÀI LIỆU LIÊN QUAN ({attachments.length})
      </div>


      {/* =============================
          UPLOAD
      ============================= */}

      {canManage && (
        <div className="release-order-attachment-upload">
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
            className="release-order-attachment-upload-button"
            disabled={
              uploading
            }
            onClick={
              handleOpenFilePicker
            }
          >
            {uploading ? (
              <RiLoader4Line className="release-order-loading-icon" />
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
            <div className="release-order-attachment-progress">
              <div
                className="release-order-attachment-progress-bar"
                style={{
                  width:
                    `${uploadPercent}%`,
                }}
              />
            </div>
          )}

          <small className="release-order-attachment-hint">
            Tối đa 25 MB/file
          </small>
        </div>
      )}


      {/* =============================
          MESSAGE
      ============================= */}

      {error && (
        <div className="release-order-attachment-message error">
          {error}
        </div>
      )}

      {notice && (
        <div className="release-order-attachment-message success">
          {notice}
        </div>
      )}


      {/* =============================
          LIST
      ============================= */}

      {loading ? (
        <div className="release-order-attachment-empty">
          <RiLoader4Line className="release-order-loading-icon" />

          <span>
            Đang tải tài liệu...
          </span>
        </div>
      ) : attachments.length === 0 ? (
        <div className="release-order-attachment-empty">
          <RiFileTextLine />

          <span>
            Chưa có tài liệu đính kèm
          </span>
        </div>
      ) : (
        <div className="release-order-document-list">
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
                  className="release-order-document-item"
                >
                  <RiFileTextLine />


                  <div className="release-order-attachment-info">
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


                  <div className="release-order-attachment-actions">
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
                        <RiLoader4Line className="release-order-loading-icon" />
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
                          <RiLoader4Line className="release-order-loading-icon" />
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


export default ReleaseOrderAttachments;