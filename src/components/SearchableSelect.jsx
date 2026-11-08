import { useCallback, useEffect, useId, useRef, useState } from "react";

import "../styles/SearchableSelect.css";

/*
 * Ô chọn có ô tìm kiếm, nạp danh sách từ server theo từng lần gõ.
 *
 * Chống spam request bằng bốn lớp, cố ý xếp chồng:
 *
 *   1. CHỈ NẠP KHI MỞ. Đóng ô thì không có request nào, kể cả khi bộ lọc
 *      bên ngoài thay đổi.
 *   2. DEBOUNCE. Gõ "sua chua" là 8 phím; chờ người dùng ngừng gõ DEBOUNCE_MS
 *      rồi mới gọi — 8 phím thành 1 request.
 *   3. HUỶ REQUEST CŨ NGAY KHI GÕ TIẾP. Request đang bay cho chuỗi cũ bị huỷ
 *      (AbortController) ngay ở phím kế tiếp, không đợi lần tìm sau nổ — vì
 *      kết quả của chuỗi cũ đã chắc chắn vô dụng. Server không phải trả lời một
 *      câu hỏi không ai đợi.
 *   4. BỘ NHỚ ĐỆM. Cùng một chuỗi tìm (gõ rồi xoá về chuỗi cũ, đóng rồi mở lại)
 *      thì lấy lại kết quả đã có, không gọi lại. Khoá đệm gồm cả reloadKey, nên
 *      đổi kho hay khoảng ngày bên ngoài thì tự nhiên không trúng đệm cũ —
 *      không cần effect nào đi xoá.
 *
 * Thêm một chốt cho đúng chứ không phải cho nhanh: phản hồi về sai thứ tự
 * (request cũ về SAU request mới) bị bỏ qua, nên danh sách hiển thị luôn khớp
 * với chữ đang gõ.
 */

const DEBOUNCE_MS = 300;

const cacheKey = (reloadKey, text) => `${reloadKey}::${text.trim().toLowerCase()}`;

const isAbort = (error) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

function SearchableSelect({
  id,
  value,
  onChange,
  loadOptions,
  reloadKey,
  pageSize = 50,
  disabled = false,
  disabledHint = "",
  allLabel = "Tất cả",
  searchPlaceholder = "Gõ để tìm…",
}) {
  const generatedId = useId();
  const listId = `${id || generatedId}-list`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState("");

  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());
  // Khoá của request đang bay. Mở ô gọi tìm ngay, rồi debounce gọi lại đúng
  // chuỗi đó: mạng chậm hơn DEBOUNCE_MS thì request đầu chưa về, chưa có đệm —
  // không có chốt này thì lần hai sẽ huỷ lần đầu và gửi lại y hệt.
  const inflightKeyRef = useRef(null);

  const runSearch = useCallback(
    async (text) => {
      const key = cacheKey(reloadKey, text);
      const cached = cacheRef.current.get(key);

      if (cached) {
        setOptions(cached.options);
        setHasMore(cached.hasMore);
        setLoading(false);
        setError("");
        return;
      }

      if (inflightKeyRef.current === key) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;
      inflightKeyRef.current = key;

      setLoading(true);
      setError("");

      try {
        // Xin thêm một mục để biết còn mục nào bị cắt hay không, mà không phải
        // đổi API sang dạng phân trang.
        const rows = await loadOptions(text.trim(), controller.signal, pageSize + 1);
        if (requestId !== requestIdRef.current) return;

        const result = {
          options: rows.slice(0, pageSize),
          hasMore: rows.length > pageSize,
        };
        cacheRef.current.set(key, result);
        setOptions(result.options);
        setHasMore(result.hasMore);
      } catch (err) {
        if (isAbort(err) || requestId !== requestIdRef.current) return;
        console.error("SEARCHABLE SELECT LOAD ERROR:", err?.response?.data || err);
        setOptions([]);
        setHasMore(false);
        setError("Không tải được danh sách.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          inflightKeyRef.current = null;
        }
      }
    },
    [loadOptions, pageSize, reloadKey]
  );

  // Gõ chữ -> huỷ ngay request của chuỗi cũ, rồi chờ ngừng gõ mới tìm.
  useEffect(() => {
    if (!open) return undefined;

    // Không huỷ khi request đang bay chính là cho chuỗi này: lúc mới mở ô,
    // openDropdown vừa gửi tìm "" xong thì effect này cũng chạy với "".
    if (
      inflightKeyRef.current !== null &&
      inflightKeyRef.current !== cacheKey(reloadKey, query)
    ) {
      abortRef.current?.abort();
      inflightKeyRef.current = null;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => runSearch(query), DEBOUNCE_MS);

    return () => window.clearTimeout(timerRef.current);
  }, [open, query, runSearch, reloadKey]);

  // Bấm ra ngoài thì đóng.
  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Rời trang khi request còn bay -> huỷ nó.
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setHighlight(-1);
    // Nạp ngay khi mở, không đợi debounce: trúng đệm thì hiện tức thì, còn lần
    // debounce sau đó cũng trúng đệm nên không sinh request thứ hai.
    setOptions([]);
    runSearch("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const choose = (option) => {
    setSelectedLabel(option ? option.label : "");
    onChange(option);
    setOpen(false);
  };

  // Mục "Tất cả" đứng đầu, chiếm vị trí -1.
  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(highlight >= 0 ? options[highlight] : null);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  // selectedLabel chỉ được đọc khi đang có value, nên giá trị bị xoá từ bên ngoài
  // (nút "Đặt lại", đổi kho...) tự hiện về allLabel mà không cần đồng bộ state.
  const buttonText = disabled
    ? disabledHint || allLabel
    : value
    ? selectedLabel || "Đã chọn"
    : allLabel;

  return (
    <div className="searchable-select" ref={boxRef}>
      <button
        id={id}
        type="button"
        className="searchable-select-button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className={value ? "" : "searchable-select-placeholder"}>
          {buttonText}
        </span>
        <span className="searchable-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="searchable-select-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="searchable-select-input"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlight(-1);
            }}
            onKeyDown={handleKeyDown}
            aria-controls={listId}
            aria-autocomplete="list"
          />

          <ul id={listId} className="searchable-select-list" role="listbox">
            <li
              role="option"
              aria-selected={!value}
              className={`searchable-select-option searchable-select-all${
                highlight === -1 ? " is-highlighted" : ""
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(null);
              }}
            >
              {allLabel}
            </li>

            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={String(value) === String(option.value)}
                className={`searchable-select-option${
                  index === highlight ? " is-highlighted" : ""
                }${String(value) === String(option.value) ? " is-selected" : ""}`}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>

          <div className="searchable-select-status">
            {loading && "Đang tìm…"}
            {!loading && error}
            {!loading && !error && options.length === 0 && "Không có mục nào khớp."}
            {!loading && !error && hasMore &&
              `Đang hiện ${pageSize} mục đầu — gõ thêm để thu hẹp.`}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
