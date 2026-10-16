const pad2 = (value) => String(value).padStart(2, "0");

/**
 * Kỳ kế toán / kỳ kho.
 * UI: MM/YYYY
 */
export const getCurrentTerms = () => {
  const today = new Date();

  return `${pad2(today.getMonth() + 1)}/${today.getFullYear()}`;
};

/**
 * Ngày hiện tại.
 * UI: DD/MM/YYYY
 */
export const getTodayViDate = () => {
  const today = new Date();

  return `${pad2(today.getDate())}/${pad2(
    today.getMonth() + 1
  )}/${today.getFullYear()}`;
};

/**
 * Backend:
 * 2026-08-21
 * 2026-08-21T10:20:30
 *
 * UI:
 * 21/08/2026
 */
export const formatISOToViDate = (value) => {
  if (!value) return "";

  const text = String(value).trim();

  if (!text) return "";

  // Đã là DD/MM/YYYY hoặc D/M/YYYY
  const viMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (viMatch) {
    const [, day, month, year] = viMatch;

    return `${pad2(day)}/${pad2(month)}/${year}`;
  }

  // ISO / datetime
  const dateOnly = text.split("T")[0];

  const isoMatch = dateOnly.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (!isoMatch) {
    return text;
  }

  const [, year, month, day] = isoMatch;

  return `${pad2(day)}/${pad2(month)}/${year}`;
};

/**
 * Giá trị của input type="date":
 * YYYY-MM-DD
 *
 * UI DD/MM/YYYY -> YYYY-MM-DD
 */
export const convertViDateToPickerDate = (value) => {
  if (!value) return "";

  const text = String(value).trim();

  if (!text) return "";

  const viMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (viMatch) {
    const [, day, month, year] = viMatch;

    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  // Backend ISO / datetime
  const dateOnly = text.split("T")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  return "";
};

/**
 * input type="date":
 * YYYY-MM-DD
 *
 * UI:
 * DD/MM/YYYY
 */
export const formatPickerDateToViDate = (value) => {
  return formatISOToViDate(value);
};

/**
 * Cho phép nhập:
 * 2/8
 * 02/08
 * 2/8/2026
 * 02/08/2026
 *
 * Sau blur:
 * 02/08/2026
 */
export const autoFillYear = (value) => {
  if (!value) return "";

  const text = String(value).trim();

  if (!text) return "";

  const match = text.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/
  );

  if (!match) {
    return formatISOToViDate(text);
  }

  const [, day, month, inputYear] = match;

  const year =
    inputYear || String(new Date().getFullYear());

  return `${pad2(day)}/${pad2(month)}/${year}`;
};

/**
 * UI:
 * DD/MM/YYYY
 *
 * Backend:
 * YYYY-MM-DD
 */
export const convertDateToISO = (value) => {
  if (!value) return null;

  const text = String(value).trim();

  if (!text) return null;

  const viMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (viMatch) {
    const [, day, month, year] = viMatch;

    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const dateOnly = text.split("T")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  return null;
};

export const formatViDateLong = (
  value,
  fallback = "Ngày      tháng      năm"
) => {
  const formatted = formatISOToViDate(value);

  if (!formatted) return fallback;

  const [day, month, year] = formatted.split("/");

  if (!day || !month || !year) {
    return fallback;
  }

  return `Ngày ${day} tháng ${month} năm ${year}`;
};
/**
 * Đọc một mốc thời gian do API trả về, thành Date.
 *
 * BẮT BUỘC đi qua hàm này, KHÔNG dùng thẳng new Date(value).
 *
 * DRF của dự án cấu hình DATETIME_FORMAT = "%d/%m/%Y %H:%M:%S" (xem
 * config/date_format.py), nên mọi mốc thời gian API trả về là chuỗi DD/MM/YYYY
 * chứ không phải ISO. Đưa chuỗi đó cho new Date() thì trình duyệt đọc theo kiểu
 * Mỹ MM/DD và sinh ra hai lỗi:
 *
 *   "05/10/2026 14:30:00"  ->  10/05/2026   (5 tháng 10 thành 10 tháng 5)
 *   "25/12/2026 09:15:00"  ->  Invalid Date (ngày > 12 thì mất hẳn)
 *
 * Lỗi thứ hai nguy hiểm hơn: hơn nửa số ngày trong tháng rơi vào đó và UI chỉ
 * hiện dấu gạch ngang, không ai biết là đã mất dữ liệu.
 *
 * Nên ở đây ngày tháng được tách bằng regex rồi dựng Date từ từng phần — không
 * nhờ trình duyệt đoán định dạng. Chỉ chuỗi ISO (năm đứng trước) mới giao lại
 * cho new Date, vì ISO không mơ hồ.
 *
 * @returns {Date|null} null khi không đọc được.
 */
export const parseApiDateTime = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) return null;

  const viMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (viMatch) {
    const [, day, month, year, hour, minute, second] = viMatch;

    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour || 0),
      Number(minute || 0),
      Number(second || 0)
    );

    // Chặn ngày không tồn tại (31/02): Date tự nhảy sang tháng sau, trả ra một
    // ngày trông hợp lệ nhưng sai.
    if (
      parsed.getDate() !== Number(day) ||
      parsed.getMonth() !== Number(month) - 1
    ) {
      return null;
    }

    return parsed;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Mốc thời gian của API -> "HH:mm DD/MM/YYYY".
 *
 * Dùng cho dòng "Tạo bởi ... lúc ..." ở đầu các trang chi tiết chứng từ.
 */
export const formatApiDateTimeVi = (value, fallback = "-") => {
  const date = parseApiDateTime(value);

  if (!date) return fallback;

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())} ${pad2(
    date.getDate()
  )}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/**
 * Mốc thời gian của API -> "DD/MM/YYYY" (bỏ phần giờ).
 *
 * Dùng cho danh sách file đính kèm, nơi chỉ cần ngày.
 */
export const formatApiDateVi = (value, fallback = "-") => {
  const date = parseApiDateTime(value);

  if (!date) return fallback;

  return `${pad2(date.getDate())}/${pad2(
    date.getMonth() + 1
  )}/${date.getFullYear()}`;
};
