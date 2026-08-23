import {
  RiTrainLine,
} from "react-icons/ri";

import {
  formatDateTimeVi,
} from "./utils/warehouseTransferUtils";


function ProcessNode({
  reached,
  number,
  title,
  time,
}) {
  return (
    <div
      className={[
        "warehouse-transfer-process-node",
        reached ? "is-reached" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="warehouse-transfer-process-circle">
        {number}
      </div>

      <div className="warehouse-transfer-process-info">
        <strong>
          {title}
        </strong>

        <span>
          {reached
            ? "Đã thực hiện"
            : "Chưa thực hiện"}
        </span>

        <small>
          {time
            ? formatDateTimeVi(time)
            : "-"}
        </small>
      </div>
    </div>
  );
}


function ProcessLine({
  completed = false,
  transit = false,
}) {
  return (
    <div className="warehouse-transfer-process-line">
      <div
        className={[
          "warehouse-transfer-process-line-progress",

          completed
            ? "is-completed"
            : "",

          transit
            ? "is-transit"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {transit && (
          <div className="warehouse-transfer-process-train">
            <RiTrainLine />
          </div>
        )}
      </div>
    </div>
  );
}


export default function WarehouseTransferProcessPanel({
  detail,
}) {
  if (!detail) {
    return null;
  }

  const status = String(
    detail.status || ""
  )
    .trim()
    .toUpperCase();


  /*
   * CANCELLED hiện tại của Điều chuyển
   * đang được xem như quay lại trạng thái
   * Đang điều chuyển.
   */
  const isTransferring =
    status === "PENDING" ||
    status === "CANCELLED";

  const isCompleted =
    status === "COMPLETED";


  /*
   * Với dữ liệu hiện tại:
   *
   * Tạo phiếu          -> đã có phiếu là đã tới
   * Đang điều chuyển   -> PENDING / CANCELLED / COMPLETED
   * Hoàn thành         -> COMPLETED
   */
  const createReached = true;

  const transferringReached =
    isTransferring ||
    isCompleted;

  const completedReached =
    isCompleted;


  const getMessage = () => {
    if (isCompleted) {
      return "Phiếu điều chuyển đã được hoàn thành.";
    }

    if (isTransferring) {
      return "Phiếu đang trong quá trình điều chuyển.";
    }

    return "";
  };


  return (
    <section className="warehouse-transfer-card warehouse-transfer-process-card">

      <h3>
        QUY TRÌNH XỬ LÝ
      </h3>


      <div className="warehouse-transfer-process-track">

        {/* ================= KHO XUẤT ================= */}

        <div className="warehouse-transfer-warehouse-node">
          <div className="warehouse-transfer-warehouse-icon">
            ▣
          </div>

          <strong>
            Kho xuất
          </strong>

          <span>
            {detail.fromWarehouse || "-"}
          </span>
        </div>


        {/* Kho xuất -> Tạo phiếu */}

        <ProcessLine
          completed
        />


        {/* ================= TẠO PHIẾU ================= */}

        <ProcessNode
          reached={createReached}
          number="1"
          title="Tạo phiếu"
          time={detail.createdAt}
        />


        {/* Tạo phiếu -> Đang điều chuyển */}

        <ProcessLine
          completed={transferringReached}
        />


        {/* ================= ĐANG ĐIỀU CHUYỂN ================= */}

        <ProcessNode
          reached={transferringReached}
          number="2"
          title="Đang điều chuyển"
          time={detail.startedAt}
        />


        {/* 
            Đang điều chuyển -> Hoàn thành

            PENDING:
            đường vàng 62% + tàu ở đầu đường vàng.

            COMPLETED:
            đường vàng chạy hết 100%, không còn tàu.
        */}

        <ProcessLine
          completed={isCompleted}
          transit={isTransferring}
        />


        {/* ================= HOÀN THÀNH ================= */}

        <ProcessNode
          reached={completedReached}
          number="3"
          title="Hoàn thành"
          time={detail.completedAt}
        />


        {/* Hoàn thành -> Kho nhập */}

        <ProcessLine
          completed={isCompleted}
        />


        {/* ================= KHO NHẬP ================= */}

        <div
          className={[
            "warehouse-transfer-warehouse-node",
            "destination",
            isCompleted
              ? "is-reached"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="warehouse-transfer-warehouse-icon">
            ⌂
          </div>

          <strong>
            Kho nhập
          </strong>

          <span>
            {detail.toWarehouse || "-"}
          </span>
        </div>

      </div>


      <div className="warehouse-transfer-process-message">
        {getMessage()}
      </div>

    </section>
  );
}