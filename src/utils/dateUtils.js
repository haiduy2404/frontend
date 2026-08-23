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