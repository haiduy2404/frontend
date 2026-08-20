import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RiArrowLeftLine } from "react-icons/ri";
import "../../../styles/Show_Detail_Goods_Print.css";
import { printWithPageSize, PAGE_SIZE } from "../../../utils/printUtils";
import { getReleaseOrderByCode } from "../../../services/releaseOrderService";

function ShowDetailGoodsPrint() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(false);

  const unwrapData = (response) =>
    response?.data?.data ?? response?.data ?? response ?? null;

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const text = String(value).trim();
    if (!text) return 0;

    let normalized = text;

    if (text.includes(",")) {
      normalized = text.replace(/\./g, "").replace(",", ".");
    }

    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  };

  const formatViNumber = (value, fractionDigits = 2) =>
    parseNumber(value).toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

  const formatViDate = (value) => {
    if (!value) return "—";

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("/")) return dateOnly;

    const [year, month, day] = dateOnly.split("-");

    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchRelease = async () => {
      if (!code) return;

      try {
        setLoading(true);

        const response = await getReleaseOrderByCode(code);
        setRelease(unwrapData(response));
      } catch (error) {
        console.error(
          "LOAD RELEASE REVIEW ERROR:",
          error.response?.data || error
        );

        alert(
          error.response?.data?.message ||
            error.response?.data?.detail ||
            "Không tải được thông tin phiếu xuất kho"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRelease();
  }, [code]);

  const releaseLines =
    release?.items ||
    release?.inventory_lines ||
    release?.release_inventory_lines ||
    release?.inventory ||
    release?.details ||
    [];

  const rows = useMemo(
    () =>
      releaseLines.map((line, index) => ({
        id: line.id || line.item_id || index + 1,

        goods_name:
          line.goods_name ||
          line.goods?.name ||
          "",

        goods_code:
          line.goods_code ||
          line.goods?.code ||
          "",

        unit_name:
          line.default_goods_unit_name ||
          line.goods_unit_name ||
          line.unit_name ||
          line.goods_unit?.name ||
          "",

        requested_quantity:
          line.request_quantity_in_default_unit ??
          line.requested_quantity ??
          line.request_quantity ??
          line.original_quantity ??
          0,
      })),
    [releaseLines]
  );

  const ROWS_PER_PAGE = 32;

  const pages = useMemo(() => {
    if (rows.length === 0) {
      return [[]];
    }

    const result = [];

    for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
      result.push(rows.slice(i, i + ROWS_PER_PAGE));
    }

    return result;
  }, [rows]);

  const totalRequested = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + parseNumber(row.requested_quantity),
        0
      ),
    [rows]
  );

  const handlePrint = () => {
    printWithPageSize(
      PAGE_SIZE.A4_PORTRAIT.width,
      PAGE_SIZE.A4_PORTRAIT.height
    );
  };


  if (loading) {
    return (
      <div className="show-goods-print-loading">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!release) {
    return (
      <div className="show-goods-print-loading">
        Không tìm thấy dữ liệu phiếu xuất kho.
      </div>
    );
  }

    return (
      <div className="show-goods-print-page">
        {/* TOOLBAR LUÔN HIỆN TRÊN MÀN HÌNH */}
        <div className="show-goods-print-toolbar">
          <button
            type="button"
            className="show-goods-print-back-btn"
            onClick={() => navigate(-1)}
          >
            <RiArrowLeftLine />
            Quay lại
          </button>

          <button
            type="button"
            className="show-goods-print-print-btn"
            onClick={handlePrint}
          >
            In
          </button>
        </div>

        {/* CHỈ VÙNG GIẤY ĐƯỢC SCROLL */}
        <div className="show-goods-print-scroll">
          {pages.map((pageRows, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;

            const startIndex = pageIndex * ROWS_PER_PAGE;

            return (
              <div
                key={`page-${pageIndex}`}
                className={`show-goods-print-paper ${
                  pageIndex > 0 ? "show-goods-print-paper-break" : ""
                }`}
              >
                {/* THÔNG TIN PHIẾU CHỈ HIỆN TRANG 1 */}
                {isFirstPage && (
                  <div className="show-goods-print-info-grid">
                    <div className="show-goods-print-info-item">
                      <span>Số phiếu XK</span>
                      <strong>{code || release?.code || "—"}</strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Kỳ</span>
                      <strong>{release?.terms || "—"}</strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Ngày xuất kho</span>
                      <strong>
                        {formatViDate(release?.release_date)}
                      </strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Xuất tại kho</span>

                      <strong>
                        {release?.warehouse?.code
                          ? `${release.warehouse.code} - ${
                              release?.warehouse?.name || ""
                            }`
                          : release?.warehouse?.name ||
                            release?.warehouse_name ||
                            "—"}
                      </strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Đơn vị lĩnh vật tư</span>

                      <strong>
                        {release?.receiver_unit?.name ||
                          release?.receiver_unit ||
                          "—"}
                      </strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Đối tượng xuất kho</span>

                      <strong>
                        {release?.release_target?.name ||
                          release?.release_target ||
                          "—"}
                      </strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Hợp đồng số</span>
                      <strong>
                        {release?.contract_number || "—"}
                      </strong>
                    </div>

                    <div className="show-goods-print-info-item">
                      <span>Diễn giải</span>
                      <strong>
                        {release?.description || "—"}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="show-goods-print-table-wrapper">
                  <table className="show-goods-print-table">
                    <colgroup>
                      <col className="show-print-col-stt" />
                      <col className="show-print-col-name" />
                      <col className="show-print-col-code" />
                      <col className="show-print-col-unit" />
                      <col className="show-print-col-qty" />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>TT</th>

                        <th>
                          Tên, nhãn hiệu quy cách, phẩm chất vật tư,
                          dụng cụ sản phẩm, hàng hóa
                        </th>

                        <th>Mã VT</th>
                        <th>Đơn vị tính</th>
                        <th>SL yêu cầu</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageRows.length > 0 ? (
                        pageRows.map((line, index) => (
                          <tr
                            key={line.id}
                            className="show-goods-print-item-row"
                          >
                            <td className="show-print-center">
                              {startIndex + index + 1}
                            </td>

                            <td>
                              {line.goods_name || ""}
                            </td>

                            <td className="show-print-center">
                              {line.goods_code || ""}
                            </td>

                            <td className="show-print-center">
                              {line.unit_name || ""}
                            </td>

                            <td className="show-print-number">
                              {formatViNumber(
                                line.requested_quantity,
                                2
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="show-goods-print-empty"
                          >
                            Phiếu chưa có vật tư.
                          </td>
                        </tr>
                      )}

                      {/* TỔNG CHỈ HIỆN Ở TRANG CUỐI */}
                      {isLastPage && rows.length > 0 && (
                        <tr className="show-goods-print-total-row">
                          <td colSpan={4}>
                            Tổng cộng
                          </td>

                          <td className="show-print-number">
                            {formatViNumber(totalRequested, 2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {isLastPage && (
                  <div className="show-goods-print-count">
                    Tổng số: <strong>{rows.length}</strong> vật tư
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
}

export default ShowDetailGoodsPrint;