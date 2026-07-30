import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../../styles/TransferPaymentPrintPage.css";
import { printWithPageSize, PAGE_SIZE } from "../../utils/printUtils";
import { getMetadata } from "../../services/metadataService";
import { getMoneyTransferRequestById } from "../../services/moneyTransferRequestService";

function MoneyTransferRequestPrintPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [requestData, setRequestData] = useState(null);
  const [metadataMap, setMetadataMap] = useState({});
  const [loading, setLoading] = useState(false);

  const normalizeKey = (value) =>
    String(value || "").trim().toLowerCase();

  const getMetadataValue = (key) => metadataMap[normalizeKey(key)] || "";

  const formatViNumber = (value, fractionDigits = 0) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const toTitleCaseVi = (value) => {
    if (!value) return "";

    const uppercaseWords = new Set([
      "TNHH",
      "MTV",
      "TM",
      "DV",
      "SX",
      "XD",
      "XNK",
      "CP",
      "CTCP",
      "JSC",
      "LLC",
      "CO",
      "LTD",
      "KCN",
      "KKT",
      "KCX",
      "VN",
      "VNPT",
      "VIETTEL",
      "FPT",
      "EVN",
      "PVC",
      "PVCFC",
      "PVD",
      "PVGAS",
      "PVT",
      "HCM",
      "TP",
    ]);

    return String(value)
      .trim()
      .split(/\s+/)
      .map((word) => {
        const upperWord = word.toUpperCase();

        if (uppercaseWords.has(upperWord)) return upperWord;

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const formatRequestDateText = (value) => {
    if (!value) return "Ngày      tháng      năm";

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("/")) {
      const [day, month, year] = dateOnly.split("/");
      return `Ngày ${day} tháng ${month} năm ${year}`;
    }

    const [year, month, day] = dateOnly.split("-");
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

    const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    const groups = [];
    let temp = number;

    while (temp > 0) {
      groups.push(temp % 1000);
      temp = Math.floor(temp / 1000);
    }

    const parts = [];

    for (let index = groups.length - 1; index >= 0; index -= 1) {
      const group = groups[index];
      if (group === 0) continue;

      const text = readThreeDigits(group, index < groups.length - 1);
      const scale = scales[index] || "";
      parts.push(`${text}${scale ? ` ${scale}` : ""}`);
    }

    const result = parts.join(" ").replace(/\s+/g, " ").trim();
    return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng`;
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await getMetadata();
        const payload = response?.data || response;
        const results = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : [];

        const mapped = results.reduce((accumulator, item) => {
          accumulator[normalizeKey(item.key)] = item.value || "";
          return accumulator;
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

        const response = await getMoneyTransferRequestById(id);
        const detail = response?.data || response;

        setRequestData(detail);
      } catch (error) {
        console.error(
          "LOAD MONEY TRANSFER REQUEST ERROR:",
          error.response?.data || error
        );
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

  const totalAmount = Number(requestData?.total_amount || 0);
  const receiverCompanyName = toTitleCaseVi(
    requestData?.company?.name || requestData?.company_name || ""
  );
  const requesterName = getMetadataValue("thủ kho_nhập kho");

  return (
    <div className="transfer-print-page">
      <div className="transfer-print-toolbar">
        <button type="button" onClick={() => navigate(-1)}>
          Quay lại
        </button>

        <button
          type="button"
          onClick={() =>
            printWithPageSize(
              PAGE_SIZE.A5_LANDSCAPE.width,
              PAGE_SIZE.A5_LANDSCAPE.height
            )
          }
        >
          In
        </button>
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
          {formatRequestDateText(requestData?.request_date)}
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
            <span className="transfer-value-bold">
              {formatViNumber(totalAmount, 0)} đồng
            </span>
          </div>

          <div className="transfer-row transfer-row-text-money">
            <label>Bằng chữ:</label>
            <span className="transfer-value-bold-italic">
              {numberToVietnameseText(totalAmount)}
            </span>
          </div>

          <div className="transfer-row">
            <label>Lý do:</label>
            <span>{requestData?.reason || ""}</span>
          </div>

          <div className="transfer-row transfer-row-company">
            <label>Tên đơn vị nhận tiền:</label>
            <span className="transfer-value-bold">{receiverCompanyName}</span>
          </div>

          <div className="transfer-row">
            <label>Tài khoản:</label>
            <span className="transfer-value-bold">
              {requestData?.bank_account_number || ""}
            </span>
          </div>

          <div className="transfer-row">
            <label>Ngân hàng:</label>
            <span className="transfer-value-bold">
              {requestData?.bank_name || ""}
            </span>
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

export default MoneyTransferRequestPrintPage;