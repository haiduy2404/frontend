import axiosInstance from "./authService";
/* ============================================================
   CONSTANTS
============================================================ */

export const ATTACHMENT_TICKET_TYPES = {
  RECEIPT: "receipt",
  RELEASE: "release",
  TRANSFER: "transfer",
};

export const ATTACHMENT_MAX_FILE_SIZE_MB = 25;
export const ATTACHMENT_MAX_FILES = 20;

const BLOCKED_EXTENSIONS = [
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".com",
  ".cpl",
  ".scr",
  ".pif",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".psm1",
  ".vbs",
  ".vbe",
  ".js",
  ".jse",
  ".jar",
  ".app",
  ".dmg",
  ".deb",
  ".rpm",
  ".so",
  ".dll",
];


/* ============================================================
   GET ATTACHMENTS
============================================================ */

export async function getAttachments(
  ticketType,
  ticketId
) {
  if (!ticketType || !ticketId) {
    throw new Error(
      "Thiếu loại phiếu hoặc ID phiếu."
    );
  }

  const response =
    await axiosInstance.get(
      `/inventory/attachments/${ticketType}/${ticketId}`
    );

  return response.data;
}


/* ============================================================
   UPLOAD ATTACHMENTS
============================================================ */

export async function uploadAttachments(
  ticketType,
  ticketId,
  files,
  onUploadProgress
) {
  if (!ticketType || !ticketId) {
    throw new Error(
      "Thiếu loại phiếu hoặc ID phiếu."
    );
  }

  const fileList =
    files instanceof File
      ? [files]
      : Array.from(files || []);

  if (fileList.length === 0) {
    throw new Error(
      "Vui lòng chọn ít nhất một file."
    );
  }

  const formData =
    new FormData();

  fileList.forEach((file) => {
    formData.append(
      "files",
      file
    );
  });

  const response =
    await axiosInstance.post(
      `/inventory/attachments/${ticketType}/${ticketId}`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },

        onUploadProgress:
          onUploadProgress
            ? (event) => {
                if (!event.total) {
                  return;
                }

                const percent =
                  Math.round(
                    (event.loaded * 100) /
                      event.total
                  );

                onUploadProgress(
                  percent,
                  event
                );
              }
            : undefined,
      }
    );

  return response.data;
}


/* ============================================================
   GET DOWNLOAD URL
============================================================ */

export async function getAttachmentDownloadUrl(
  attachmentId
) {
  if (!attachmentId) {
    throw new Error(
      "Thiếu ID file đính kèm."
    );
  }

  const response =
    await axiosInstance.get(
      `/inventory/attachments/${attachmentId}/download`
    );

  return response.data;
}


/* ============================================================
   DOWNLOAD ATTACHMENT
============================================================ */

export async function downloadAttachment(
  attachmentId
) {
  const response =
    await getAttachmentDownloadUrl(
      attachmentId
    );

  const url =
    response?.data?.url;

  if (!url) {
    throw new Error(
      "Không lấy được đường dẫn tải file."
    );
  }

  window.location.href = url;

  return response;
}


/* ============================================================
   DELETE ATTACHMENT
============================================================ */

export async function deleteAttachment(
  attachmentId
) {
  if (!attachmentId) {
    throw new Error(
      "Thiếu ID file đính kèm."
    );
  }

  const response =
    await axiosInstance.delete(
      `/inventory/attachments/${attachmentId}`
    );

  return response.data;
}


/* ============================================================
   VALIDATE FILE
============================================================ */

export function validateAttachmentFiles(
  files
) {
  const fileList =
    files instanceof File
      ? [files]
      : Array.from(files || []);

  if (fileList.length === 0) {
    return {
      valid: false,
      message:
        "Vui lòng chọn ít nhất một file.",
    };
  }

  if (
    fileList.length >
    ATTACHMENT_MAX_FILES
  ) {
    return {
      valid: false,
      message:
        `Chỉ được tải tối đa ${ATTACHMENT_MAX_FILES} file mỗi lần.`,
    };
  }

  const maxBytes =
    ATTACHMENT_MAX_FILE_SIZE_MB *
    1024 *
    1024;

  for (const file of fileList) {
    if (file.size === 0) {
      return {
        valid: false,
        message:
          `File "${file.name}" đang rỗng.`,
      };
    }

    if (
      file.size >
      maxBytes
    ) {
      return {
        valid: false,
        message:
          `File "${file.name}" vượt quá ${ATTACHMENT_MAX_FILE_SIZE_MB} MB.`,
      };
    }

    const fileName =
      file.name.toLowerCase();

    const blocked =
      BLOCKED_EXTENSIONS.some(
        (extension) =>
          fileName.endsWith(
            extension
          )
      );

    if (blocked) {
      return {
        valid: false,
        message:
          `File "${file.name}" không được phép tải lên.`,
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
}


/* ============================================================
   FORMAT FILE SIZE
============================================================ */

export function formatAttachmentSize(
  bytes
) {
  const size =
    Number(bytes || 0);

  if (size <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.min(
      Math.floor(
        Math.log(size) /
          Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    size /
    1024 ** index;

  return `${value.toLocaleString(
    "vi-VN",
    {
      maximumFractionDigits:
        index === 0
          ? 0
          : 1,
    }
  )} ${units[index]}`;
}


/* ============================================================
   ERROR MESSAGE
============================================================ */

export function getAttachmentErrorMessage(
  error
) {
  const status =
    error?.response?.status;

  if (status === 503) {
    return (
      "Kho lưu file đang bảo trì, " +
      "vui lòng thử lại sau."
    );
  }

  if (status === 404) {
    return (
      error?.response?.data?.message ||
      "File hoặc phiếu không còn tồn tại."
    );
  }

  if (status === 403) {
    return (
      error?.response?.data?.message ||
      "Bạn không có quyền thực hiện thao tác này."
    );
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    "Có lỗi xảy ra khi xử lý file đính kèm."
  );
}


/* ============================================================
   SERVICE
============================================================ */

const attachmentService = {
  getAttachments,
  uploadAttachments,
  getAttachmentDownloadUrl,
  downloadAttachment,
  deleteAttachment,

  validateAttachmentFiles,
  formatAttachmentSize,
  getAttachmentErrorMessage,
};

export default attachmentService;