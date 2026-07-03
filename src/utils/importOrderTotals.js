/**
 * Shared utility for computing Cộng / Thuế VAT / Tổng cộng on import orders.
 *
 * Algorithm:
 *
 * method = "BY_LINE"
 *  - Cộng = Σ (qty × price) — no per-line rounding
 *  - Thuế VAT X% = Σ roundMoney(qty × price × X/100) per VAT-rate bucket
 *  - Tổng cộng = roundMoney(Cộng + Σ VAT buckets)
 *
 * method = "BY_TOTAL"
 *  - Cộng = Σ (qty × price) — no per-line rounding
 *  - Thuế VAT X% = roundMoney(Σ amount of VAT X% × X/100)
 *  - Tổng cộng = roundMoney(Cộng + Σ VAT buckets)
 *
 * @param {Array}    items
 * @param {Function} getQty   (item) => number  — raw quantity
 * @param {Function} getPrice (item) => number  — raw unit price
 * @param {Function} getVat   (item) => string  — VAT rate as string, e.g. "0","5","8","10"
 * @param {String}   method   "BY_LINE" | "BY_TOTAL"
 * @returns {{ totalAmount, vatSummary, vatAmount, grandTotal }}
 */
export function calculateImportOrderTotals(
  items,
  { getQty, getPrice, getVat, method = "BY_LINE" }
) {
  const roundMoney = (value) =>
    Math.round((Number(value) || 0) + Number.EPSILON);

  const totalAmount = items.reduce((sum, item) => {
    return sum + getQty(item) * getPrice(item);
  }, 0);

  const vatSummary =
    method === "BY_TOTAL"
      ? calculateVatByTotal(items, { getQty, getPrice, getVat, roundMoney })
      : calculateVatByLine(items, { getQty, getPrice, getVat, roundMoney });

  const vatAmount =
    vatSummary["0"] + vatSummary["5"] + vatSummary["8"] + vatSummary["10"];

  const grandTotal = roundMoney(totalAmount + vatAmount);

  return { totalAmount, vatSummary, vatAmount, grandTotal };
}

function calculateVatByLine(items, { getQty, getPrice, getVat, roundMoney }) {
  return items.reduce(
    (acc, item) => {
      const lineAmount = getQty(item) * getPrice(item);
      const rate = String(Number(getVat(item) || 0));

      acc[rate] =
        (acc[rate] || 0) + roundMoney(lineAmount * (Number(rate) / 100));

      return acc;
    },
    { 0: 0, 5: 0, 8: 0, 10: 0 }
  );
}

function calculateVatByTotal(items, { getQty, getPrice, getVat, roundMoney }) {
  const amountSummary = items.reduce(
    (acc, item) => {
      const lineAmount = getQty(item) * getPrice(item);
      const rate = String(Number(getVat(item) || 0));

      acc[rate] = (acc[rate] || 0) + lineAmount;

      return acc;
    },
    { 0: 0, 5: 0, 8: 0, 10: 0 }
  );

  return {
    0: roundMoney(amountSummary["0"] * 0),
    5: roundMoney(amountSummary["5"] * 0.05),
    8: roundMoney(amountSummary["8"] * 0.08),
    10: roundMoney(amountSummary["10"] * 0.1),
  };
}