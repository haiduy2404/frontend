import { NavLink, Outlet } from "react-router-dom";
import "../styles/RếaseLayout.css";

function ReleaseLayout() {
  return (
    <div className="release-layout-page">
      <div className="release-tabs">
        <NavLink
          to="/dashboard/activity/release/order"
          className={({ isActive }) =>
            isActive ? "release-tab active" : "release-tab"
          }
        >
          Lệnh xuất kho
        </NavLink>

        <NavLink
          to="/dashboard/activity/release/inward"
          className={({ isActive }) =>
            isActive ? "release-tab active" : "release-tab"
          }
        >
          Xuất kho
        </NavLink>
      </div>

      <div className="release-layout-content">
        <Outlet />
      </div>
    </div>
  );
}

export default ReleaseLayout;