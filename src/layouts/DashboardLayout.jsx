import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import "../styles/dashboard.css";

import { useAuth } from "../contexts/AuthContext";

function DashboardLayout() {
  const { user } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  // Nhấn ESC để đóng menu mobile
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMobileSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMobileSidebar]);

  // Không cho body scroll khi menu mobile đang mở
  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [mobileSidebarOpen]);

  const currentUser = {
    full_name: user?.full_name || "Chưa cập nhật",

    fullName: user?.full_name || "Chưa cập nhật",

    birthday: user?.birthday || "",

    sex: user?.sex || "",

    phone: user?.phone || "",

    email: user?.email || "",

    address: user?.address || "",

    role: user?.position?.name || "Chưa cập nhật",

    company:
      user?.company ||
      "CÔNG TY CỔ PHẦN VẬN TẢI ĐƯỜNG SẮT - CHI NHÁNH TOA XE ĐÀ NẴNG",
  };

  return (
    <div
      className={`dashboard-page ${
        mobileSidebarOpen ? "mobile-sidebar-open" : ""
      }`}
    >
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="dashboard-sidebar-overlay"
          aria-label="Đóng menu"
          onClick={closeMobileSidebar}
        />
      )}

      <div className="dashboard-main-shell">
        {/* Chỉ hiện trên mobile */}
        <div className="dashboard-mobile-topbar">
          <button
            type="button"
            className="dashboard-mobile-menu-btn"
            onClick={openMobileSidebar}
            aria-label="Mở menu"
          >
            ☰
          </button>

          <strong>MENU</strong>
        </div>

        <Header user={currentUser} />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;