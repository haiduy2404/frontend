import { useEffect, useMemo, useState } from "react";
import { RiCloseLine, RiDownload2Line, RiSearchLine } from "react-icons/ri";

import "../../styles/NegativeStockModal.css";

/*
 * Danh sách các (mã, kho) mà số tồn đầu kỳ SẼ GHI bị âm — lý do một lần trích
 * xuất bị chặn.
 *
 * Trước đây trang in thẳng câu message của API, vốn nối mọi dòng lại: 412 dòng
 * thành 75 nghìn ký tự trong một đoạn văn, tràn màn hình và đẩy nút đóng ra
 * ngoài. Giờ API trả một câu tóm tắt + danh sách có cấu trúc, và modal này:
 *
 *   - giới hạn chiều cao; tiêu đề và chân cố định, chỉ danh sách cuộn — nút
 *     đóng luôn nhìn thấy (đóng được cả bằng Esc và bấm ra ngoài);
 *   - gom theo kho, mỗi mã một thẻ, mã phiếu hiện thành chip;
 *   - lọc ngay trên máy theo mã / tên / mã phiếu, không phân biệt dấu;
 *   - tải CSV để kế toán cầm đi sửa phiếu.
 */

const CHIPS_SHOWN = 8;

const fold = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

const formatQuantity = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 5 }).format(
    Number(value) || 0
  );

/** "2026-10" | "2026-10-01" -> "10/2026" */
const formatPeriod = (value) => {
  const [year, month] = String(value || "").split("-");
  return year && month ? `${month}/${year}` : value || "";
};

const previousPeriod = (value) => {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month) return "";
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function downloadCsv(lines, period) {
  const header = ["Mã kho", "Tên kho", "Mã vật tư", "Tên vật tư", "Số lượng âm", "Lệnh xuất", "Điều chuyển"];
  const rows = lines.map((line) => [
    line.warehouse_code,
    line.warehouse_name,
    line.goods_code,
    line.goods_name,
    line.quantity,
    (line.release_codes || []).join(" "),
    (line.transfer_codes || []).join(" "),
  ]);
  // BOM để Excel đọc đúng tiếng Việt.
  const body = "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ton-am-${String(period || "").slice(0, 7) || "ky"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CodeChips({ label, codes }) {
  const [expanded, setExpanded] = useState(false);
  if (!codes?.length) return null;

  const shown = expanded ? codes : codes.slice(0, CHIPS_SHOWN);
  const hidden = codes.length - shown.length;

  return (
    <div className="negative-stock-codes">
      <span className="negative-stock-codes-label">
        {label} ({codes.length})
      </span>
      <div className="negative-stock-chips">
        {shown.map((code) => (
          <span key={code} className="negative-stock-chip">
            {code}
          </span>
        ))}
        {hidden > 0 && (
          <button
            type="button"
            className="negative-stock-chip negative-stock-chip-more"
            onClick={() => setExpanded(true)}
          >
            +{hidden} phiếu
          </button>
        )}
        {expanded && codes.length > CHIPS_SHOWN && (
          <button
            type="button"
            className="negative-stock-chip negative-stock-chip-more"
            onClick={() => setExpanded(false)}
          >
            Thu gọn
          </button>
        )}
      </div>
    </div>
  );
}

function NegativeStockModal({ open, period, summary, lines = [], onClose }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const needle = fold(query).trim();
    if (!needle) return lines;
    return lines.filter((line) =>
      fold(
        [
          line.goods_code,
          line.goods_name,
          line.warehouse_code,
          ...(line.release_codes || []),
          ...(line.transfer_codes || []),
        ].join(" ")
      ).includes(needle)
    );
  }, [lines, query]);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((line) => {
      const key = line.warehouse_id || line.warehouse_code;
      if (!map.has(key)) {
        map.set(key, {
          code: line.warehouse_code,
          name: line.warehouse_name,
          lines: [],
        });
      }
      map.get(key).lines.push(line);
    });
    return [...map.values()];
  }, [filtered]);

  if (!open) return null;

  const warehouseCount = new Set(lines.map((line) => line.warehouse_code)).size;
  const ticketCount = new Set(
    lines.flatMap((line) => [...(line.release_codes || []), ...(line.transfer_codes || [])])
  ).size;
  const sourceMonth = formatPeriod(previousPeriod(period));

  return (
    <div
      className="negative-stock-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="negative-stock-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="negative-stock-title"
      >
        <header className="negative-stock-header">
          <div className="negative-stock-header-icon" aria-hidden="true">
            ⛔
          </div>
          <div className="negative-stock-header-text">
            <h3 id="negative-stock-title">
              Chưa trích xuất được tồn đầu kỳ {formatPeriod(period)}
            </h3>
            <p>{summary}</p>
            <div className="negative-stock-counts">
              <span className="blocking">{lines.length} mã âm</span>
              <span>{warehouseCount} kho</span>
              <span>{ticketCount} phiếu liên quan</span>
            </div>
          </div>
          <button
            type="button"
            className="negative-stock-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <RiCloseLine />
          </button>
        </header>

        <div className="negative-stock-toolbar">
          <div className="negative-stock-search">
            <RiSearchLine aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Lọc theo mã, tên vật tư hoặc mã phiếu (không cần dấu)"
            />
          </div>
          {query && (
            <span className="negative-stock-filter-count">
              {filtered.length}/{lines.length} dòng
            </span>
          )}
        </div>

        <div className="negative-stock-body">
          {groups.length === 0 && (
            <div className="negative-stock-empty">Không có dòng nào khớp.</div>
          )}

          {groups.map((group) => (
            <section key={group.code} className="negative-stock-group">
              <h4>
                {group.name} ({group.code})
                <span>{group.lines.length} mã</span>
              </h4>

              <ul className="negative-stock-list">
                {group.lines.map((line) => (
                  <li key={`${line.warehouse_id}-${line.goods_id}`} className="negative-stock-item">
                    <div className="negative-stock-item-head">
                      <div>
                        <strong>{line.goods_code}</strong>
                        <span className="negative-stock-goods-name">{line.goods_name}</span>
                      </div>
                      <span className="negative-stock-qty" title="Số lượng sẽ ghi vào tồn đầu kỳ">
                        {formatQuantity(line.quantity)}
                      </span>
                    </div>

                    <CodeChips label="Lệnh xuất" codes={line.release_codes} />
                    <CodeChips label="Điều chuyển đi" codes={line.transfer_codes} />

                    {!line.release_codes?.length && !line.transfer_codes?.length && (
                      <p className="negative-stock-note">
                        Không có phiếu xuất hay điều chuyển nào trong tháng {sourceMonth} —
                        số âm đến từ tồn đầu kỳ {sourceMonth}.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="negative-stock-footer">
          <p>
            Sửa hoặc huỷ các phiếu trên, hoặc bổ sung phiếu nhập trong tháng {sourceMonth},
            rồi trích xuất lại.
          </p>
          <div className="negative-stock-actions">
            <button
              type="button"
              className="negative-stock-secondary"
              onClick={() => downloadCsv(lines, period)}
            >
              <RiDownload2Line aria-hidden="true" />
              Tải danh sách (.csv)
            </button>
            <button type="button" className="negative-stock-primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default NegativeStockModal;
