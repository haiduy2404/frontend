import {
  RiEdit2Line,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiFlaskLine,
  RiArrowDownSLine,
  RiLoader4Line,
} from "react-icons/ri";


function ImportOrderSidePanel({
  selectedRow,

  completing,
  rejecting,

  canApprove,

  canUpdate,
  canDelete,

  onApprove,
  onEdit,
  onDelete,

  onInspection,
  onReject,

  onPrintTransfer,
  onPrintReceipt,
  onPrintInspection,
}) {
  if (!selectedRow) {
    return null;
  }


  const status =
    String(
      selectedRow.status || ""
    ).toUpperCase();


  const isWaiting =
    status === "WAITING_DELIVERY" ||
    status === "CANCELLED";

  const isReceived =
    status ===
    "RECEIVED";

  const isCompleted =
    status ===
    "COMPLETED";


  return (
    <aside className="import-order-detail-side-panel">
      {/* =================================
          THAO TÁC
      ================================= */}
      <section className="import-order-side-card">
        <div className="import-order-side-title">
          THAO TÁC
        </div>

        <div className="import-order-side-actions">
          {/* =============================
              CHỈNH SỬA
          ============================= */}
          <button
            type="button"
            className="import-order-side-action edit"
            disabled={
              !canUpdate ||
              isCompleted
            }
            onClick={
              onEdit
            }
          >
            <div className="import-order-side-action-icon">
              <RiEdit2Line />
            </div>

            <div className="import-order-side-action-text">
              <strong>
                Chỉnh sửa
              </strong>

              <span>
                Chỉnh sửa thông tin phiếu nhập
              </span>
            </div>
          </button>


          {/* =============================
              TRÌNH DUYỆT
          ============================= */}
          <button
            type="button"
            className="import-order-side-action"
            disabled={
              !isWaiting ||
              !canApprove ||
              completing
            }
            onClick={
              onApprove
            }
          >
            <div className="import-order-side-action-icon">
              {completing ? (
                <RiLoader4Line className="import-action-loading-icon" />
              ) : (
                <RiCheckboxCircleLine />
              )}
            </div>

            <div className="import-order-side-action-text">
              <strong>
                {completing
                  ? "Đang duyệt lệnh..."
                  : "Duyệt lệnh"}
              </strong>

              <span>
                Chuyển sang Đã nhận hàng
              </span>
            </div>
          </button>


         {/* =============================
            KIỂM NGHIỆM
        ============================= */}
        <button
        type="button"
        className="import-order-side-action"
        disabled={
        !isReceived &&
        !isCompleted
        }
        onClick={onInspection}
        >
        <div className="import-order-side-action-icon">
            <RiFlaskLine />
        </div>

        <div className="import-order-side-action-text">
            <strong>
            Kiểm nghiệm
            </strong>

            <span>
            Nhập kết quả kiểm nghiệm
            </span>
        </div>
        </button>


          {/* =============================
              HOÀN THÀNH

              Không cho hoàn thành trực tiếp
              tại sidebar.

              Phải vào Kiểm nghiệm -> Hoàn thành
              để lưu accepted/rejected trước.
          ============================= */}
          <button
            type="button"
            className="import-order-side-action"
            disabled
            title="Hoàn thành trong bước kiểm nghiệm"
          >
            <div className="import-order-side-action-icon">
              <RiCheckboxCircleLine />
            </div>

            <div className="import-order-side-action-text">
              <strong>
                Hoàn thành
              </strong>

              <span>
                Hoàn thành trong bước kiểm nghiệm
              </span>
            </div>
          </button>


        {/* =============================
            TỪ CHỐI
        ============================= */}
        <button
        type="button"
        className="import-order-side-action danger"
        disabled={
            !isCompleted ||
            rejecting
        }
        onClick={onReject}
        >
        <div className="import-order-side-action-icon">
            {rejecting ? (
            <RiLoader4Line className="import-action-loading-icon" />
            ) : (
            <RiCloseCircleLine />
            )}
        </div>

        <div className="import-order-side-action-text">
            <strong>
            {rejecting
                ? "Đang từ chối..."
                : "Từ chối"}
            </strong>

            <span>
            Trả về trạng thái chờ nhận hàng
            </span>
        </div>
        </button>


          {/* =============================
              XÓA
          ============================= */}
          <button
            type="button"
            className="import-order-side-action danger"
            disabled={
              !canDelete
            }
            onClick={
              onDelete
            }
          >
            <div className="import-order-side-action-icon">
              <RiDeleteBin6Line />
            </div>

            <div className="import-order-side-action-text">
              <strong>
                Xóa phiếu
              </strong>

              <span>
                Xóa phiếu nhập kho đang chọn
              </span>
            </div>
          </button>
        </div>
      </section>

    {/* =================================
        CÁC PHIẾU IN
    ================================= */}
    <section className="import-order-side-card">
    <div className="import-order-side-title">
        CÁC PHIẾU IN
    </div>

    <div className="import-order-print-list">
        {/* ĐỀ NGHỊ CHUYỂN TIỀN */}
        <button
        type="button"
        className="import-order-print-item"
        onClick={onPrintTransfer}
        >
        <RiFileTextLine />

        <span>
            In phiếu đề nghị chuyển tiền
        </span>

        <RiArrowDownSLine />
        </button>


        {/* PHIẾU NHẬP KHO */}
        <button
        type="button"
        className="import-order-print-item"
        onClick={onPrintReceipt}
        >
        <RiFileTextLine />

        <span>
            In phiếu nhập kho
        </span>

        <RiArrowDownSLine />
        </button>


        {/* BIÊN BẢN KIỂM NGHIỆM */}
        <button
        type="button"
        className="import-order-print-item"
        disabled={
            !isReceived &&
            !isCompleted
        }
        onClick={onPrintInspection}
        >
        <RiFileTextLine />

        <span>
            In biên bản kiểm nghiệm
        </span>

        <RiArrowDownSLine />
        </button>
    </div>
    </section>


      {/* =================================
          TÀI LIỆU LIÊN QUAN
      ================================= */}
      <section className="import-order-side-card">
        <div className="import-order-side-title">
          TÀI LIỆU LIÊN QUAN
        </div>

        <div className="import-order-document-list">
          <div className="import-order-document-item">
            <RiFileTextLine />

            <div>
              <strong>
                Đơn đặt hàng
              </strong>

              <span>
                Chưa có tài liệu
              </span>
            </div>
          </div>


          <div className="import-order-document-item">
            <RiFileTextLine />

            <div>
              <strong>
                Biên bản kiểm nghiệm
              </strong>

              <span>
                Chưa có tài liệu
              </span>
            </div>
          </div>


          <div className="import-order-document-item">
            <RiFileTextLine />

            <div>
              <strong>
                Hóa đơn nhà cung cấp
              </strong>

              <span>
                Chưa có tài liệu
              </span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}


export default ImportOrderSidePanel;