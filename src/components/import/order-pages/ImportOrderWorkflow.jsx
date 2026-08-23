import {
  RiArrowRightLine,
  RiLoader4Line,
  RiTrainLine,
} from "react-icons/ri";


function ImportOrderWorkflow({
  selectedRow,

  approving = false,
  canApprove = false,

  onApprove,
}) {
  if (!selectedRow) {
    return null;
  }


  /* =========================================================
     STATUS
     ========================================================= */

  const status =
    String(
      selectedRow.status || ""
    )
      .trim()
      .toUpperCase();


  /* =========================================================
     CURRENT STEP
     ========================================================= */

  const currentStep =
    status === "COMPLETED"
      ? 3
      : status === "RECEIVED"
        ? 2
        : 1;


  const isWaitingDelivery =
    status === "WAITING_DELIVERY" ||
    status === "CANCELLED";


  const isReceived =
    status === "RECEIVED";


  /* =========================================================
     STEPS
     Không xử lý timestamp nữa.
     Bước đã đi tới chỉ hiển thị "Đã thực hiện".
     ========================================================= */

  const steps = [
    {
      number: 1,
      title: "Chờ nhận hàng",
    },
    {
      number: 2,
      title: "Đã nhận hàng",
    },
    {
      number: 3,
      title: "Đã hoàn thành",
    },
  ];


  /* =========================================================
     MESSAGE
     ========================================================= */

  const getMessage = () => {
    if (
      status === "WAITING_DELIVERY" ||
      status === "CANCELLED"
    ) {
      return "Lệnh nhập kho đang chờ nhận hàng. Hàng hóa đang trong quá trình vận chuyển về kho.";
    }

    if (
      status === "RECEIVED"
    ) {
      return "Lệnh nhập kho đã được nhận hàng. Tiếp tục kiểm nghiệm và hoàn thành phiếu nhập kho.";
    }

    if (
      status === "COMPLETED"
    ) {
      return "Lệnh nhập kho đã hoàn thành.";
    }

    return "Theo dõi trạng thái xử lý của lệnh nhập kho.";
  };


  /* =========================================================
     APPROVE
     ========================================================= */

  const showApproveButton =
    status === "WAITING_DELIVERY" ||
    status === "CANCELLED";


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <section className="import-order-workflow">
      <div className="import-order-workflow-title">
        QUY TRÌNH XỬ LÝ
      </div>


      <div className="import-order-workflow-steps">
        {steps.map(
          (
            step,
            index
          ) => {
            const isReached =
              step.number <=
              currentStep;


            const isCurrent =
              step.number ===
              currentStep;


            const isCompletedLine =
              currentStep >
              step.number;


            const isTransitLine =
              (
                isWaitingDelivery &&
                step.number === 1
              ) ||
              (
                isReceived &&
                step.number === 2
              );


            return (
              <div
                key={
                  step.number
                }
                className={[
                  "import-order-workflow-step",

                  isReached
                    ? "is-reached"
                    : "",

                  isCurrent
                    ? "is-current"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* =============================
                    STEP + RAIL
                    ============================= */}

                <div className="import-order-workflow-step-top">
                  <div className="import-order-workflow-circle">
                    {step.number}
                  </div>


                  {index <
                    steps.length -
                      1 && (
                    <div className="import-order-workflow-line">
                      <div
                        className={[
                          "import-order-workflow-line-progress",

                          isCompletedLine
                            ? "is-completed"
                            : "",

                          isTransitLine
                            ? "is-transit"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(" ")}
                      >
                        {isTransitLine && (
                          <div className="import-order-workflow-train">
                            <RiTrainLine />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>


                {/* =============================
                    STEP TEXT
                    ============================= */}

                <div className="import-order-workflow-step-content">
                  <div className="import-order-workflow-step-title">
                    {step.title}
                  </div>

                  <div className="import-order-workflow-step-date">
                    {isReached
                      ? "Đã thực hiện"
                      : "Chưa thực hiện"}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="import-order-workflow-footer">
        <div className="import-order-workflow-message">
          {getMessage()}
        </div>


        {showApproveButton && (
          <button
            type="button"
            className="import-order-workflow-approve-btn"
            disabled={
              approving ||
              !canApprove
            }
            onClick={
              onApprove
            }
          >
            {approving ? (
              <>
                <RiLoader4Line className="import-order-workflow-loading" />

                <span>
                  Đang trình duyệt...
                </span>
              </>
            ) : (
              <>
                <span>
                  Trình duyệt
                </span>

                <RiArrowRightLine />
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}


export default ImportOrderWorkflow;