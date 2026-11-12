import { useEffect, useId, useMemo, useRef, useState } from "react";

import "../../styles/CompanyMultiSelect.css";

/*
 * Chọn nhiều công ty, ô tìm kiếm nằm NGAY TRONG dropdown.
 *
 * Danh sách công ty nhỏ (vài trăm) nên trang nạp một lần rồi lọc tại chỗ:
 * gõ là thấy ngay, không request nào theo từng phím, và tên các công ty đã
 * chọn không bao giờ mất khi đổi chuỗi tìm (vì luôn có đủ danh sách).
 *
 * Tìm không cần dấu, khớp tên, mã hoặc MST (bỏ qua dấu chấm, gạch, khoảng trắng
 * trong MST: "0100104891-001" khớp "0100104891001").
 */

const fold = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

function matches(company, query) {
  const text = fold(query);
  if (!text) return true;

  if (
    fold(company.supplier_name).includes(text) ||
    fold(company.supplier_code).includes(text) ||
    fold(company.tax_code).includes(text)
  ) {
    return true;
  }

  const digits = digitsOnly(query);
  // Chỉ dò MST theo chữ số khi người dùng gõ toàn số/ký tự phân cách.
  return (
    digits.length >= 3 &&
    /^[\d\s.\-/]+$/.test(query.trim()) &&
    digitsOnly(company.tax_code).includes(digits)
  );
}

function CompanyMultiSelect({
  id,
  companies,
  value,
  onChange,
  loading = false,
  error = "",
  onRetry,
  placeholder = "Tất cả công ty",
}) {
  const generatedId = useId();
  const baseId = id || generatedId;
  const listId = `${baseId}-list`;

  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(() => new Set(value.map(String)), [value]);

  const byId = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => map.set(String(company.id), company));
    return map;
  }, [companies]);

  const filtered = useMemo(
    () => companies.filter((company) => matches(company, query)),
    [companies, query]
  );

  // Đóng khi bấm ra ngoài.
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const openPanel = () => {
    setOpen(true);
    setHighlight(0);
    // Đợi panel render rồi mới focus ô tìm.
    window.requestAnimationFrame(() => searchRef.current?.focus());
  };

  const closePanel = ({ restoreFocus = true } = {}) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  };

  const toggle = (companyId) => {
    const key = String(companyId);
    onChange(
      selected.has(key)
        ? value.filter((item) => String(item) !== key)
        : [...value, companyId]
    );
  };

  // "Chọn tất cả" chỉ tác động lên các dòng đang hiện (kết quả tìm), giữ nguyên
  // các công ty đã chọn từ lần tìm trước.
  const filteredIds = filtered.map((company) => company.id);
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((companyId) => selected.has(String(companyId)));
  const someFilteredSelected =
    !allFilteredSelected &&
    filteredIds.some((companyId) => selected.has(String(companyId)));

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const drop = new Set(filteredIds.map(String));
      onChange(value.filter((item) => !drop.has(String(item))));
      return;
    }

    const next = [...value];
    filteredIds.forEach((companyId) => {
      if (!selected.has(String(companyId))) next.push(companyId);
    });
    onChange(next);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const company = filtered[highlight];
      if (company) toggle(company.id);
    }
  };

  // Giữ dòng đang chọn bằng bàn phím trong tầm nhìn.
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${baseId}-opt-${highlight}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [baseId, highlight, open]);

  const selectedNames = value
    .map((companyId) => byId.get(String(companyId))?.supplier_name)
    .filter(Boolean);

  let triggerText = placeholder;
  if (value.length === 1) {
    triggerText = selectedNames[0] || "1 công ty";
  } else if (value.length > 1) {
    triggerText = `${value.length} công ty: ${selectedNames.slice(0, 2).join(", ")}${
      value.length > 2 ? "…" : ""
    }`;
  }

  return (
    <div className="company-multiselect" ref={wrapperRef}>
      <div
        className={`company-multiselect-trigger${open ? " is-open" : ""}${
          value.length ? " has-value" : ""
        }`}
      >
        <button
          ref={triggerRef}
          type="button"
          id={baseId}
          className="company-multiselect-trigger-button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => (open ? closePanel() : openPanel())}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
              event.preventDefault();
              openPanel();
            }
          }}
        >
          <span className="company-multiselect-trigger-text" title={selectedNames.join("\n")}>
            {triggerText}
          </span>
          <span className="company-multiselect-caret" aria-hidden="true">
            ▾
          </span>
        </button>

        {value.length > 0 && (
          <button
            type="button"
            className="company-multiselect-clear"
            aria-label="Bỏ chọn tất cả công ty"
            title="Bỏ chọn tất cả công ty"
            onClick={() => onChange([])}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="company-multiselect-panel">
          <div className="company-multiselect-search">
            <span aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              type="text"
              value={query}
              placeholder="Tìm theo tên công ty hoặc MST…"
              aria-label="Tìm công ty"
              aria-controls={listId}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlight(0);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            {query && (
              <button
                type="button"
                aria-label="Xoá chữ tìm"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                ×
              </button>
            )}
          </div>

          {loading ? (
            <div className="company-multiselect-state">Đang tải danh sách công ty…</div>
          ) : error ? (
            <div className="company-multiselect-state is-error" role="alert">
              <span>{error}</span>
              {onRetry && (
                <button type="button" onClick={onRetry}>
                  Thử lại
                </button>
              )}
            </div>
          ) : (
            <>
              {filtered.length > 0 && (
                <label className="company-multiselect-option is-all">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(node) => {
                      if (node) node.indeterminate = someFilteredSelected;
                    }}
                    onChange={toggleAllFiltered}
                  />
                  <span>
                    {query
                      ? `Chọn tất cả ${filtered.length} kết quả tìm`
                      : `Chọn tất cả ${filtered.length} công ty`}
                  </span>
                </label>
              )}

              <ul
                id={listId}
                className="company-multiselect-list"
                role="listbox"
                aria-multiselectable="true"
              >
                {filtered.length === 0 && (
                  <li className="company-multiselect-state">
                    {query
                      ? `Không có công ty nào khớp “${query.trim()}”.`
                      : "Chưa có công ty nào."}
                  </li>
                )}

                {filtered.map((company, index) => {
                  const isSelected = selected.has(String(company.id));
                  return (
                    <li
                      key={company.id}
                      id={`${baseId}-opt-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`company-multiselect-option${
                        index === highlight ? " is-highlighted" : ""
                      }${isSelected ? " is-selected" : ""}`}
                      onMouseEnter={() => setHighlight(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => toggle(company.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <span>
                        <strong>{company.supplier_name || "—"}</strong>
                        <small>MST: {company.tax_code || "—"}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="company-multiselect-footer">
            <span>
              {value.length === 0
                ? "Chưa chọn — báo cáo lấy tất cả công ty"
                : `Đã chọn ${value.length} công ty`}
            </span>

            <div>
              {value.length > 0 && (
                <button
                  type="button"
                  className="is-link"
                  onClick={() => onChange([])}
                >
                  Bỏ chọn
                </button>
              )}
              <button
                type="button"
                className="is-primary"
                onClick={() => closePanel()}
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyMultiSelect;
