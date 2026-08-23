import {
  RiTrainLine,
} from "react-icons/ri";

function ReleaseOrderWorkflow({
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

  const currentStep =
    status === "COMPLETED"
      ? 3
      : status === "WAIT_TO_APPROVE"
        ? 2
        : 1;

  const isPending =
    status === "PENDING";

  const isWaitingApprove =
    status === "WAIT_TO_APPROVE";

  const steps = [
    {
      number: 1,
      status: "PENDING",
      label: "Tạo lệnh",
    },

    {
      number: 2,
      status: "WAIT_TO_APPROVE",
      label: "Đã duyệt",
    },

    {
      number: 3,
      status: "COMPLETED",
      label: "Hoàn thành",
    },
  ];

  const getMessage = () => {
    switch (status) {
      case "PENDING":
        return "Lệnh xuất kho đã được tạo. Đang chờ trình duyệt.";

      case "WAIT_TO_APPROVE":
        return "Lệnh xuất kho đang trong quá trình chờ duyệt.";

      case "COMPLETED":
        return "Lệnh xuất kho đã hoàn thành.";

      case "CANCELLED":
        return "Lệnh xuất kho đã bị hủy.";

      default:
        return "";
    }
  };

  return (
    <section className="release-order-workflow">
      <div className="release-order-workflow-title">
        QUY TRÌNH XỬ LÝ
      </div>

      <div className="release-order-workflow-steps">
        {steps.map(
          (
            step,
            index
          ) => {
            const reached =
              step.number <=
              currentStep;

            const completedLine =
              currentStep >
              step.number;

            const transitLine =
              (
                isPending &&
                step.number === 1
              ) ||
              (
                isWaitingApprove &&
                step.number === 2
              );

            return (
              <div
                key={step.status}
                className={[
                  "release-order-workflow-step",

                  reached
                    ? "is-reached"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="release-order-workflow-track">
                  <div className="release-order-workflow-node">
                    {step.number}
                  </div>

                  {index <
                    steps.length - 1 && (
                    <div className="release-order-workflow-line">
                      <div
                        className={[
                          "release-order-workflow-line-progress",

                          completedLine
                            ? "is-completed"
                            : "",

                          transitLine
                            ? "is-transit"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {transitLine && (
                          <div className="release-order-workflow-train">
                            <RiTrainLine />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="release-order-workflow-info">
                  <strong>
                    {step.label}
                  </strong>

                  <small>
                    {reached
                      ? "Đã thực hiện"
                      : "Chưa thực hiện"}
                  </small>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="release-order-workflow-message">
        {getMessage()}
      </div>
    </section>
  );
}

export default ReleaseOrderWorkflow;