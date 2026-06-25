/**
 * Shared utility for computing Cộng / Thuế VAT / Tổng cộng on import orders.
 *
 * Algorithm (matches the authoritative list-page formula):
 *  - Cộng = Σ (qty × price)            — no per-line rounding
 *  - Thuế VAT X% = Σ roundMoney(qty × price × X/100)   per VAT-rate bucket
 *  - Tổng cộng = roundMoney(Cộng + Σ VAT buckets)
 *
 * @param {Array}    items
 * @param {Function} getQty   (item) => number  — raw quantity
 * @param {Function} getPrice (item) => number  — raw unit price
 * @param {Function} getVat   (item) => string  — VAT rate as string, e.g. "0","5","8","10"
 * @returns {{ totalAmount, vatSummary, vatAmount, grandTotal }}
 */
export function calculateImportOrderTotals(items, { getQty, getPrice, getVat }) {
  const roundMoney = (value) => Math.round((Number(value) || 0) + Number.EPSILON);

  const totalAmount = items.reduce((sum, item) => {
    return sum + getQty(item) * getPrice(item);
  }, 0);

  const vatSummary = items.reduce(
    (acc, item) => {
      const lineAmount = getQty(item) * getPrice(item);
      const rate = String(Number(getVat(item) || 0));
      acc[rate] = (acc[rate] || 0) + roundMoney(lineAmount * (Number(rate) / 100));
      return acc;
    },
    { 0: 0, 5: 0, 8: 0, 10: 0 }
  );

  const vatAmount =
    vatSummary["0"] + vatSummary["5"] + vatSummary["8"] + vatSummary["10"];

  const grandTotal = roundMoney(totalAmount + vatAmount);

  return { totalAmount, vatSummary, vatAmount, grandTotal };
}
