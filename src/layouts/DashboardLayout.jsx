import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function DashboardContent() {
  const { user } = useAuth();

  const currentUser = {
    full_name: user?.full_name || "Chưa cập nhật",
    fullName: user?.full_name || "Chưa cập nhật",
    birthday: user?.birthday || "",
    sex: user?.sex || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
    role: user?.position?.name || "ADMIN",
    company:
      user?.company ||
      "CÔNG TY CỔ PHẦN VẬN TẢI ĐƯỜNG SẮT - CHI NHÁNH TOA XE ĐÀ NẴNG",
  };

  return (
    <div className="dashboard-page">
      <Header user={currentUser} />
      <div className="dashboard-body">
        <Sidebar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DashboardLayout() {
  return (
    <AuthProvider fetchOnMount={true}>
      <DashboardContent />
    </AuthProvider>
  );
}

export default DashboardLayout;
