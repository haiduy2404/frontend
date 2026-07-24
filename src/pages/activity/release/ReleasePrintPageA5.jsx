import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../../styles/ReleasePrintPageA5.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import { getReleaseOrderByCode } from "../../../services/releaseOrderService";

function ReleasePrintPageA5() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const paperSize = searchParams.get("paper") || "A5";

  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(false);

  const unwrapData = (res) => res?.data || res;

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

  useEffect(() => {
    const fetchData = async () => {
      if (!code) return;

      try {
        setLoading(true);
        const releaseRes = await getReleaseOrderByCode(code);
        setRelease(unwrapData(releaseRes));
      } catch (error) {
        console.error("LOAD RELEASE PRINT A5 ERROR:", error.response?.data || error);
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
      const quantity = parseNumber(
        line.requested_quantity ||
          line.request_quantity ||
          line.original_quantity ||
          line.quantity ||
          0
      );

      const actualQuantity = parseNumber(
        line.actual_quantity ||
          line.release_quantity ||
          line.exported_quantity ||
          0
      );

      return {
        id: line.id || line.item_id || index + 1,
        goods_name: line.goods_name || line.goods?.name || "",
        goods_code: line.goods_code || line.goods?.code || "",
        unit_name:
          line.goods_unit_name ||
          line.unit_name ||
          line.goods_unit?.name ||
          "",
        requested_quantity: quantity,
        actual_quantity: actualQuantity,
        request_quantity_in_default_unit: line.request_quantity_in_default_unit,
        actual_quantity_in_default_unit: line.actual_quantity_in_default_unit,
        default_goods_unit_name: line.default_goods_unit_name,
      };
    });
  }, [releaseLines]);

  const ROWS_PER_PAGE = 6;

  const pages = useMemo(() => {
    const result = [];

    if (rows.length === 0) {
      result.push(
        Array.from({ length: ROWS_PER_PAGE }, () => null)
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

      result.push([
        ...pageRows,
        ...Array.from(
          {
            length: ROWS_PER_PAGE - pageRows.length,
          },
          () => null
        ),
      ]);
    }

    return result;
  }, [rows]);

  // Internal components to avoid repeating JSX
  const ReleaseTableHeader = () => (
    <>
      <colgroup>
        <col className="release-print-col-stt-a5" />
        <col className="release-print-col-name-a5" />
        <col className="release-print-col-code-a5" />
        <col className="release-print-col-unit-a5" />
        <col className="release-print-col-qty-a5" />
        <col className="release-print-col-qty-a5" />
        <col className="release-print-col-price-a5" />
        <col className="release-print-col-amount-a5" />
      </colgroup>

      <thead>
        <tr>
          <th rowSpan={2}>TT</th>
          <th rowSpan={2}>Tên, nhãn hiệu quy cách, phẩm chất vật tư, dụng cụ sản phẩm, hàng hóa</th>
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
        <tr className="release-print-symbol-row-a5">
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
    </>
  );

          const ReleaseRows = ({ rowsToRender, pageIndex }) => (
            <>
              {rowsToRender.map((line, index) => (
                <tr
                  key={line?.id || `empty-${pageIndex}-${index}`}
                  className="release-print-item-row"
                >
                  <td className="release-print-center-cell-a5">
                    {line ? index + 1 : ""}
                  </td>
          <td className="release-print-name-cell-a5">{line?.goods_name || ""}</td>
          <td className="release-print-center-cell-a5">{line?.goods_code || ""}</td>
          <td className="release-print-center-cell-a5">{line?.default_goods_unit_name || line?.unit_name || ""}</td>
          <td className="release-print-number-cell-a5">{line ? formatViNumber(line.request_quantity_in_default_unit, 3) : ""}</td>
          <td className="release-print-number-cell-a5">{line ? formatViNumber(line.actual_quantity_in_default_unit, 3) : ""}</td>
          <td className="release-print-number-cell-a5"></td>
          <td className="release-print-number-cell-a5"></td>
        </tr>
      ))}
    </>
  );

  const ReleaseSignature = () => (
    <>
      <div className="release-print-signature-row-a5">
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

      <div className="release-print-signer-name-row-a5">
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
    return <div className="release-print-loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="release-print-page-a5">
      <div className="release-print-toolbar-a5">
        <button onClick={() => navigate(-1)}>Quay lại</button>
        <button
          onClick={() =>
            printWithPageSize(
              PAGE_SIZE.A5_LANDSCAPE.width,
              PAGE_SIZE.A5_LANDSCAPE.height
            )
          }
        >
          In {paperSize}
        </button>
      </div>
        <div className="release-print-scroll-a5">
          {pages.map((pageRows, pageIndex) => (
            <div
              key={`release-page-a5-${pageIndex}`}
              className={`release-print-paper-a5 ${
                pageIndex > 0
                  ? "release-print-paper-break-a5"
                  : ""
              }`}
            >
              <div className="release-print-header-a5">
                <div className="release-print-left-header-a5">
                  <div>
                    Đơn vị: <strong>CN TOA XE ĐÀ NẴNG</strong>
                  </div>
                </div>

                <div className="release-print-title-block-a5">
                  <h1>PHIẾU XUẤT KHO VẬT TƯ, PHỤ TÙNG</h1>

                  <div className="release-print-date-a5">
                    {formatDateText(release?.release_date)}
                  </div>
                </div>

                <div className="release-print-right-header-a5">
                  <strong>Mẫu số 02 - VT</strong>

                  <div>
                    (Ban hành theo TT số 99/2025/TT-BTC
                  </div>

                  <div>
                    ngày 27/10/2025 của Bộ trưởng BTC)
                  </div>

                  <div className="release-print-code-lines-a5">
                    <div>Số: {code || "............."}</div>
                    <div>Nợ:.............</div>
                    <div>Có:.............</div>
                  </div>
                </div>
              </div>

              <div className="release-print-info-a5">
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

              <table className="release-print-table-a5">
                <ReleaseTableHeader />

                <tbody>
                  <ReleaseRows
                    rowsToRender={pageRows}
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

export default ReleasePrintPageA5;
