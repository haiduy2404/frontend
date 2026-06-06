import React, { useState } from "react";
import "../styles/Sidebar.css";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState("warehouse");
  const [openMenu, setOpenMenu] = useState("warehouse");
  const [collapsed, setCollapsed] = useState(false);

  const toggleMenu = (menu) => {
    setActiveMenu(menu);

    if (!collapsed) {
      setOpenMenu(openMenu === menu ? "" : menu);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-menu">
        <NavLink
          to="/dashboard/stock-manager/goods-list"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
          onClick={() => {
            setActiveMenu("goods");
            setOpenMenu("");
          }}
        >
          <span className="sidebar-icon">📦</span>
          {!collapsed && <span className="sidebar-text">Danh mục VTHH</span>}
        </NavLink>

        <NavLink
          to="/dashboard/stock-manager/company-list"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
          onClick={() => {
            setActiveMenu("company");
            setOpenMenu("");
          }}
        >
          <span className="sidebar-icon">🏢</span>
          {!collapsed && <span className="sidebar-text">Danh mục công ty</span>}
        </NavLink>

        <div
          className={`sidebar-item ${
            activeMenu === "warehouse" ? "active-parent" : ""
          }`}
          onClick={() => toggleMenu("warehouse")}
        >
          <span className="sidebar-icon">🏠</span>
          {!collapsed && <span className="sidebar-text">Quản lý kho</span>}
          {!collapsed && (
            <span className="sidebar-arrow">
              {openMenu === "warehouse" ? "⌄" : "›"}
            </span>
          )}
        </div>

        {!collapsed && openMenu === "warehouse" && (
          <div className="sidebar-submenu">
            <NavLink
              to="/dashboard/stock-manager/stock-list"
              className={({ isActive }) =>
                isActive ? "sidebar-subitem active" : "sidebar-subitem"
              }
              onClick={() => setActiveMenu("warehouse")}
            >
              Danh mục kho
            </NavLink>

            <NavLink
              to="/dashboard/stock-manager/opening-stock"
              className={({ isActive }) =>
                isActive ? "sidebar-subitem active" : "sidebar-subitem"
              }
              onClick={() => setActiveMenu("warehouse")}
            >
              Tồn kho đầu kỳ
            </NavLink>
          </div>
        )}

        <div
          className={`sidebar-item ${
            activeMenu === "activity" ? "active-parent" : ""
          }`}
          onClick={() => toggleMenu("activity")}
        >
          <span className="sidebar-icon">🛒</span>
          {!collapsed && <span className="sidebar-text">Hoạt động kho</span>}
          {!collapsed && (
            <span className="sidebar-arrow">
              {openMenu === "activity" ? "⌄" : "›"}
            </span>
          )}
        </div>

        {!collapsed && openMenu === "activity" && (
          <div className="sidebar-submenu">
            <NavLink
              to="/dashboard/activity/import"
              className={({ isActive }) =>
                isActive ? "sidebar-subitem active" : "sidebar-subitem"
              }
              onClick={() => setActiveMenu("activity")}
            >
              Nhập kho
            </NavLink>

            <NavLink
              to="/dashboard/activity/export"
              className={({ isActive }) =>
                isActive ? "sidebar-subitem active" : "sidebar-subitem"
              }
              onClick={() => setActiveMenu("activity")}
            >
              Xuất kho
            </NavLink>
          </div>
        )}
      </div>

      <div className="sidebar-bottom">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "→" : "↤ Thu gọn"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;