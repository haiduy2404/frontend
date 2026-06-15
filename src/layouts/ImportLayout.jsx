import { NavLink, Outlet } from "react-router-dom";
import "../styles/ImportLayout.css";
import { useAuth } from "../contexts/AuthContext";

function ImportLayout() {
  const { canDo } = useAuth();

  const showInspectionTab = canDo(
    "update_warehouse_receipt_items",
    "complete_warehouse_receipt"
  );

  return (
    <div className="import-layout-page">
      <div className="import-tabs">
        <NavLink
          to="/dashboard/activity/import/order"
          className={({ isActive }) =>
            isActive ? "import-tab active" : "import-tab"
          }
        >
          Nhập kho
        </NavLink>

        {showInspectionTab && (
          <NavLink
            to="/dashboard/activity/import/inspection"
            className={({ isActive }) =>
              isActive ? "import-tab active" : "import-tab"
            }
          >
            Biên bản kiểm nghiệm
          </NavLink>
        )}
      </div>

      <div className="import-layout-content">
        <Outlet />
      </div>
    </div>
  );
}

export default ImportLayout;
