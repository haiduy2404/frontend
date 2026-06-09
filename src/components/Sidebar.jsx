import React, { useState } from "react";
import "../styles/Sidebar.css";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState("category");
  const [openMenu, setOpenMenu] = useState("");
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
        {/* QUẢN LÝ KHO */}
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
              Kho
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

        {/* HOẠT ĐỘNG KHO */}
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
        {/* BÁO CÁO */}
        <div
          className={`sidebar-item sidebar-report-wrap ${
            activeMenu === "report" ? "active-parent" : ""
          }`}
          onClick={() => toggleMenu("report")}
        >
          <span className="sidebar-icon">📊</span>
          {!collapsed && <span className="sidebar-text">Báo cáo</span>}
          {!collapsed && <span className="sidebar-arrow">›</span>}

          {!collapsed && openMenu === "report" && (
            <div
              className="report-mega-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="report-column">
                <div className="report-title">BÁO CÁO KHO</div>

                <NavLink
                  to="/dashboard/report/import-company"
                  className={({ isActive }) =>
                    isActive ? "report-link active" : "report-link"
                  }
                  onClick={() => {
                    setActiveMenu("report");
                    setOpenMenu("");
                  }}
                >
                  Báo cáo nhập kho
                </NavLink>

                <NavLink
                  to="/dashboard/report/export"
                  className={({ isActive }) =>
                    isActive ? "report-link active" : "report-link"
                  }
                  onClick={() => {
                    setActiveMenu("report");
                    setOpenMenu("");
                  }}
                >
                  Báo cáo xuất kho
                </NavLink>

                <NavLink
                  to="/dashboard/report/stock-card"
                  className={({ isActive }) =>
                    isActive ? "report-link active" : "report-link"
                  }
                  onClick={() => {
                    setActiveMenu("report");
                    setOpenMenu("");
                  }}
                >
                  Thẻ kho
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* DANH MỤC */}
        <div
          className={`sidebar-item sidebar-category-wrap ${
            activeMenu === "category" ? "active-parent" : ""
          }`}
          onClick={() => toggleMenu("category")}
        >
          <span className="sidebar-icon">▦</span>
          {!collapsed && <span className="sidebar-text">Danh mục</span>}
          {!collapsed && <span className="sidebar-arrow">›</span>}

          {!collapsed && openMenu === "category" && (
            <div
              className="category-mega-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="category-column">
                <div className="category-title">VẬT TƯ HÀNG HÓA</div>

                <NavLink
                  to="/dashboard/stock-manager/goods-list"
                  className={({ isActive }) =>
                    isActive ? "category-link active" : "category-link"
                  }
                  onClick={() => {
                    setActiveMenu("category");
                    setOpenMenu("");
                  }}
                >
                  Vật tư, hàng hóa
                </NavLink>

                <NavLink
                  to="/dashboard/stock-manager/unit-list"
                  className={({ isActive }) =>
                    isActive ? "category-link active" : "category-link"
                  }
                  onClick={() => {
                    setActiveMenu("category");
                    setOpenMenu("");
                  }}
                >
                  Đơn vị tính
                </NavLink>
              </div>

              <div className="category-column">
                <div className="category-title">ĐỐI TƯỢNG</div>

                <NavLink
                  to="/dashboard/stock-manager/company-list"
                  className={({ isActive }) =>
                    isActive ? "category-link active" : "category-link"
                  }
                  onClick={() => {
                    setActiveMenu("category");
                    setOpenMenu("");
                  }}
                >
                  Khách hàng / Nhà cung cấp
                </NavLink>

                <NavLink
                  to="/dashboard/stock-manager/employee-list"
                  className={({ isActive }) =>
                    isActive ? "category-link active" : "category-link"
                  }
                  onClick={() => {
                    setActiveMenu("category");
                    setOpenMenu("");
                  }}
                >
                  Nhân viên
                </NavLink>

                <div className="category-title category-title-second">
                  KHÁC
                </div>

                <NavLink
                  to="/dashboard/stock-manager/organization-list"
                  className={({ isActive }) =>
                    isActive ? "category-link active" : "category-link"
                  }
                  onClick={() => {
                    setActiveMenu("category");
                    setOpenMenu("");
                  }}
                >
                  Cơ cấu tổ chức
                </NavLink>
              </div>
            </div>
          )}
        </div>

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