import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
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

  const location = useLocation();

  const {
    signerThuKho = "",
    signerCungTieu = "",
  } = location.state || {};

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
          "LOAD RELEASE PRINT PROCESSING A5 ERROR:",
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
    return releaseLines.map((line, index) => ({
      id: line.id || line.item_id || index + 1,
      goods_name: line.goods_name || line.goods?.name || "",
      goods_code: line.goods_code || line.goods?.code || "",
      unit_name:
        line.goods_unit_name ||
        line.unit_name ||
        line.goods_unit?.name ||
        "",
      actual_quantity_in_default_unit:
        line.actual_quantity_in_default_unit,
      default_goods_unit_name: line.default_goods_unit_name,
    }));
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

        <tr className="processing-print-symbol-row-a5">
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
          className="processing-print-item-row-a5"
        >
          <td className="processing-print-center-cell-a5">
            {line?.goods_code || ""}
          </td>

          <td className="processing-print-name-cell-a5">
            {line?.goods_name || ""}
          </td>

          <td className="processing-print-center-cell-a5">
            {line?.default_goods_unit_name ||
              line?.unit_name ||
              ""}
          </td>

          <td className="processing-print-number-cell-a5">
            {line
              ? formatViNumber(
                  line.actual_quantity_in_default_unit,
                  2
                )
              : ""}
          </td>

          <td className="processing-print-number-cell-a5"></td>
          <td className="processing-print-number-cell-a5"></td>
          <td className="processing-print-name-cell-a5"></td>
        </tr>
      ))}
    </>
  );

  const ReleaseSignature = () => (
    <>
      <div className="processing-signature-row-a5">
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

      <div className="processing-signer-name-row-a5">
        <div></div>
        <div>{signerThuKho}</div>
        <div></div>
        <div>{signerCungTieu}</div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="processing-print-loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="processing-print-page-a5">
      <div className="processing-print-toolbar-a5">
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
          In {paperSize}
        </button>
      </div>

      <div className="processing-print-scroll-a5">
        {pages.map((pageRows, pageIndex) => (
          <div
            key={`release-processing-page-a5-${pageIndex}`}
            className={`processing-print-paper-a5 ${
              pageIndex > 0
                ? "processing-print-paper-break-a5"
                : ""
            }`}
          >
            <div className="processing-print-header-a5">
              <div className="processing-print-left-header-a5">
                <div>
                  Đơn vị: <strong>CN TOA XE ĐÀ NẴNG</strong>
                </div>
              </div>

              <div className="processing-print-title-block-a5">
                <h1>
                  PHIẾU XUẤT VẬT TƯ THUÊ NGOÀI CHẾ BIẾN
                </h1>

                <div className="processing-print-date-a5">
                  {formatDateText(release?.release_date)}
                </div>
              </div>
            </div>

            <div className="processing-print-info-a5">
              <div className="processing-info-line">
                <div className="processing-info-field processing-info-receiver">
                  <span className="processing-info-label">
                    Tên người nhận chế biến:
                  </span>

                  <span className="processing-info-dotted">
                    <strong>
                      {release?.release_target?.name ||
                        release?.release_target ||
                        ""}
                    </strong>
                  </span>
                </div>

                <div className="processing-info-field processing-info-unit">
                  <span className="processing-info-label">
                    Đơn vị:
                  </span>

                  <span className="processing-info-dotted">
                    <strong>
                      {release?.receiver_unit?.name ||
                        release?.receiver_unit ||
                        ""}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="processing-info-line">
                <div className="processing-info-field processing-info-warehouse">
                  <span className="processing-info-label">
                    Nhận tại kho:
                  </span>

                  <span className="processing-info-dotted">
                    <strong>
                      {release?.warehouse?.name ||
                        release?.warehouse_name ||
                        ""}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <table className="processing-print-table-a5">
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