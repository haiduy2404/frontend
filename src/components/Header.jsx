import { useState } from "react";

import {
  Bell,
  LogOut,
  KeyRound,
  UserCog,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import "../styles/account.css";
import "../styles/dashboard.css";


import { useAuth } from "../contexts/AuthContext";


function Header({ user }) {
  const [
    openUserMenu,
    setOpenUserMenu,
  ] = useState(false);

  const navigate =
    useNavigate();

  const {
    logout,
  } = useAuth();


  const avatarText =
    (user.full_name || "")
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(-2)
      .toUpperCase();


  const handleLogout =
    async (event) => {
      event.preventDefault();

      await logout();

      navigate(
        "/",
        {
          replace: true,
        }
      );
    };


  return (
    <header className="app-header">
      {/* =========================================
          LEFT - COMPANY
          ========================================= */}

      <div className="header-left">
        <div className="company-name">
          {user.company}
        </div>
      </div>


      {/* =========================================
          RIGHT - NOTIFICATION / USER
          ========================================= */}

      <div className="header-right">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Thông báo"
        >
          <Bell size={20} />
        </button>


        <button
          type="button"
          className="user-avatar"
          onClick={() =>
            setOpenUserMenu(
              (prev) => !prev
            )
          }
        >
          {avatarText}
        </button>


        {openUserMenu && (
          <div className="user-dropdown">
            <div className="dropdown-avatar">
              {avatarText}
            </div>


            <h3>
              {user.full_name}
            </h3>


            <p className="user-phone">
              {user.phone}
            </p>


            <div className="company-card">
              {user.company}
            </div>


            <Link
              to="/account?tab=password"
              className="dropdown-item"
              onClick={() =>
                setOpenUserMenu(false)
              }
            >
              <KeyRound size={20} />

              Đổi mật khẩu
            </Link>


            <Link
              to="/account?tab=profile"
              className="dropdown-item"
              onClick={() =>
                setOpenUserMenu(false)
              }
            >
              <UserCog size={20} />

              Thiết lập tài khoản
            </Link>


            <Link
              to="/account?tab=security"
              className="dropdown-item"
              onClick={() =>
                setOpenUserMenu(false)
              }
            >
              <ShieldCheck size={20} />

              Thiết lập bảo mật
            </Link>


            <a
              href="/"
              className="logout-button"
              onClick={
                handleLogout
              }
            >
              <LogOut size={20} />

              Đăng xuất
            </a>
          </div>
        )}
      </div>
    </header>
  );
}


export default Header;