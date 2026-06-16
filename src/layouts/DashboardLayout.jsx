import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";
import { useAuth } from "../contexts/AuthContext";

function DashboardLayout() {
  const { user } = useAuth();

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

export default DashboardLayout;
