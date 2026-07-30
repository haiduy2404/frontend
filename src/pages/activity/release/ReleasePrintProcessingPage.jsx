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

  const unwrapData = (response) =>
    response?.data?.data || response?.data || response;

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const normalized = String(value)
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

    const number = Number(normalized);

    return Number.isNaN(number) ? 0 : number;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    if (value === null || value === undefined || value === "") return "";

    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const formatDateText = (value) => {
    if (!value) {
      return "Ngày ..... tháng ..... năm ........";
    }

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("/")) {
      const [day, month, year] = dateOnly.split("/");

      return `Ngày ${day} tháng ${month} năm ${year}`;
    }

    const [year, month, day] = dateOnly.split("-");

    if (!year || !month || !day) {
      return "Ngày ..... tháng ..... năm ........";
    }

    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

  const getTextValue = (value) => {
    if (!value) return "";

    if (typeof value === "string") return value;

    return value.name || value.code || "";
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!code) return;

      try {
        setLoading(true);

        const response = await getReleaseOrderByCode(code);
        const data = unwrapData(response);

        setRelease(data);
      } catch (error) {
        console.error(
          "LOAD PROCESSING RELEASE PRINT ERROR:",
          error.response?.data || error
        );

        alert("Không tải được dữ liệu phiếu xuất vật tư thuê ngoài chế biến");
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
      const quantity =
        line.actual_quantity_in_default_unit ??
        line.actual_quantity ??
        line.release_quantity ??
        line.exported_quantity ??
        line.request_quantity_in_default_unit ??
        line.requested_quantity ??
        line.quantity ??
        0;

      const unitPrice =
        line.unit_price ??
        line.price ??
        line.goods_unit_price ??
        null;

      const amount =
        line.amount ??
        line.total_amount ??
        line.total_price ??
        (unitPrice !== null
          ? parseNumber(quantity) * parseNumber(unitPrice)
          : null);

      return {
        id: line.id || line.item_id || index + 1,

        goods_code:
          line.goods_code ||
          line.goods?.code ||
          line.material_code ||
          "",

        goods_name:
          line.goods_name ||
          line.goods?.name ||
          line.material_name ||
          "",

        unit_name:
          line.default_goods_unit_name ||
          line.goods_unit_name ||
          line.unit_name ||
          line.goods_unit?.name ||
          "",

        quantity,
        unit_price: unitPrice,
        amount,

        note:
          line.note ||
          line.description ||
          line.remark ||
          "",
      };
    });
  }, [releaseLines]);

  const ROWS_PER_PAGE = 7;

  const pages = useMemo(() => {
    const result = [];

    if (rows.length === 0) {
      result.push(
        Array.from(
          {
            length: ROWS_PER_PAGE,
          },
          () => null
        )
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

  const totalAmount = useMemo(() => {
    return rows.reduce(
      (sum, item) => sum + parseNumber(item.amount),
      0
    );
  }, [rows]);

  const ProcessingTableHeader = () => (
    <>
      <colgroup>
        <col style={{ width: "15%" }} />
        <col style={{ width: "30%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "11%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "10%" }} />
      </colgroup>

      <thead>
        <tr>
          <th>Danh điểm vật tư</th>

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

  const ProcessingRows = ({ rowsToRender, pageIndex }) => (
    <>
      {rowsToRender.map((line, index) => (
        <tr
          key={line?.id || `processing-empty-${pageIndex}-${index}`}
          className="release-print-item-row"
        >
          <td className="release-print-center-cell-a5">
            {line?.goods_code || ""}
          </td>

          <td className="release-print-name-cell-a5">
            {line?.goods_name || ""}
          </td>

          <td className="release-print-center-cell-a5">
            {line?.unit_name || ""}
          </td>

          <td className="release-print-number-cell-a5">
            {line
              ? formatViNumber(line.quantity, 3)
              : ""}
          </td>

          <td className="release-print-number-cell-a5">
            {line
              ? formatViNumber(line.unit_price, 2)
              : ""}
          </td>

          <td className="release-print-number-cell-a5">
            {line
              ? formatViNumber(line.amount, 2)
              : ""}
          </td>

          <td className="release-print-name-cell-a5">
            {line?.note || ""}
          </td>
        </tr>
      ))}
    </>
  );

  const ProcessingSignature = () => (
    <>
      <div
        className="release-print-signature-row-a5"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
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

      <div
        className="release-print-signer-name-row-a5"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
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

  if (!release) {
    return (
      <div className="release-print-loading">
        Không tìm thấy phiếu xuất kho
      </div>
    );
  }

  const receiverName =
    getTextValue(release.receiver_unit) ||
    release.receiver_unit_name ||
    "";

  const processingUnit =
    getTextValue(release.release_target) ||
    release.release_target_name ||
    "";

  const warehouseName =
    getTextValue(release.warehouse) ||
    release.warehouse_name ||
    "";

  return (
    <div className="release-print-page-a5">
      <div className="release-print-toolbar-a5">
        <button
          type="button"
          onClick={() => navigate(-1)}
        >
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

      <div className="release-print-scroll-a5">
        {pages.map((pageRows, pageIndex) => (
          <div
            key={`processing-release-page-${pageIndex}`}
            className={`release-print-paper-a5 ${
              pageIndex > 0
                ? "release-print-paper-break-a5"
                : ""
            }`}
          >
            <div className="release-print-header-a5">
              <div className="release-print-left-header-a5">
                <div>
                  <strong>CN TOA XE ĐN</strong>
                </div>

                <div>
                  Số:{" "}
                  <strong>
                    {release.code ||
                      release.release_code ||
                      code ||
                      "............."}
                  </strong>
                </div>
              </div>

              <div className="release-print-title-block-a5">
                <h1>
                  PHIẾU XUẤT VẬT TƯ THUÊ NGOÀI CHẾ BIẾN
                </h1>

                <div className="release-print-date-a5">
                  {formatDateText(release.release_date)}
                </div>
              </div>

              <div className="release-print-right-header-a5">
                <strong>Mẫu số 8 - VT</strong>

                <div>
                  (Ban hành theo TT số 99/2025/TT-BTC
                </div>

                <div>
                  ngày 27/10/2025 của Bộ trưởng BTC)
                </div>

                <div className="release-print-code-lines-a5">
                  <div>
                    <strong>ĐỊNH KHOẢN:</strong>
                  </div>

                  <div>Nợ:........................</div>
                  <div>Có:........................</div>
                </div>
              </div>
            </div>

            <div className="release-print-info-a5">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 0.55fr",
                  columnGap: "24px",
                }}
              >
                <div>
                  Tên người nhận chế biến:{" "}
                  <strong>{receiverName}</strong>
                </div>

                <div>
                  Đơn vị:{" "}
                  <strong>{processingUnit}</strong>
                </div>
              </div>

              <div>
                Theo hợp đồng số:{" "}
                <strong>
                  {release.contract_number || ""}
                </strong>
                {" "}ngày ..... tháng ..... năm ........
              </div>

              <div>
                Nhận tại kho:{" "}
                <strong>{warehouseName}</strong>
              </div>
            </div>

            <table className="release-print-table-a5">
              <ProcessingTableHeader />

              <tbody>
                <ProcessingRows
                  rowsToRender={pageRows}
                  pageIndex={pageIndex}
                />
              </tbody>
            </table>

            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Cộng thành tiền (viết bằng chữ):{" "}
              ........................................................................................................
              {totalAmount > 0 && (
                <span style={{ marginLeft: "8px" }}>
                  ({formatViNumber(totalAmount, 2)})
                </span>
              )}
            </div>

            <ProcessingSignature />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReleasePrintProcessingPage;