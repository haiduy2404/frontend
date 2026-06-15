import React, { useState } from "react";
import "../styles/Sidebar.css";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState("category");
  const [openMenu, setOpenMenu] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const { canDo } = useAuth();

  const toggleMenu = (menu) => {
    setActiveMenu(menu);
    if (!collapsed) {
      setOpenMenu(openMenu === menu ? "" : menu);
    }
  };

  // Visibility flags per section / item
  const showKho = canDo("view_warehouse");
  const showTonKho = canDo("view_goods");
  const showWarehouseSection = showKho || showTonKho;

  const showNhapKho = canDo("view_warehouse_receipt");
  const showActivitySection = showNhapKho;

  const showReportSection = canDo("view_report");

  const showGoods = canDo("view_goods");
  const showCompany = canDo("view_company");
  const showUsers = canDo("view_users");
  const showCategorySection = showGoods || showCompany || showUsers;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-menu">
        {/* QUẢN LÝ KHO */}
        {showWarehouseSection && (
          <>
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
                {showKho && (
                  <NavLink
                    to="/dashboard/stock-manager/stock-list"
                    className={({ isActive }) =>
                      isActive ? "sidebar-subitem active" : "sidebar-subitem"
                    }
                    onClick={() => setActiveMenu("warehouse")}
                  >
                    Kho
                  </NavLink>
                )}

                {showTonKho && (
                  <NavLink
                    to="/dashboard/stock-manager/opening-stock"
                    className={({ isActive }) =>
                      isActive ? "sidebar-subitem active" : "sidebar-subitem"
                    }
                    onClick={() => setActiveMenu("warehouse")}
                  >
                    Tồn kho đầu kỳ
                  </NavLink>
                )}
              </div>
            )}
          </>
        )}

        {/* HOẠT ĐỘNG KHO */}
        {showActivitySection && (
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
                {showNhapKho && (
                  <NavLink
                    to="/dashboard/activity/import"
                    className={({ isActive }) =>
                      isActive ? "sidebar-subitem active" : "sidebar-subitem"
                    }
                    onClick={() => setActiveMenu("activity")}
                  >
                    Nhập kho
                  </NavLink>
                )}

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
          </>
        )}
      </div>

      <div className="sidebar-bottom">
        {/* BÁO CÁO */}
        {showReportSection && (
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
        )}

        {/* DANH MỤC */}
        {showCategorySection && (
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
                {showGoods && (
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
                )}

                {(showCompany || showUsers) && (
                  <div className="category-column">
                    <div className="category-title">ĐỐI TƯỢNG</div>

                    {showCompany && (
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
                    )}

                    {showUsers && (
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
                    )}

                    {showUsers && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
