import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import "../../../styles/IndustrialA5Print.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import {
  getReleaseOrderByCode,
  updateReleasePrinted,
} from "../../../services/releaseOrderService";

function IndustrialA5Print() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const {
    signerCungTieu = "",
    signerThuKho = "",
    signerPhongKHVT = "",
    signerGiamDoc = "",
  } = location.state || {};

  const unwrapData = (res) => res?.data || res;

  const isPrinted =
    release?.is_printed === true ||
    Number(release?.is_printed) === 1;

  const parseNumber = (value) => {
    const number = Number(value || 0);
    return Number.isNaN(number) ? 0 : number;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const formatDateText = (value) => {
    if (!value) return "Ngày.......tháng .... năm 2026";

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("/")) {
      const [day, month, year] = dateOnly.split("/");
      return `Ngày ${day} tháng ${month} năm ${year}`;
    }

    const [year, month, day] = dateOnly.split("-");
    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

const handlePrint = async () => {
  if (!release?.id) {
    alert("Không tìm thấy ID phiếu xuất kho");
    return;
  }

  if (isPrinted) {
    const confirmed = window.confirm(
      "Phiếu này đã được in. Bạn có muốn in phiếu thêm lần nữa không?"
    );

    if (!confirmed) return;

    printWithPageSize(
      PAGE_SIZE.A5_LANDSCAPE.width,
      PAGE_SIZE.A5_LANDSCAPE.height
    );

    return;
  }

  try {
    await updateReleasePrinted(release.id, true);

    setRelease((previousRelease) => ({
      ...previousRelease,
      is_printed: true,
    }));

    printWithPageSize(
      PAGE_SIZE.A5_LANDSCAPE.width,
      PAGE_SIZE.A5_LANDSCAPE.height
    );
  } catch (error) {
    console.error(
      "UPDATE INDUSTRIAL A5 PRINTED ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Không cập nhật được trạng thái đã in"
    );
  }
};

  useEffect(() => {
    const fetchData = async () => {
      if (!code) return;

      try {
        setLoading(true);

        const releaseRes = await getReleaseOrderByCode(code);
        setRelease(unwrapData(releaseRes));
      } catch (error) {
        console.error(
          "LOAD INDUSTRIAL A5 PRINT ERROR:",
          error.response?.data || error
        );

        alert("Không tải được dữ liệu phiếu xuất kho");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code]);

  const releaseLines =
    release?.items ||
    release?.inventory_lines ||
    release?.release_inventory_lines ||
    release?.inventory ||
    release?.details ||
    [];

  const rows = useMemo(() => {
    return releaseLines.map((line, index) => {
      const requestedQuantity = parseNumber(
        line.requested_quantity ||
          line.request_quantity ||
          line.original_quantity ||
          0
      );

      const actualQuantity = parseNumber(
        line.actual_quantity ||
          line.release_quantity ||
          line.exported_quantity ||
          0
      );

      const unitPrice = parseNumber(line.unit_price || 0);
      const amount = actualQuantity * unitPrice;

      return {
        id: line.id || line.item_id || index + 1,
        goods_id: line.goods_id,
        goods_name: line.goods_name || line.goods?.name || "",
        goods_code: line.goods_code || line.goods?.code || "",
        goods_unit_id: line.goods_unit_id || line.unit_id || "",

        unit_name:
          line.goods_unit_name ||
          line.unit_name ||
          line.goods_unit?.name ||
          "",

        requested_quantity: requestedQuantity,
        actual_quantity: actualQuantity,
        unit_price: unitPrice,

        quantity_in_default_unit: line.quantity_in_default_unit,

        request_quantity_in_default_unit:
          line.request_quantity_in_default_unit,

        actual_quantity_in_default_unit:
          line.actual_quantity_in_default_unit,

        default_goods_unit_name: line.default_goods_unit_name,
        amount,
      };
    });
  }, [releaseLines]);

  // ============================================================
  // PHÂN TRANG
  // ============================================================

  const ROWS_PER_PAGE = 7;
  const MIN_DISPLAY_ROWS = 6;

  const pages = useMemo(() => {
    const result = [];

    if (rows.length === 0) {
      result.push(
        Array.from({ length: MIN_DISPLAY_ROWS }, () => null)
      );

      return result;
    }

    for (
      let startIndex = 0;
      startIndex < rows.length;
      startIndex += ROWS_PER_PAGE
    ) {
      const pageRows = rows.slice(
        startIndex,
        startIndex + ROWS_PER_PAGE
      );

      // Trang nào dưới 6 dòng thì thêm dòng trống cho đủ 6.
      if (pageRows.length < MIN_DISPLAY_ROWS) {
        result.push([
          ...pageRows,
          ...Array.from(
            { length: MIN_DISPLAY_ROWS - pageRows.length },
            () => null
          ),
        ]);
      } else {
        result.push(pageRows);
      }
    }

    return result;
  }, [rows]);
  // ============================================================
  // CÁC DÒNG VẬT TƯ DÙNG CHUNG CHO MỌI TRANG
  // ============================================================

    const ReleaseTableHeader = () => (
      <>
        <colgroup>
          <col className="industrial-a5-col-stt" />
          <col className="industrial-a5-col-name" />
          <col className="industrial-a5-col-code" />
          <col className="industrial-a5-col-unit" />
          <col className="industrial-a5-col-qty" />
          <col className="industrial-a5-col-qty" />
          <col className="industrial-a5-col-price" />
          <col className="industrial-a5-col-amount" />
        </colgroup>

        <thead>
          <tr>
            <th rowSpan={2}>TT</th>

            <th rowSpan={2}>
              Tên, nhãn hiệu quy cách, phẩm chất vật tư, dụng cụ sản
              phẩm, hàng hóa
            </th>

            <th rowSpan={2}>Mã số</th>
            <th rowSpan={2}>Đơn vị tính</th>

            <th colSpan={2}>Số lượng</th>

            <th rowSpan={2}>Đơn giá</th>
            <th rowSpan={2}>Thành tiền</th>
          </tr>

          <tr>
            <th>Yêu cầu</th>
            <th>Thực xuất</th>
          </tr>
        </thead>
      </>
    );

  const ReleaseTableRows = ({ pageRows, startIndex = 0 }) => (
    <>
      {pageRows.map((line, index) => (
        <tr
          key={line?.id || `empty-${startIndex}-${index}`}
          className="industrial-a5-item-row"
        >
          <td className="industrial-a5-center-cell">
              {line ? index + 1 : ""}
          </td>

          <td className="industrial-a5-name-cell">
            {line?.goods_name || ""}
          </td>

          <td className="industrial-a5-center-cell">
            {line?.goods_code || ""}
          </td>

          <td className="industrial-a5-center-cell">
            {line?.default_goods_unit_name ||
              line?.unit_name ||
              ""}
          </td>

          <td className="industrial-a5-number-cell">
            {line
              ? formatViNumber(
                  line.request_quantity_in_default_unit,
                  2
                )
              : ""}
          </td>

          <td className="industrial-a5-number-cell">
            {line
              ? formatViNumber(
                  line.actual_quantity_in_default_unit,
                  2
                )
              : ""}
          </td>

          <td className="industrial-a5-money-cell"></td>

          <td className="industrial-a5-money-cell"></td>
        </tr>
      ))}
    </>
  );

  // ============================================================
  // CHỮ KÝ
  // ============================================================

  const ReleaseSignature = () => (
    <>
      <div className="industrial-a5-signature-row">
        <div>
          <strong>PT cung tiêu</strong>
          <span>(Ký, họ tên)</span>
        </div>

        <div>
          <strong>Thủ kho</strong>
          <span>(Ký, họ tên)</span>
        </div>

        <div>
          <strong>Người nhận</strong>
          <span>(Ký, họ tên)</span>
        </div>

        <div>
          <strong>PT d.vị nhận</strong>
          <span>(Ký, họ tên)</span>
        </div>

        <div>
          <strong>Phòng KHVT</strong>
          <span>(Ký, họ tên)</span>
        </div>

        <div>
          <strong>Giám đốc</strong>
          <span>(Ký, họ tên)</span>
        </div>
      </div>

      <div className="industrial-a5-signer-name-row">
        <div>{signerCungTieu}</div>
        <div>{signerThuKho}</div>
        <div></div>
        <div></div>
        <div>{signerPhongKHVT}</div>
        <div>{signerGiamDoc}</div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="industrial-a5-loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="industrial-a5-page">
      <div className="industrial-a5-toolbar">
        <button onClick={() => navigate(-1)}>
          Quay lại
        </button>

        <button
          type="button"
          className={
            isPrinted
              ? "industrial-a5-button industrial-a5-button-printed"
              : "industrial-a5-button"
          }
          onClick={handlePrint}
        >
          {isPrinted ? "Đã in" : "In"}
        </button>
      </div>

     <div className="industrial-a5-scroll">
      {pages.map((pageRows, pageIndex) => (
        <div
          key={`industrial-a5-page-${pageIndex}`}
          className={`industrial-a5-paper ${
            pageIndex > 0 ? "industrial-a5-paper-break" : ""
          }`}
        >
      <div className="industrial-a5-header">
        <div className="industrial-a5-left-header">
          <div>
            Đơn vị: <strong>CN TOA XE ĐÀ NẴNG</strong>
          </div>

          <div>
            Bộ phận: <strong>Kế hoạch-Vật Tư</strong>
          </div>
        </div>

        <div className="industrial-a5-title-block">
          <h1>PHIẾU XUẤT KHO VẬT TƯ, PHỤ TÙNG</h1>

          <div className="industrial-a5-date">
            {formatDateText(release?.release_date)}
          </div>
        </div>

        <div className="industrial-a5-right-header">
          <strong>Mẫu số 02 - VT</strong>

          <div>
            (Ban hành theo TT số 99/2025/TT-BTC
          </div>

          <div>
            ngày 27/10/2025 của Bộ trưởng BTC)
          </div>

          <div className="industrial-a5-code-lines">
            <div>Số: {code || "............."}</div>
            <div>Nợ:.............</div>
            <div>Có:.............</div>
          </div>
        </div>
      </div>

      <div className="industrial-a5-info">
        <div>
          Tên đơn vị lĩnh:{" "}
          <strong>
            {release?.receiver_unit?.name ||
              release?.receiver_unit ||
              ""}
          </strong>
        </div>

        <div>
          Đối tượng xuất kho:{" "}
          <strong>
            {release?.release_target?.name ||
              release?.release_target ||
              ""}
          </strong>
        </div>

        <div>
          Xuất tại kho:{" "}
          <strong>
            {release?.warehouse?.name ||
              release?.warehouse_name ||
              ""}
          </strong>
        </div>
      </div>

      <table className="industrial-a5-table">
        <ReleaseTableHeader />

        <tbody>
          <ReleaseTableRows
            pageRows={pageRows}
            pageIndex={pageIndex}
          />
        </tbody>
      </table>

          <ReleaseSignature />
        </div>
      ))}
    </div>
  </div>
);
}

export default IndustrialA5Print;