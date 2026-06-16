import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import "../styles/login.css";

function LoginPage() {
  const [username, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { refreshUser } = useAuth();

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  const loginData = {
    username,
    password,
  };

    try {
      await login(loginData);
      await refreshUser();
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại user và mật khẩu."
      );
    }
};

  return (
    <div className="login-page">
      <div className="overlay">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-logo"></div>

          <h1>Đăng nhập</h1>

          <input
            type="text"
            placeholder="TÊN ĐĂNG NHẬP"
            value={username}
            onChange={(e) => setUser(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Đăng nhập</button>

          {error && <p className="error-message">{error}</p>}

        </form>
      </div>
    </div>
  );
}

export default LoginPage;