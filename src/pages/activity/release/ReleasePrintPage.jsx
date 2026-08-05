import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../../styles/ReleasePrintPage.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import {
  getReleaseOrderByCode,
  updateReleaseOrder,
} from "../../../services/releaseOrderService";

function ReleasePrintPage() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(false);

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
      PAGE_SIZE.A4_PORTRAIT.width,
      PAGE_SIZE.A4_PORTRAIT.height
    );

    return;
  }

  try {
    const payload = buildPrintPayload();

    await updateReleaseOrder(release.id, payload);

    setRelease((previousRelease) => ({
      ...previousRelease,
      is_printed: true,
    }));

    printWithPageSize(
      PAGE_SIZE.A4_PORTRAIT.width,
      PAGE_SIZE.A4_PORTRAIT.height
    );
  } catch (error) {
    console.error(
      "UPDATE RELEASE PRINT STATUS ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Không cập nhật được trạng thái đã in"
    );
  }
};

const buildPrintPayload = () => ({
  terms: release?.terms || null,
  release_date: release?.release_date,
  warehouse_id:
    release?.warehouse_id ||
    release?.warehouse?.id ||
    null,

  receiver_unit:
    release?.receiver_unit?.name ||
    release?.receiver_unit_name ||
    release?.receiver_unit ||
    null,

  release_target:
    release?.release_target?.name ||
    release?.release_target_name ||
    release?.release_target ||
    null,

  contract_number: release?.contract_number || null,
  description: release?.description || null,

  is_printed: true,

  items: (release?.items || []).map((item) => ({
    item_id: item.item_id || item.id,
    goods_id: item.goods_id,
    goods_unit_id: item.goods_unit_id || null,
    requested_quantity: parseNumber(item.requested_quantity),
    actual_quantity: parseNumber(item.actual_quantity),
    is_delete: false,
  })),
});

  useEffect(() => {
    const fetchData = async () => {
      if (!code) return;

      try {
        setLoading(true);

        const releaseRes = await getReleaseOrderByCode(code);
        setRelease(unwrapData(releaseRes));
      } catch (error) {
        console.error(
          "LOAD RELEASE PRINT ERROR:",
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

  const ROWS_PER_PAGE = 20;
  const MIN_DISPLAY_ROWS = 15;

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

      // Trang nào dưới 15 dòng thì thêm dòng trống cho đủ 15.
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
          <col className="release-print-col-stt" />
          <col className="release-print-col-name" />
          <col className="release-print-col-code" />
          <col className="release-print-col-unit" />
          <col className="release-print-col-qty" />
          <col className="release-print-col-qty" />
          <col className="release-print-col-price" />
          <col className="release-print-col-amount" />
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
          className="release-print-item-row"
        >
          <td className="release-print-center-cell">
              {line ? index + 1 : ""}
          </td>

          <td className="release-print-name-cell">
            {line?.goods_name || ""}
          </td>

          <td className="release-print-center-cell">
            {line?.goods_code || ""}
          </td>

          <td className="release-print-center-cell">
            {line?.default_goods_unit_name ||
              line?.unit_name ||
              ""}
          </td>

          <td className="release-print-number-cell">
            {line
              ? formatViNumber(
                  line.request_quantity_in_default_unit,
                  2
                )
              : ""}
          </td>

          <td className="release-print-number-cell">
            {line
              ? formatViNumber(
                  line.actual_quantity_in_default_unit,
                  2
                )
              : ""}
          </td>

          <td className="release-print-money-cell"></td>

          <td className="release-print-money-cell"></td>
        </tr>
      ))}
    </>
  );

  // ============================================================
  // CHỮ KÝ
  // ============================================================

  const ReleaseSignature = () => (
    <>
      <div className="release-print-signature-row">
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

      <div className="release-print-signer-name-row">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="release-print-loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="release-print-page">
      <div className="release-print-toolbar">
        <button onClick={() => navigate(-1)}>
          Quay lại
        </button>

        <button
          type="button"
          className={
            isPrinted
              ? "release-print-button release-print-button-printed"
              : "release-print-button"
          }
          onClick={handlePrint}
        >
          {isPrinted ? "Đã in" : "In"}
        </button>
      </div>

     <div className="release-print-scroll">
      {pages.map((pageRows, pageIndex) => (
        <div
          key={`release-page-${pageIndex}`}
          className={`release-print-paper ${
            pageIndex > 0 ? "release-print-paper-break" : ""
          }`}
        >
      <div className="release-print-header">
        <div className="release-print-left-header">
          <div>
            Đơn vị: <strong>CN TOA XE ĐÀ NẴNG</strong>
          </div>

          <div>
            Bộ phận: <strong>Kế hoạch-Vật Tư</strong>
          </div>
        </div>

        <div className="release-print-title-block">
          <h1>PHIẾU XUẤT KHO VẬT TƯ, PHỤ TÙNG</h1>

          <div className="release-print-date">
            {formatDateText(release?.release_date)}
          </div>
        </div>

        <div className="release-print-right-header">
          <strong>Mẫu số 02 - VT</strong>

          <div>
            (Ban hành theo TT số 99/2025/TT-BTC
          </div>

          <div>
            ngày 27/10/2025 của Bộ trưởng BTC)
          </div>

          <div className="release-print-code-lines">
            <div>Số: {code || "............."}</div>
            <div>Nợ:.............</div>
            <div>Có:.............</div>
          </div>
        </div>
      </div>

      <div className="release-print-info">
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

      <table className="release-print-table">
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

export default ReleasePrintPage;