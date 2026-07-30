import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../../styles/ReleasePrintPageA5_B.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import { getReleaseOrderByCode } from "../../../services/releaseOrderService";

function ReleasePrintProcessingPage() {
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
  const ReleaseTableHeader = () => (
    <>
        <colgroup>
        <col className="processing-col-code-a5" />
        <col className="processing-col-name-a5" />
        <col className="processing-col-unit-a5" />
        <col className="processing-col-quantity-a5" />
        <col className="processing-col-price-a5" />
        <col className="processing-col-amount-a5" />
        <col className="processing-col-note-a5" />
        </colgroup>

        <thead>
        <tr>
            <th>
            Danh điểm
            <br />
            vật tư
            </th>

            <th>
            Tên nhãn hiệu quy cách
            <br />
            vật tư
            </th>

            <th>ĐVT</th>

            <th>
            Số
            <br />
            lượng
            </th>

            <th>
            Giá
            <br />
            đơn vị
            </th>

            <th>Thành tiền</th>

            <th>Ghi chú</th>
        </tr>

        <tr className="release-print-symbol-row-a5">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
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
            {/* 1. Danh điểm vật tư */}
            <td className="release-print-center-cell-a5">
            {line?.goods_code || ""}
            </td>

            {/* 2. Tên nhãn hiệu quy cách vật tư */}
            <td className="release-print-name-cell-a5">
            {line?.goods_name || ""}
            </td>

            {/* 3. ĐVT */}
            <td className="release-print-center-cell-a5">
            {line?.default_goods_unit_name ||
                line?.unit_name ||
                ""}
            </td>

            {/* 4. Số lượng */}
            <td className="release-print-number-cell-a5">
            {line
                ? formatViNumber(
                    line.actual_quantity_in_default_unit,
                    2
                )
                : ""}
            </td>

            {/* 5. Giá đơn vị */}
            <td className="release-print-number-cell-a5"></td>

            {/* 6. Thành tiền */}
            <td className="release-print-number-cell-a5"></td>

            {/* 7. Ghi chú */}
            <td className="release-print-name-cell-a5"></td>
        </tr>
        ))}
    </>
    );

    const ReleaseSignature = () => (
    <>
        <div className="release-print-signature-row-a5">
        <div>
            <strong>THỦ TRƯỞNG ĐƠN VỊ</strong>
            <span>(Ký, họ tên)</span>
        </div>

        <div>
            <strong>THỦ KHO</strong>
            <span>(Ký, họ tên)</span>
        </div>

        <div>
            <strong>NGƯỜI NHẬN</strong>
            <span>(Ký, họ tên)</span>
        </div>

        <div>
            <strong>PHỤ TRÁCH CUNG TIÊU</strong>
            <span>(Ký, họ tên)</span>
        </div>
        </div>

        <div className="release-print-signer-name-row-a5">
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
                  <h1>PHIẾU XUẤT VẬT TƯ THUÊ NGOÀI CHẾ BIẾN</h1>

                  <div className="release-print-date-a5">
                    {formatDateText(release?.release_date)}
                  </div>
                </div>
              </div>
            <div className="release-print-info-a5">
                <div className="processing-info-line">
                    <div className="processing-info-field processing-info-receiver">
                    <span className="processing-info-label">
                        Tên người nhận chế biến:
                    </span>

                    <span className="processing-info-dotted">
                        <strong>{release?.release_target?.name}</strong>
                    </span>
                    </div>

                    <div className="processing-info-field processing-info-unit">
                    <span className="processing-info-label">
                        Đơn vị:
                    </span>

                    <span className="processing-info-dotted">
                        <strong>{release?.receiver_unit?.name}</strong>
                    </span>
                    </div>
                </div>

                <div className="processing-info-line">
                    <div className="processing-info-field processing-info-warehouse">
                    <span className="processing-info-label">
                        Nhận tại kho:
                    </span>

                    <span className="processing-info-dotted">
                        <strong>{release?.warehouse_name || ""}</strong>
                    </span>
                    </div>
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

export default ReleasePrintProcessingPage;
