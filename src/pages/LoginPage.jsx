import { useState , useEffect } from "react";
import { Link , useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import "../styles/login.css";

function LoginPage() {
  const [username, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  useEffect(() => {
    console.log("Đang truy cập trang đăng nhập");
  }, []);
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  const loginData = {
    username,
    password,
  };

    try {
      console.log("Dữ liệu đăng nhập:", loginData);

      const data = await login(loginData);

      console.log("Kết quả login:", data);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login lỗi:", error);

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