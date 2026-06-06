import { NavLink, Outlet } from "react-router-dom";
import "../styles/ImportLayout.css";

function ImportLayout() {
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
      </div>

      <div className="import-layout-content">
        <Outlet />
      </div>
    </div>
  );
}

export default ImportLayout;