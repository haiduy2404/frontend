/**
 * Shared utility for computing Cộng / Thuế VAT / Tổng cộng on import orders.
 *
 * Cách tính:
 * - Cộng = Σ (qty × price)
 * - Gom tiền hàng theo từng mức VAT: 0%, 5%, 8%, 10%
 * - Thuế VAT X% = roundMoney(Σ amount của nhóm VAT X% × X/100)
 * - Tổng cộng = roundMoney(Cộng + Σ VAT buckets)
 *
 * @param {Array}    items
 * @param {Function} getQty   (item) => number
 * @param {Function} getPrice (item) => number
 * @param {Function} getVat   (item) => string
 * @returns {{ totalAmount, vatSummary, vatAmount, grandTotal }}
 */
export function calculateImportOrderTotals(
  items,
  { getQty, getPrice, getVat }
) {
  const roundMoney = (value) =>
    Math.round((Number(value) || 0) + Number.EPSILON);

  const totalAmount = items.reduce((sum, item) => {
    return sum + getQty(item) * getPrice(item);
  }, 0);

  const amountSummary = items.reduce(
    (acc, item) => {
      const lineAmount = getQty(item) * getPrice(item);
      const rate = String(Number(getVat(item) || 0));

      acc[rate] = (acc[rate] || 0) + lineAmount;

      return acc;
    },
    { 0: 0, 5: 0, 8: 0, 10: 0 }
  );

  const vatSummary = {
    0: 0,
    5: roundMoney(amountSummary["5"] * 0.05),
    8: roundMoney(amountSummary["8"] * 0.08),
    10: roundMoney(amountSummary["10"] * 0.1),
  };

  const vatAmount =
    vatSummary["0"] + vatSummary["5"] + vatSummary["8"] + vatSummary["10"];

  const grandTotal = roundMoney(totalAmount + vatAmount);

  return {
    totalAmount,
    vatSummary,
    vatAmount,
    grandTotal,
  };
}