const STYLE_ID = "__dynamic_page_size__";

export function printWithPageSize(width, height) {
  let styleEl = document.getElementById(STYLE_ID);

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    @page {
      size: ${width} ${height};
      margin: 0;
    }
  `;

  const cleanup = () => {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  setTimeout(() => {
    window.print();
  }, 800);
}

export const PAGE_SIZE = {
  A4_PORTRAIT: { width: "210mm", height: "297mm" },
  A5_LANDSCAPE: { width: "210mm", height: "148mm" },
};