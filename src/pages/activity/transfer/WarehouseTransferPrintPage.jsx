import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../../styles/WarehouseTransferPrintPage.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import { getWarehouseTransferByCode } from "../../../services/warehouseTransferService";

function WarehouseTransferPrintPage() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [transfer, setTransfer] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const DEFAULT_PRINT_ROWS = 7;
  const FIRST_PAGE_MAX_ROWS = 7;
  const NEXT_PAGE_MAX_ROWS = 15;

  const firstPageRows = useMemo(() => {
  if (detailRows.length <= FIRST_PAGE_MAX_ROWS) {
    return Array.from({
      length: Math.max(DEFAULT_PRINT_ROWS, detailRows.length),
    }).map((_, index) => detailRows[index] || null);
  }

  return detailRows.slice(0, FIRST_PAGE_MAX_ROWS);
}, [detailRows]);

  const remainingRows = useMemo(() => {
    if (detailRows.length <= FIRST_PAGE_MAX_ROWS) return [];

    return detailRows.slice(FIRST_PAGE_MAX_ROWS);
  }, [detailRows]);

  const extraPages = useMemo(() => {
    const pages = [];

    for (let i = 0; i < remainingRows.length; i += NEXT_PAGE_MAX_ROWS) {
      pages.push(
        remainingRows.slice(i, i + NEXT_PAGE_MAX_ROWS)
      );
    }

    return pages;
  }, [remainingRows]);

  const hasExtraPages = extraPages.length > 0;

  const unwrapData = (response) => response?.data || response;

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const text = String(value).trim();
    if (!text) return 0;

    let normalized = text;

    if (text.includes(",")) {
      normalized = text.replace(/\./g, "").replace(",", ".");
    } else if ((text.match(/\./g) || []).length > 1) {
      normalized = text.replace(/\./g, "");
    }

    const number = Number(normalized);
    return Number.isNaN(number) ? 0 : number;
  };

  const formatPrintQuantity = (value) => {
    if (value === null || value === undefined || value === "") return "";

    return parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  const formatDateText = (value) => {
    if (!value) return "Ngày ........ tháng ........ năm 20..........";

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("/")) {
      const [day, month, year] = dateOnly.split("/");
      return `Ngày ${day} tháng ${month} năm ${year}`;
    }

    if (dateOnly.includes("-")) {
      const parts = dateOnly.split("-");

      if (parts[0]?.length === 4) {
        const [year, month, day] = parts;
        return `Ngày ${day} tháng ${month} năm ${year}`;
      }

      const [day, month, year] = parts;
      return `Ngày ${day} tháng ${month} năm ${year}`;
    }

    return `Ngày ${dateOnly}`;
  };

  useEffect(() => {
    const fetchTransfer = async () => {
      if (!code) return;

      try {
        setLoading(true);

        const response = await getWarehouseTransferByCode(code);
        const data = unwrapData(response);

        setTransfer(data);

        const rows = Array.isArray(data?.items) ? data.items : [];

        const mappedRows = rows.map((item, index) => ({
          id: item.item_id || item.id || index + 1,
          goods_code: item.goods_code || item.goods?.code || "",
          goods_name: item.goods_name || item.goods?.name || "",
          unit_name:
            item.goods_unit_name ||
            item.unit_name ||
            item.goods_unit?.name ||
            "",
          requested_quantity:
            item.quantity ??
            item.transfer_quantity ??
            item.requested_quantity ??
            0,
          actual_quantity:
            item.quantity ??
            item.transfer_quantity ??
            item.actual_quantity ??
            0,
          note: item.note || "",
        }));

        setDetailRows(mappedRows);
      } catch (error) {
        console.error("LOAD TRANSFER PRINT ERROR:", error.response?.data || error);
        alert("Không tải được dữ liệu phiếu điều chuyển");
        setTransfer(null);
        setDetailRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [code]);


  const sourceWarehouse =
    transfer?.source_warehouse_name ||
    transfer?.from_warehouse_name ||
    transfer?.source_warehouse?.name ||
    transfer?.from_warehouse?.name ||
    "";

  const destinationWarehouse =
    transfer?.destination_warehouse_name ||
    transfer?.to_warehouse_name ||
    transfer?.destination_warehouse?.name ||
    transfer?.to_warehouse?.name ||
    "";

  if (loading) {
    return <div className="transfer-print-loading">Đang tải dữ liệu...</div>;
  }

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

      <div className="transfer-print-scroll">
        <div className="transfer-print-paper">
          <div className="transfer-print-unit">
            Đơn vị : ..............................
          </div>

          <div className="transfer-print-title-block">
            <h1>PHIẾU CHUYỂN VẬT TƯ TRONG NỘI BỘ</h1>
            <div>{formatDateText(transfer?.transfer_date)}</div>
          </div>

          <div className="transfer-print-info">
            <div>
              Xuất kho : <span>{sourceWarehouse}</span>
            </div>
            <div>
              Nhập kho : <span>{destinationWarehouse}</span>
            </div>
          </div>

          <table className="transfer-print-table">
            <colgroup>
              <col className="transfer-print-col-stt" />
              <col className="transfer-print-col-name" />
              <col className="transfer-print-col-code" />
              <col className="transfer-print-col-unit" />
              <col className="transfer-print-col-qty" />
              <col className="transfer-print-col-qty" />
              <col className="transfer-print-col-note" />
            </colgroup>

            <thead>
              <tr>
                <th rowSpan={2}>TT</th>
                <th rowSpan={2}>TÊN NHÃN HIỆU<br />QUY CÁCH VẬT TƯ</th>
                <th rowSpan={2}>MÃ<br />SỐ</th>
                <th rowSpan={2}>ĐVT</th>
                <th colSpan={2}>SỐ LƯỢNG</th>
                <th rowSpan={2}>GHI<br />CHÚ</th>
              </tr>

              <tr>
                <th>YÊU CẦU</th>
                <th>THỰC PHÁT</th>
              </tr>

              <tr className="transfer-print-symbol-row">
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
                <th>6</th>
                <th>7</th>
              </tr>
            </thead>

            <tbody>
              {firstPageRows.map((item, index) => (
                <tr key={index}>
                  <td className="transfer-print-center-cell">
                    {item ? index + 1 : ""}
                  </td>

                  <td className="transfer-print-name-cell">
                    {item?.goods_name || ""}
                  </td>

                  <td className="transfer-print-center-cell">
                    {item?.goods_code || ""}
                  </td>

                  <td className="transfer-print-center-cell">
                    {item?.unit_name || ""}
                  </td>

                  <td className="transfer-print-number-cell">
                    {item ? formatPrintQuantity(item.requested_quantity) : ""}
                  </td>

                  <td className="transfer-print-number-cell">
                    {item ? formatPrintQuantity(item.actual_quantity) : ""}
                  </td>

                  <td className="transfer-print-note-cell">
                    {item?.note || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {!hasExtraPages && (
          <div className="transfer-print-signature-row">
            <div>
              <strong>NGƯỜI NHẬN</strong>
            </div>

            <div>
              <strong>PT ĐƠN VỊ</strong>
            </div>

            <div>
              <strong>NGƯỜI GIAO</strong>
            </div>

            <div>
              <strong>PHỤ TRÁCH CUNG TIÊU</strong>
            </div>
          </div>
        )}
        </div>
        {extraPages.map((pageRows, pageIndex) => {
          const isLastPage = pageIndex === extraPages.length - 1;

          const startIndex =
            FIRST_PAGE_MAX_ROWS +
            pageIndex * NEXT_PAGE_MAX_ROWS;

          return (
            <div
              key={pageIndex}
              className="transfer-print-paper transfer-print-paper-break"
            >
              <table className="transfer-print-table">
                <colgroup>
                  <col className="transfer-print-col-stt" />
                  <col className="transfer-print-col-name" />
                  <col className="transfer-print-col-code" />
                  <col className="transfer-print-col-unit" />
                  <col className="transfer-print-col-qty" />
                  <col className="transfer-print-col-qty" />
                  <col className="transfer-print-col-note" />
                </colgroup>

                <thead>
                  <tr>
                    <th rowSpan={2}>TT</th>

                    <th rowSpan={2}>
                      TÊN NHÃN HIỆU
                      <br />
                      QUY CÁCH VẬT TƯ
                    </th>

                    <th rowSpan={2}>
                      MÃ
                      <br />
                      SỐ
                    </th>

                    <th rowSpan={2}>ĐVT</th>

                    <th colSpan={2}>SỐ LƯỢNG</th>

                    <th rowSpan={2}>
                      GHI
                      <br />
                      CHÚ
                    </th>
                  </tr>

                  <tr>
                    <th>YÊU CẦU</th>
                    <th>THỰC PHÁT</th>
                  </tr>

                  <tr className="transfer-print-symbol-row">
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                    <th>5</th>
                    <th>6</th>
                    <th>7</th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((item, index) => (
                    <tr key={index}>
                      <td className="transfer-print-center-cell">
                        {startIndex + index + 1}
                      </td>

                      <td className="transfer-print-name-cell">
                        {item?.goods_name || ""}
                      </td>

                      <td className="transfer-print-center-cell">
                        {item?.goods_code || ""}
                      </td>

                      <td className="transfer-print-center-cell">
                        {item?.unit_name || ""}
                      </td>

                      <td className="transfer-print-number-cell">
                        {formatPrintQuantity(
                          item?.requested_quantity
                        )}
                      </td>

                      <td className="transfer-print-number-cell">
                        {formatPrintQuantity(
                          item?.actual_quantity
                        )}
                      </td>

                      <td className="transfer-print-note-cell">
                        {item?.note || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isLastPage && (
                <div className="transfer-print-signature-row">
                  <div>
                    <strong>NGƯỜI NHẬN</strong>
                  </div>

                  <div>
                    <strong>PT ĐƠN VỊ</strong>
                  </div>

                  <div>
                    <strong>NGƯỜI GIAO</strong>
                  </div>

                  <div>
                    <strong>PHỤ TRÁCH CUNG TIÊU</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WarehouseTransferPrintPage;