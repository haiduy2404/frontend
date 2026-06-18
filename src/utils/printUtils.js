const STYLE_ID = "__dynamic_page_size__";

/**
 * Inject an @page size rule, call window.print(), then remove the rule.
 * This avoids CSS @page rules from different pages bleeding into each other.
 *
 * @param {string} width  - e.g. "210mm"
 * @param {string} height - e.g. "148mm"  (A5 landscape) or "297mm" (A4 portrait)
 */
export function printWithPageSize(width, height) {
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@page { size: ${width} ${height}; margin: 0; }`;

  window.print();

  // Remove after the print dialog closes so it doesn't affect other pages.
  const cleanup = () => {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
}

export const PAGE_SIZE = {
  A4_PORTRAIT: { width: "210mm", height: "297mm" },
  A5_LANDSCAPE: { width: "210mm", height: "148mm" },
};
