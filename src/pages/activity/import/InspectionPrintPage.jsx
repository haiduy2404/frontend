import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../../styles/InspectionPrintPage.css";

import { getWarehouseReceiptByCode } from "../../../services/warehouseReceiptService";
import { getMetadata } from "../../../services/metadataService";
import mauthongtu from "../../../assets/mauthongtu.png";

function InspectionPrintPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const location = useLocation();
  const signerThuKho = location.state?.warehouseKeeperName || "";

  const [receipt, setReceipt] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [metadataMap, setMetadataMap] = useState({});
  const [loading, setLoading] = useState(false);

  const DEFAULT_PRINT_ROWS = 15;

  const unwrapData = (response) => response?.data || response;

  const normalizeKey = (value) => {
    return String(value || "").trim().toLowerCase();
  };

  const getMetadataValue = (key) => {
    return metadataMap[normalizeKey(key)] || "";
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") return value;

    const text = String(value).trim();

    if (text.includes(",")) {
      return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
    }

    return Number(text) || 0;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    const number = Number(value || 0);

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const formatPrintQuantity = (value) => {
    const number = parseNumber(value);

    if (!number) return "";

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  const formatDateText = (value) => {
    if (!value) return "ngày ... tháng ... năm ...";

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("-")) {
      const [day, month, year] = dateOnly.split("-");

      if (day && month && year) {
        return `ngày ${day} tháng ${month} năm ${year}`;
      }
    }

    return `ngày ${value}`;
  };

  const getInspectionCodeFromReceiptCode = (receiptCode) => {
    const text = String(receiptCode || "");
    const numbers = text.replace(/\D/g, "");

    if (!numbers) return "";

    return numbers.slice(-2).padStart(2, "0");
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await getMetadata();
        const data = unwrapData(response);
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
    const fetchReceiptDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const response = await getWarehouseReceiptByCode(id);
        const data = unwrapData(response);

        setReceipt(data);

        const rows =
          data?.inventory_lines ||
          data?.inventory ||
          data?.items ||
          data?.details ||
          [];

        const mappedRows = Array.isArray(rows)
          ? rows.map((item, index) => {
              const documentQuantity = item.original_quantity;
              const qualifiedQuantity = item.accepted_quantity;
              const wrongQuantity = item.rejected_quantity;

              return {
                id: item.inventory_id || item.goods_id || index + 1,
                goods_id: item.goods_id || "",
                goods_code: item.goods_code || "",
                goods_name: item.goods_name || "",
                unit_name: item.unit_name || item.unit || "",

                document_quantity: formatViNumber(documentQuantity, 2),
                qualified_quantity: formatViNumber(qualifiedQuantity, 2),
                wrong_quantity: formatViNumber(wrongQuantity, 2),

                inspection_method: "",
                note: item.note || "",
              };
            })
          : [];

        setDetailRows(mappedRows);
      } catch (error) {
        console.error("LOAD INSPECTION PRINT ERROR:", error.response?.data || error);
        alert("Không tải được dữ liệu biên bản kiểm nghiệm");
        setReceipt(null);
        setDetailRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptDetail();
  }, [id]);

  const printRows = useMemo(() => {
    return Array.from({
      length: Math.max(DEFAULT_PRINT_ROWS, detailRows.length),
    }).map((_, index) => detailRows[index] || null);
  }, [detailRows]);

  if (loading) {
    return (
      <div className="inspection-print-loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  const inspectionCode = getInspectionCodeFromReceiptCode(id);

  const companyName =
    receipt?.company?.name ||
    receipt?.company_name ||
    "";

  const invoiceCode = receipt?.invoice_code || "........";
  const invoiceDateText = formatDateText(receipt?.invoice_date);
  const receiptDateText = formatDateText(receipt?.receipt_date);

  const signerDaiDienKyThuat = getMetadataValue("TP KỸ THUẬT");
  const signerPhoGiamDoc = getMetadataValue("PHÓ GIÁM ĐỐC");
  const signerTruongPhongVatTu = getMetadataValue("TP KẾ HOẠCH - VẬT TƯ");

  return (
    <div className="inspection-print-page">
      <div className="inspection-print-toolbar">
        <button type="button" onClick={() => navigate(-1)}>
          Quay lại
        </button>

        <button type="button" onClick={() => window.print()}>
          In
        </button>
      </div>

      <div className="inspection-print-scroll">
        <div className="inspection-print-paper">
          <div className="inspection-print-header">
            <div className="inspection-print-left-header">
              <div>
                <strong>Đơn vị : CN TOA XE ĐN</strong>
              </div>

              <div>
                <strong>Bộ phận : KH-VT</strong>
              </div>
            </div>

            <div className="inspection-print-title-block">
              <h1>BIÊN BẢN KIỂM NGHIỆM</h1>

              <div>
                <strong>
                  Vật tư, công cụ, sản phẩm, hàng hóa
                </strong>
              </div>

              <div>
                <strong>
                  {receiptDateText.charAt(0).toUpperCase()}
                  {receiptDateText.slice(1)}
                </strong>
              </div>
            </div>

            <div className="inspection-print-right-header">
              <img
                src={mauthongtu}
                alt="Mẫu số 03-VT"
                className="inspection-template-image"
              />
            </div>
          </div>

          <div className="inspection-print-info">
            <div>
              Theo hóa đơn số {invoiceCode} {invoiceDateText} của{" "}
              <strong>{companyName || "................................"}</strong>
            </div>

            <div>
              Ban kiểm nghiệm gồm:
            </div>

            <div className="inspection-member-row">
              <span>
                + Ông/Bà: <strong>{signerPhoGiamDoc}</strong>
              </span>

              <span>
                Chức vụ: Phó Giám đốc
              </span>

              <span>
                Đại diện:
              </span>

              <span>
                Trưởng ban
              </span>
            </div>

            <div className="inspection-member-row">
              <span>
                + Ông/Bà: <strong>{signerTruongPhongVatTu}</strong>
              </span>

              <span>
                Chức vụ: TP Kế hoạch - Vật tư
              </span>

              <span>
                Đại diện: KH-VT
              </span>

              <span>
                Ủy viên
              </span>
            </div>

            <div className="inspection-member-row">
              <span>
                + Ông/Bà: <strong>{signerDaiDienKyThuat}</strong>
              </span>

              <span>
                Chức vụ: TP Kỹ thuật
              </span>

              <span>
                Đại diện: KT
              </span>

              <span>
                Ủy viên
              </span>
            </div>

            <div className="inspection-member-row">
              <span>
                + Ông/Bà: <strong>{signerThuKho}</strong>
              </span>

              <span>
                Chức vụ: Thủ kho
              </span>

              <span>
                Đại diện: KH-VT
              </span>

              <span>
                Ủy viên
              </span>
            </div>

            <div>
              <strong>Đã kiểm nghiệm các loại:</strong>
            </div>
          </div>

          <table className="inspection-print-table">
            <colgroup>
              <col className="inspection-col-stt" />
              <col className="inspection-col-name" />
              <col className="inspection-col-code" />
              <col className="inspection-col-method" />
              <col className="inspection-col-unit" />
              <col className="inspection-col-doc-qty" />
              <col className="inspection-col-good-qty" />
              <col className="inspection-col-wrong-qty" />
              <col className="inspection-col-note" />
            </colgroup>

            <thead>
              <tr>
                <th rowSpan={2}>TT</th>

                <th rowSpan={2}>
                  Tên, nhãn hiệu, quy cách, vật tư, công cụ, sản phẩm, hàng hóa
                </th>

                <th rowSpan={2}>Mã số</th>

                <th rowSpan={2}>
                  Phương thức kiểm nghiệm
                </th>

                <th rowSpan={2}>
                  Đơn vị tính
                </th>

                <th rowSpan={2}>
                  Số lượng theo chứng từ
                </th>

                <th colSpan={2}>
                  Kết quả kiểm nghiệm
                </th>

                <th rowSpan={2}>
                  Ghi chú
                </th>
              </tr>

              <tr>
                <th>
                  Số lượng đúng quy cách, phẩm chất
                </th>

                <th>
                  Số lượng không đúng quy cách, phẩm chất
                </th>
              </tr>

              <tr className="inspection-symbol-row">
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
                <th>E</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
              </tr>
            </thead>

            <tbody>
              {printRows.map((item, index) => (
                <tr key={index}>
                  <td className="inspection-center-cell">
                    {item ? index + 1 : ""}
                  </td>

                  <td className="inspection-name-cell">
                    {item?.goods_name || ""}
                  </td>

                  <td className="inspection-center-cell">
                    {item?.goods_code || ""}
                  </td>

                  <td className="inspection-center-cell">
                    {item?.inspection_method || ""}
                  </td>

                  <td className="inspection-center-cell">
                    {item?.unit_name || ""}
                  </td>

                  <td className="inspection-number-cell">
                    {item ? formatPrintQuantity(item.document_quantity) : ""}
                  </td>

                  <td className="inspection-number-cell">
                    {item ? formatPrintQuantity(item.qualified_quantity) : ""}
                  </td>

                  <td className="inspection-number-cell">
                    {item ? formatPrintQuantity(item.wrong_quantity) : ""}
                  </td>

                  <td className="inspection-note-cell">
                    {item?.note || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inspection-print-conclusion">
            Ý kiến của Ban kiểm nghiệm : Số lượng đủ, đạt yêu cầu
          </div>

          <div className="inspection-signature-title-row">
            <div>
              <strong>ĐẠI DIỆN KỸ THUẬT</strong>
              <span>(Ký, họ tên)</span>
            </div>

            <div>
              <strong>THỦ KHO</strong>
              <span>(Ký, họ tên)</span>
            </div>

            <div>
              <strong>PHÒNG KHVT</strong>
              <span>(Ký, họ tên)</span>
            </div>

            <div>
              <strong>PHÓ GIÁM ĐỐC</strong>
              <span>(Ký, họ tên)</span>
            </div>
          </div>

          <div className="inspection-signer-name-row">
            <div>{signerDaiDienKyThuat}</div>
            <div>{signerThuKho}</div>
            <div>{signerTruongPhongVatTu}</div>
            <div>{signerPhoGiamDoc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InspectionPrintPage;