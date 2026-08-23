import {
  RiTrainLine,
} from "react-icons/ri";

function WarehouseReleaseWorkflow({
  selectedRow,
}) {
  if (!selectedRow) {
    return null;
  }

  const status = String(
    selectedRow.status || ""
  )
    .trim()
    .toUpperCase();

  /*
   * CANCELLED ở Phase 2 được xem như quay lại
   * trạng thái chờ duyệt để có thể gửi lại lệnh.
   */
const isWaitingApprove =
  status === "WAIT_TO_APPROVE" ||
  status === "CANCELLED";

const isInTransit =
  isWaitingApprove ||
  status === "PENDING" ||
  status === "WAITING_RELEASE";

const isCompleted =
  status === "COMPLETED" ||
  status === "RELEASED";

  /*
   * Bước 1 được xem là đã tới với tất cả
   * các trạng thái hợp lệ của workflow này.
   */
  const isFirstStepReached =
    isWaitingApprove ||
    isInTransit ||
    isCompleted;

  const getMessage = () => {
    switch (status) {
      case "WAIT_TO_APPROVE":
      case "CANCELLED":
        return "Lệnh đang chờ duyệt trước khi thực hiện xuất kho.";

      case "PENDING":
      case "WAITING_RELEASE":
        return "Lệnh đã được duyệt và đang trong quá trình thực hiện xuất kho.";

      case "RELEASED":
      case "COMPLETED":
        return "Lệnh xuất kho đã hoàn thành.";

      default:
        return "";
    }
  };

  return (
    <section className="warehouse-release-workflow">
      <div className="warehouse-release-section-title">
        QUY TRÌNH XỬ LÝ
      </div>

      <div className="warehouse-release-workflow-steps">
        {/* =================================================
            STEP 1 - CHỜ DUYỆT
            ================================================= */}
        <div
          className={[
            "warehouse-release-workflow-step",

            isFirstStepReached
              ? "is-reached"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="warehouse-release-workflow-track">
            <div className="warehouse-release-workflow-node">
              1
            </div>

            <div className="warehouse-release-workflow-line">
              <div
                className={[
                  "warehouse-release-workflow-line-progress",

                  isCompleted
                    ? "is-completed"
                    : "",

                  isInTransit
                    ? "is-transit"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isInTransit && (
                  <div className="warehouse-release-workflow-train">
                    <RiTrainLine />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="warehouse-release-workflow-info">
            <strong>
              Chờ duyệt
            </strong>

            <small>
              {isWaitingApprove
                ? "Đang chờ duyệt"
                : isInTransit ||
                    isCompleted
                  ? "Đã thực hiện"
                  : "Chưa thực hiện"}
            </small>
          </div>
        </div>

        {/* =================================================
            STEP 2 - HOÀN THÀNH
            ================================================= */}
        <div
          className={[
            "warehouse-release-workflow-step",

            isCompleted
              ? "is-reached"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="warehouse-release-workflow-track">
            <div className="warehouse-release-workflow-node">
              2
            </div>
          </div>

          <div className="warehouse-release-workflow-info">
            <strong>
              Hoàn thành
            </strong>

            <small>
              {isCompleted
                ? "Đã thực hiện"
                : "Chưa thực hiện"}
            </small>
          </div>
        </div>
      </div>

      <div className="warehouse-release-workflow-message">
        {getMessage()}
      </div>
    </section>
  );
}

export default WarehouseReleaseWorkflow;