import { useState } from "react";
import { Bell, LogOut, KeyRound, UserCog, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/account.css";

function Header({ user }) {
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const avatarText = user.full_name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(-2)
    .toUpperCase();

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to = "/dashboard" className = "header-logo"></Link>
        <div className="app-name">Kho hàng</div>

        <div className="company-name">
          {user.company}
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-button">
          <Bell size={22} />
        </button>

        <button
          className="user-avatar"
          onClick={() => setOpenUserMenu(!openUserMenu)}
        >
          {avatarText}
        </button>

        {openUserMenu && (
          <div className="user-dropdown">
            <div className="dropdown-avatar">{avatarText}</div>

            <h3>{user.full_name}</h3>
            <p className="user-phone">{user.phone}</p>

            <div className="company-card">
              {user.company}
            </div>

            <Link to="/account?tab=password" className="dropdown-item">
            <KeyRound size={20} />
            Đổi mật khẩu
            </Link>

            <Link to="/account?tab=profile" className="dropdown-item">
            <UserCog size={20} />
            Thiết lập tài khoản
            </Link>

            <Link to="/account?tab=security" className="dropdown-item">
            <ShieldCheck size={20} />
            Thiết lập bảo mật
            </Link>

            <Link to="/" className="logout-button">
              <LogOut size={20} />
              Đăng xuất
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;