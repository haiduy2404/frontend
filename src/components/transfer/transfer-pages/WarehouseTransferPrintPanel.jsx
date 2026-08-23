import { NavLink } from "react-router-dom";
import {
  RiFileTextLine,
  RiArrowRightSLine,
} from "react-icons/ri";

export default function WarehouseTransferPrintPanel({ detail }) {
  if (!detail?.code) return null;

  return (
    <section className="warehouse-transfer-side-card">
      <h3>CÁC PHIẾU IN</h3>

      <div className="warehouse-transfer-print-list">
        <NavLink
          to={`/dashboard/activity/transfer/print/${detail.code}`}
          className="warehouse-transfer-print-item"
        >
          <RiFileTextLine />

          <span>
            <strong>In phiếu điều chuyển</strong>
            <small>Phiếu điều chuyển kho</small>
          </span>

          <RiArrowRightSLine />
        </NavLink>
      </div>
    </section>
  );
}