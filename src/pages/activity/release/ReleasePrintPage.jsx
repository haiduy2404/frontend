import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../../styles/ReleasePrintPage.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import { getReleaseOrderByCode } from "../../../services/releaseOrderService";

function ReleasePrintPage() {
  const navigate = useNavigate();
  const { code } = useParams();

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

  const DEFAULT_ROWS = 15;
  const FIRST_PAGE_MAX_ROWS = 25;
  const NEXT_PAGE_MAX_ROWS = 32;

  /*
   * Trang đầu:
   * - Ít hơn 15 dòng: thêm dòng trống cho đủ 15.
   * - Từ 15 đến 25 dòng: hiển thị đúng số lượng.
   * - Trên 25 dòng: lấy 25 dòng đầu.
   */
  const firstPageRows = useMemo(() => {
    const pageRows = rows.slice(0, FIRST_PAGE_MAX_ROWS);

    if (pageRows.length < DEFAULT_ROWS) {
      return Array.from({ length: DEFAULT_ROWS }).map(
        (_, index) => pageRows[index] || null
      );
    }

    return pageRows;
  }, [rows]);

  /*
   * Các dòng còn lại sau 25 dòng đầu.
   */
  const remainingRows = useMemo(() => {
    return rows.slice(FIRST_PAGE_MAX_ROWS);
  }, [rows]);

  /*
   * Trang thứ hai trở đi:
   * Mỗi trang tối đa 32 dòng.
   */
  const extraPages = useMemo(() => {
    const pages = [];

    for (
      let startIndex = 0;
      startIndex < remainingRows.length;
      startIndex += NEXT_PAGE_MAX_ROWS
    ) {
      pages.push(
        remainingRows.slice(
          startIndex,
          startIndex + NEXT_PAGE_MAX_ROWS
        )
      );
    }

    return pages;
  }, [remainingRows]);

  const hasExtraPages = extraPages.length > 0;

  // ============================================================
  // TIÊU ĐỀ BẢNG DÙNG CHUNG CHO MỌI TRANG
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

  // ============================================================
  // CÁC DÒNG VẬT TƯ DÙNG CHUNG CHO MỌI TRANG
  // ============================================================

  const ReleaseTableRows = ({ pageRows, startIndex = 0 }) => (
    <>
      {pageRows.map((line, index) => (
        <tr
          key={line?.id || `empty-${startIndex}-${index}`}
          className="release-print-item-row"
        >
          <td className="release-print-center-cell">
            {line ? startIndex + index + 1 : ""}
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
                  3
                )
              : ""}
          </td>

          <td className="release-print-number-cell">
            {line
              ? formatViNumber(
                  line.actual_quantity_in_default_unit,
                  3
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
          onClick={() =>
            printWithPageSize(
              PAGE_SIZE.A4_PORTRAIT.width,
              PAGE_SIZE.A4_PORTRAIT.height
            )
          }
        >
          In
        </button>
      </div>

      <div className="release-print-scroll">
        {/* ======================================================
            TRANG ĐẦU TIÊN
        ====================================================== */}

        <div className="release-print-paper">
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
                pageRows={firstPageRows}
                startIndex={0}
              />
            </tbody>
          </table>

          {/* Không có trang sau thì chữ ký nằm ở trang đầu */}
          {!hasExtraPages && <ReleaseSignature />}
        </div>

        {/* ======================================================
            TRANG THỨ HAI TRỞ ĐI
        ====================================================== */}

        {extraPages.map((pageRows, pageIndex) => {
          const startIndex =
            FIRST_PAGE_MAX_ROWS +
            pageIndex * NEXT_PAGE_MAX_ROWS;

          const isLastPage =
            pageIndex === extraPages.length - 1;

          return (
            <div
              key={`page-${pageIndex}`}
              className="release-print-paper release-print-paper-break"
            >
              <table className="release-print-table">
                <ReleaseTableHeader />

                <tbody>
                  <ReleaseTableRows
                    pageRows={pageRows}
                    startIndex={startIndex}
                  />
                </tbody>
              </table>

              {/* Chỉ trang cuối cùng mới có chữ ký */}
              {isLastPage && <ReleaseSignature />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReleasePrintPage;