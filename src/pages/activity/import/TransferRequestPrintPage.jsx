import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../../styles/TransferPaymentPrintPage.css";
import { getWarehouseReceiptByCode } from "../../../services/warehouseReceiptService";
import { getMetadata } from "../../../services/metadataService";

function TransferRequestPrintPage() {
  const [metadataMap, setMetadataMap] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const printReason = location.state?.printReason || "";

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const normalizeKey = (value) => {
    return String(value || "").trim().toLowerCase();
} ;

  const getMetadataValue = (key) => {
    return metadataMap[normalizeKey(key)] || "";
};

  const formatViNumber = (value, fractionDigits = 2) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const toTitleCaseVi = (value) => {
    if (!value) return "";

    return String(value)
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
    };

  const formatReceiptDateText = (value) => {
        if (!value) {
            return "Ngày      tháng      năm";
        }

        const dateOnly = String(value).split("T")[0];
        const [day, month, year] = dateOnly.split("-");

        if (!day || !month || !year) {
            return "Ngày      tháng      năm";
        }

        return `Ngày ${day} tháng ${month} năm ${year}`;
    };

  const readThreeDigits = (number, hasHundredsBefore = false) => {
  const units = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];

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

    const numberToVietnameseText = (value) => {
    const number = Math.round(Number(value || 0));

    if (number === 0) return "Không đồng";

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

    return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng`;
    };

  const totalAmount = useMemo(() => {
    const lines = receipt?.inventory_lines || [];

    return lines.reduce((sum, line) => {
      const quantity = Number(line.original_quantity || line.quantity || 0);
      const unitPrice = Number(line.unit_price || 0);

      return sum + quantity * unitPrice;
    }, 0);
  }, [receipt]);

    const vatRate = Number(receipt?.vat || 0);
    const vatAmount = totalAmount * (vatRate / 100);
    const grandTotal = totalAmount + vatAmount;

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

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getWarehouseReceiptByCode(id);
        setReceipt(response?.data || response);
      } catch (error) {
        console.error("LOAD TRANSFER REQUEST ERROR:", error.response?.data || error);
        alert("Không tải được dữ liệu giấy đề nghị chuyển tiền");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="transfer-print-loading">Đang tải dữ liệu...</div>;
  }
  const receiverCompanyName = toTitleCaseVi(
    receipt?.company?.name || receipt?.company_name || ""
);

  const requesterName = getMetadataValue("thủ kho_nhập kho");

  return (
    <div className="transfer-print-page">
      <div className="transfer-print-toolbar">
        <button onClick={() => navigate(-1)}>Quay lại</button>
        <button onClick={() => window.print()}>In</button>
      </div>

      <div className="transfer-paper">
        <div className="transfer-top">
          <div className="transfer-company">
            <div>CÔNG TY CỔ PHẦN VẬN TẢI ĐƯỜNG SẮT</div>
            <strong className="transfer-branch-name">
                    CHI NHÁNH TOA XE ĐÀ NẴNG
            </strong>
          </div>

          <div className="transfer-national">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
            <span>Độc lập - Tự do - Hạnh phúc</span>
          </div>
        </div>

        <h1>GIẤY ĐỀ NGHỊ CHUYỂN TIỀN</h1>

          <div className="transfer-date-line">
                {formatReceiptDateText(receipt?.receipt_date)}
        </div>

        <div className="transfer-content">
          <div className="transfer-row">
            <label>Kính gửi:</label>
            <span>Ông Giám Đốc Chi Nhánh Toa xe Đà Nẵng</span>
          </div>

          <div className="transfer-row">
            <label>Tôi tên là:</label>
            <span>{requesterName}</span>
          </div>

          <div className="transfer-row">
            <label>Địa chỉ:</label>
            <span>Phòng KHVT</span>
          </div>

        <div className="transfer-row">
            <label>Đề nghị chuyển số tiền:</label>
            <span className="transfer-value-bold">{formatViNumber(grandTotal, 0)} đồng</span>
        </div>

        <div className="transfer-row transfer-row-text-money">
            <label>Bằng chữ:</label>
            <span className="transfer-value-bold-italic">
                {numberToVietnameseText(grandTotal)}
            </span>
        </div>

          <div className="transfer-row">
            <label>Lý do:</label>
                <span>{printReason || receipt?.description || ""}</span>
          </div>

        <div className="transfer-row transfer-row-company">
            <label>Tên đơn vị nhận tiền:</label>
            <span className="transfer-value-bold">
                {receiverCompanyName}
            </span>
        </div>

        <div className="transfer-row">
            <label>Tài khoản:</label>
            <span className="transfer-value-bold">{receipt?.bank_account_number || ""}</span>
        </div>

        <div className="transfer-row">
            <label>Ngân hàng:</label>
            <span className="transfer-value-bold">{receipt?.bank_account_name || ""}</span>
        </div>
        </div>

        <div className="signature-row">
          <div>
            <strong>Giám đốc</strong>
            <span>(ký, họ tên, đóng dấu)</span>
          </div>

          <div>
            <strong>Kế toán Trưởng</strong>
            <span>(ký, họ tên, đóng dấu)</span>
          </div>

          <div>
            <strong>Phụ trách bộ phận</strong>
            <span>(ký, họ tên, đóng dấu)</span>
          </div>

          <div>
            <strong>Người đề nghị</strong>
            <span>(ký, họ tên, đóng dấu)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferRequestPrintPage;