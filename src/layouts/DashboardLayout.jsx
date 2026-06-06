import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";
import { getMe } from "../services/authService";

function DashboardLayout() {
  const [currentUser, setCurrentUser] = useState({
    full_name: " ",
    phone: " ",
    email: " ",
    role: "ADMIN",
    company:
      " ",
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await getMe();

        setCurrentUser({
          full_name: data.full_name || "Chưa cập nhật",
          fullName: data.full_name || "Chưa cập nhật",
          birthday: data.birthday || "",
          sex: data.sex || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          role: data.role || "ADMIN",
          company:
            data.company ||
            "CÔNG TY CỔ PHẦN VẬN TẢI ĐƯỜNG SẮT - CHI NHÁNH TOA XE ĐÀ NẴNG",
        });
      } catch (error) {
        console.error("GET ME DASHBOARD ERROR:", error.response?.data || error);
      }
    };

    fetchCurrentUser();
  }, []);

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