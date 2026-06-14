import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../../styles/ImportReceiptPrintVatForm.css";
import { getWarehouseReceiptByCode } from "../../../services/warehouseReceiptService";
import mauthongtu from "../../../assets/mauthongtu.png";
import { getMetadata } from "../../../services/metadataService";

function ImportReceiptPrintVatForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metadataMap, setMetadataMap] = useState({});

  const location = useLocation();
  const signerThuKhoFromInput = location.state?.signerThuKho || "";

  const normalizeKey = (value) => {
    return String(value || "").trim().toLowerCase();
  };

  const getMetadataValue = (key) => {
    return metadataMap[normalizeKey(key)] || "";
  };

  useEffect(() => {
  const fetchMetadata = async () => {
      try {
        const response = await getMetadata();
        const data = response?.data || response;

        const results = Array.isArray(data) ? data : [];

        const mapped = results.reduce((acc, item) => {
          acc[normalizeKey(item.key)] = item.value || "";
          return acc;
        }, {});

        setMetadataMap(mapped);
      } catch (error) {
        console.error("LOAD METADATA ERROR:", error.response?.data || error);
        setMetadataMap({});
      }
    };

    fetchMetadata();
  }, []);

  const signerThuKhoNhapKho = getMetadataValue("THỦ KHO_NHẬP KHO");
  const signerNguoiLapPhieu = signerThuKhoNhapKho;
  const signerThuKho = signerThuKhoFromInput;
  const signerPhongKhvt = getMetadataValue("PHÒNG KHVT");
  const signerKeToanTruong = getMetadataValue("KẾ TOÁN TRƯỞNG");
  const signerGiamDoc = "";

  const formatReceiptDateText = (value) => {
    if (!value) return "Ngày      tháng      năm";

    const dateOnly = String(value).split("T")[0];
    const [day, month, year] = dateOnly.split("-");

    if (!day || !month || !year) return "Ngày      tháng      năm";

    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getWarehouseReceiptByCode(id);
        setReceipt(response?.data || response);
      } catch (error) {
        console.error("LOAD IMPORT RECEIPT VAT PRINT ERROR:", error.response?.data || error);
        alert("Không tải được dữ liệu phiếu nhập kho");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="import-receipt-print-loading">Đang tải dữ liệu...</div>;
  }

  const formatViNumber = (value, fractionDigits = 2) => {
  const number = Number(value || 0);

    return number.toLocaleString("vi-VN", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
  };

  const readThreeDigits = (number, hasHundredsBefore = false) => {
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  const hundred = Math.floor(number / 100);
  const ten = Math.floor((number % 100) / 10);
  const unit = number % 10;

  let result = "";

  if (hundred > 0) {
    result += `${units[hundred]} trăm`;
  } else if (hasHundredsBefore && (ten > 0 || unit > 0)) {
    result += "không trăm";
  }

  if (ten > 1) {
    result += `${result ? " " : ""}${units[ten]} mươi`;

    if (unit === 1) result += " mốt";
    else if (unit === 5) result += " lăm";
    else if (unit > 0) result += ` ${units[unit]}`;
  } else if (ten === 1) {
    result += `${result ? " " : ""}mười`;

    if (unit === 5) result += " lăm";
    else if (unit > 0) result += ` ${units[unit]}`;
  } else if (unit > 0) {
    if (result) result += " linh";
    result += `${result ? " " : ""}${units[unit]}`;
  }

  return result;
};

const inspectionCodeFromReceiptCode = String(id || "")
    .replace(/\D/g, "")
    .slice(-2);

const numberToVietnameseText = (value) => {
  const number = Math.round(Number(value || 0));

  if (number === 0) return "Không đồng chẵn.";

  const scales = ["", "nghìn", "triệu", "tỷ"];
  const groups = [];

  let temp = number;

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];

    if (group === 0) continue;

    const hasHundredsBefore = i < groups.length - 1;
    const text = readThreeDigits(group, hasHundredsBefore);

    parts.push(`${text}${scales[i] ? ` ${scales[i]}` : ""}`);
  }

  const result = parts.join(" ").replace(/\s+/g, " ").trim();

  return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng chẵn.`;
};

    const formatViDate = (value) => {
        if (!value) return "........";

        const dateOnly = String(value).split("T")[0];
        const [day, month, year] = dateOnly.split("-");

        if (!day || !month || !year) return "........";

        return `${day}/${month}/${year}`;
  };

    const toTitleCaseVi = (value) => {
    if (!value) return "";

    const keepUppercaseWords = [
        "TNHH",
        "MTV",
        "CP",
        "TM",
        "DV",
        "XD",
        "SX",
        "VT",
        "JSC",
        "LLC",
    ];

    return String(value)
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => {
        const upperWord = word.toUpperCase();

        if (keepUppercaseWords.includes(upperWord)) {
            return upperWord;
        }

        return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
    };

    const invoiceCode = receipt?.invoice_code || "";
    const invoiceDate = formatViDate(receipt?.invoice_date);
    const receiptDateText = formatReceiptDateText(receipt?.receipt_date);
    const warehouseName = receipt?.warehouse?.name || receipt?.warehouse_name || "";
    const companyName = toTitleCaseVi(
        receipt?.company?.name || receipt?.company_name || ""
    );
    const deliveryPerson = receipt?.delivery_persion || "";

    const DEFAULT_ITEM_ROWS = 10;

    const inventoryLines = receipt?.inventory_lines || [];

    const displayRows = Array.from({
        length: Math.max(DEFAULT_ITEM_ROWS, inventoryLines.length),
    }).map((_, index) => inventoryLines[index] || null);

    const totalAmount = inventoryLines.reduce((sum, line) => {
    const quantity = Number(line?.original_quantity || line?.quantity || 0);
    const unitPrice = Number(line?.unit_price || 0);

    return sum + quantity * unitPrice;
}, 0);

    const roundMoney = (value) =>
      Math.round((Number(value) || 0) + Number.EPSILON);

    const vatSummary = inventoryLines.reduce(
      (acc, line) => {
        const quantity = Number(
          line?.original_quantity || line?.quantity || 0
        );

        const unitPrice = Number(line?.unit_price || 0);

        const amount = quantity * unitPrice;

        const rate = String(
          Number(line?.vat || line?.vat_rate || 0)
        );

        const vat = roundMoney(
          amount * (Number(rate) / 100)
        );

        acc[rate] = (acc[rate] || 0) + vat;

        return acc;
      },
      {
        0: 0,
        5: 0,
        8: 0,
        10: 0,
      }
    );

    const totalVat =
      vatSummary["0"] +
      vatSummary["5"] +
      vatSummary["8"] +
      vatSummary["10"];

    const grandTotal = totalAmount + totalVat;



  return (
    <div className="import-receipt-print-page">
      <div className="import-receipt-print-toolbar">
        <button onClick={() => navigate(-1)}>Quay lại</button>
        <button onClick={() => window.print()}>In</button>
      </div>
    <div className="import-receipt-print-scroll">
      <div className="import-receipt-paper">
        <div className="receipt-header">
          <div className="receipt-left-header">
            <div>
              <strong>Đơn vị : CN TOA XE ĐN</strong>
            </div>
            <div>
              <strong>Bộ phận : KHVT</strong>
            </div>
          </div>

          <div className="receipt-title-block">
            <h1>PHIẾU NHẬP KHO</h1>
            <div className="receipt-date">{receiptDateText}</div>
            <div className="receipt-code">Số: {id || "...................."}</div>
          </div>

          <div className="receipt-right-header">
            <img
              src={mauthongtu}
              alt="Mẫu số 01-VT"
              className="receipt-template-image"
            />
          </div>
        </div>

        <div className="receipt-info">
          <div className="receipt-info-row">
            <span>Họ và tên người giao: </span>
            <strong>{signerThuKhoNhapKho}</strong>
          </div>

        <div className="receipt-info-row">
            <span>
                Theo biên bản kiểm nghiệm số {inspectionCodeFromReceiptCode} và hóa đơn số{" "}
                {invoiceCode} ngày {invoiceDate} của{" "}
                <strong>{companyName}</strong>
            </span>
        </div>

          <div className="receipt-info-row receipt-warehouse-row">
            <span>
              Nhập tại kho: <strong>{warehouseName}</strong>
            </span>

            <span>
              Địa điểm: Chi Nhánh Toa Xe Đà Nẵng
            </span>
          </div>
        </div>

        <table className="receipt-vat-table">
            <colgroup>
                <col className="receipt-col-stt" />
                <col className="receipt-col-name" />
                <col className="receipt-col-code" />
                <col className="receipt-col-unit" />
                <col className="receipt-col-doc-qty" />
                <col className="receipt-col-real-qty" />
                <col className="receipt-col-price" />
                <col className="receipt-col-amount" />
            </colgroup>

            <thead>
                <tr>
                <th rowSpan={2}>TT</th>
                <th rowSpan={2}>
                    Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa
                </th>
                <th rowSpan={2}>Mã số</th>
                <th rowSpan={2}>Đơn vị tính</th>
                <th colSpan={2}>Số lượng</th>
                <th rowSpan={2}>Đơn giá</th>
                <th rowSpan={2}>Thành tiền</th>
                </tr>

                <tr>
                <th>Theo chứng từ</th>
                <th>Thực nhập</th>
                </tr>

                <tr className="receipt-symbol-row">
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                </tr>
            </thead>

            <tbody>
                {displayRows.map((line, index) => {
                const quantity = Number(line?.original_quantity || line?.quantity || 0);
                const unitPrice = Number(line?.unit_price || 0);
                const amount = quantity * unitPrice;

                return (
                    <tr key={index} className="receipt-item-row">
                    <td className="receipt-center-cell">{line ? index + 1 : ""}</td>

                    <td className="receipt-goods-name-cell">
                        {line?.goods_name || ""}
                    </td>

                    <td className="receipt-center-cell">
                        {line?.goods_code || ""}
                    </td>

                    <td className="receipt-center-cell">
                        {line?.unit_name || ""}
                    </td>

                    <td className="receipt-quantity-cell">
                        {line ? formatViNumber(quantity, 2) : ""}
                    </td>

                    <td className="receipt-quantity-cell">
                        {line ? formatViNumber(quantity, 2) : ""}
                    </td>

                    <td className="receipt-money-cell">
                        {line ? formatViNumber(unitPrice, 0) : ""}
                    </td>

                    <td className="receipt-money-cell">
                        {line ? formatViNumber(amount, 0) : ""}
                    </td>
                    </tr>
                );
                })}

                <tr className="receipt-total-row">
                    <td colSpan={7} className="receipt-total-label">
                        Cộng tiền hàng
                    </td>
                    <td className="receipt-total-value">
                        {formatViNumber(totalAmount, 0)}
                    </td>
                    </tr>

                    {Object.entries(vatSummary)
                      .filter(([, value]) => value > 0)
                      .map(([rate, value]) => (
                        <tr key={rate} className="receipt-total-row">
                          <td colSpan={7} className="receipt-total-label">
                            VAT ({rate}%)
                          </td>
                          <td className="receipt-total-value">
                            {formatViNumber(value, 0)}
                          </td>
                        </tr>
                    ))}

                    <tr className="receipt-total-row">
                    <td colSpan={7} className="receipt-total-label">
                        Tổng cộng
                    </td>
                    <td className="receipt-total-value">
                        {formatViNumber(grandTotal, 0)}
                    </td>
                </tr>
            </tbody>
            </table>
            <div className="receipt-money-text-row">
                <span>Tổng số tiền (viết bằng chữ):</span>
                <strong>{numberToVietnameseText(grandTotal)}</strong>
            </div>

            <div className="receipt-attachment-row">
                 Số chứng từ gốc kèm theo: ...
            </div>

            <div className="receipt-signature-row">
            <div className="receipt-signature-item">
                <strong>NGƯỜI LẬP PHIẾU</strong>
                <span>(Ký, họ tên)</span>
            </div>

            <div className="receipt-signature-item">
                <strong>THỦ KHO</strong>
                <span>(Ký, họ tên)</span>
            </div>

            <div className="receipt-signature-item">
                <strong>PHÒNG KHVT</strong>
                <span>(Ký, họ tên)</span>
            </div>

            <div className="receipt-signature-item">
                <strong>KẾ TOÁN TRƯỞNG</strong>
                <span>(Ký, họ tên)</span>
            </div>

            <div className="receipt-signature-item">
                <strong>GIÁM ĐỐC</strong>
                <span>(Ký, họ tên, đóng dấu)</span>
            </div>
            </div>

            <div className="receipt-signer-name-row">
              <div>{signerNguoiLapPhieu}</div>
              <div>{signerThuKho}</div>
              <div>{signerPhongKhvt}</div>
              <div>{signerKeToanTruong}</div>
              <div>{signerGiamDoc}</div>
            </div>
            </div>
        </div>
      </div>
  );
}

export default ImportReceiptPrintVatForm;