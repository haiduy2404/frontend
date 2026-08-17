import React, { useState } from "react";
import "../styles/Sidebar.css";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState("category");
  const [openMenu, setOpenMenu] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
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
                    Tồn kho
                  </NavLink>
              </div>
            )}

        {/* HOẠT ĐỘNG KHO */}
          <>
            <div
              className={`sidebar-item ${
                activeMenu === "activity" ? "active-parent" : ""
              }`}
              onClick={() => toggleMenu("activity")}
            >
              <span className="sidebar-icon">🛒</span>
              {!collapsed && (
                <span className="sidebar-text">Hoạt động kho</span>
              )}
              {!collapsed && (
                <span className="sidebar-arrow">
                  {openMenu === "activity" ? "⌄" : "›"}
                </span>
              )}
            </div>

            {!collapsed && openMenu === "activity" && (
              <div className="sidebar-submenu activity-submenu">
                <NavLink
                  to="/dashboard/activity/import"
                  className={({ isActive }) =>
                    isActive ? "sidebar-subitem active" : "sidebar-subitem"
                  }
                  onClick={() => setActiveMenu("activity")}
                >
                  Nhập kho
                </NavLink>

                <div
                  className={`sidebar-subitem sidebar-subitem-header ${
                    activeMenu === "activity" ? "active" : ""
                  }`}
                  onClick={() => setExportOpen((prev) => !prev)}
                >
                  <span>Xuất kho</span>
                  <span className="sidebar-arrow">
                    {exportOpen ? "⌄" : "›"}
                  </span>
                </div>

                {exportOpen && (
                  <div className="sidebar-submenu-group">
                    <NavLink
                      to="/dashboard/activity/export/order"
                      className={({ isActive }) =>
                        isActive ? "sidebar-subitem active" : "sidebar-subitem"
                      }
                      onClick={() => setActiveMenu("activity")}
                    >
                      Lệnh xuất kho
                    </NavLink>

                    <NavLink
                      to="/dashboard/activity/export/release"
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
            )}
          </>
          <div
            className={`sidebar-item ${
              activeMenu === "transfer" ? "active-parent" : ""
            }`}
          >
            <NavLink
              to="/dashboard/activity/transfer"
              className={({ isActive }) =>
                isActive
                  ? "sidebar-main-link active-parent"
                  : "sidebar-main-link"
              }
              onClick={() => {
                setActiveMenu("transfer");
                setOpenMenu("");
              }}
            >
              <span className="sidebar-icon">🔄</span>

              {!collapsed && (
                <span className="sidebar-text">
                  Điều chuyển
                </span>
              )}
            </NavLink>
          </div>
      </div>
        <div className="sidebar-extra-menu">
        {/* CÔNG CỤ */}
        <div
          className={`sidebar-item sidebar-report-wrap ${
            activeMenu === "tools" ? "active-parent" : ""
          }`}
          onClick={() => toggleMenu("tools")}
        >
          <span className="sidebar-icon">🧰</span>

          {!collapsed && (
            <span className="sidebar-text">Công cụ</span>
          )}

          {!collapsed && (
            <span className="sidebar-arrow">
              {openMenu === "tools" ? "⌄" : "›"}
            </span>
          )}

          {!collapsed && openMenu === "tools" && (
            <div
              className="report-mega-menu"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="report-column">
                <div className="report-title">CÔNG CỤ</div>

                <NavLink
                  to="/dashboard/tools/transfer-request"
                  className={({ isActive }) =>
                    isActive
                      ? "report-link active"
                      : "report-link"
                  }
                  onClick={() => {
                    setActiveMenu("tools");
                    setOpenMenu("");
                  }}
                >
                  Giấy đề nghị chuyển tiền
                </NavLink>
              </div>
            </div>
          )}
        </div>
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
                    to="/dashboard/report/receipt"
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
                    to="/dashboard/report/release"
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
                  <NavLink
                      to="/dashboard/report/beginning-inventory"
                      className={({ isActive }) =>
                        isActive ? "report-link active" : "report-link"
                      }
                      onClick={() => {
                        setActiveMenu("report");
                        setOpenMenu("");
                      }}
                    >
                      Tồn kho đầu kỳ
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

                      <>
                      </>
                  </div>
              </div>
            )}
          </div>
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
