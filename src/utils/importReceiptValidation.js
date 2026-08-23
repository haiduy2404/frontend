export const validateImportReceipt = ({
  headerData,
  items,
}) => {
  if (!headerData?.inward_date) {
    return "Vui lòng nhập ngày nhập kho";
  }

  if (!headerData?.warehouse_id) {
    return "Vui lòng chọn kho nhập";
  }

  if (
    !headerData?.supplier_code ||
    !headerData?.supplier_name ||
    !headerData?.tax_code
  ) {
    return "Vui lòng nhập đầy đủ thông tin nhà cung cấp";
  }

  const hasGoods = (items || []).some(
    (item) => item.goods_id
  );

  if (!hasGoods) {
    return "Vui lòng chọn ít nhất một hàng hóa";
  }

  return "";
};