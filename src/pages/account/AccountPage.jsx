import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/account.css";
import Header from "../../components/Header";
import {
  changePassword,
  getUserById,
  updateUserById,
} from "../../services/authService";

function AccountPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "profile";
  const navigate = useNavigate();
  const mode = searchParams.get("mode");

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = storedUser?.id;

  const [user, setUser] = useState({
    full_name: "",
    birthday: "",
    sex: "",
    phone: "",
    email: "",
    address: "",
  });

  const renderSex = (sex) => {
    if (sex === "MALE") return "Nam";
    if (sex === "FEMALE") return "Nữ";
    if (sex === "OTHER") return "Khác";
    return "Chưa cập nhật";
  };

  useEffect(() => {
  const fetchUserProfile = async () => {
    console.log("Đang lấy thông tin người dùng với userId:", userId);
    if (!userId) return;

    try {
      const res = await getUserById(userId);
      const data = res.data || res;
      console.log("Dữ liệu người dùng:", data);

      setUser({
        full_name: data.full_name || "",
        birthday: data.birthday || "",
        sex: data.sex || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
      });
    } catch (error) {
      console.error("GET USER PROFILE ERROR:", error.response?.data || error);
    }
  };

  fetchUserProfile();
}, [userId]);

  const [passwordData, setPasswordData] = useState({
  current_password: "",
  new_password: "",
  confirm_password: "",
});

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const goBackProfile = () => {
  navigate("/account?tab=profile");
  };

const handleSave = async (e) => {
  e.preventDefault();

  if (!userId) {
    alert("Không tìm thấy user_id");
    return;
  }

  try {
    const payload = {
      full_name: user.full_name,
      birthday: user.birthday || null,
      sex: user.sex,
      phone: user.phone,
      email: user.email,
      address: user.address,
    };

    await updateUserById(userId, payload);

    alert("Cập nhật thông tin thành công");
    navigate("/account?tab=profile");
  } catch (error) {
    console.error("UPDATE USER ERROR:", error.response?.data || error);
    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Cập nhật thông tin thất bại"
    );
  }
};

  const handleChangePassword = async (e) => {
  e.preventDefault();
  setPasswordError("");
  setPasswordSuccess("");

  if (passwordData.current_password === passwordData.new_password) {
    setPasswordError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
    return;
  }

  if (passwordData.new_password !== passwordData.confirm_password) {
    setPasswordError("Bấm sai mật khẩu xác nhận. Vui lòng thử lại !");
    return;
  }

  try {
    const payload = {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    };

    console.log("Dữ liệu đổi mật khẩu:", payload);
    await changePassword(payload);

    setPasswordSuccess("Đổi mật khẩu thành công !");

    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  }  catch (error) {
  console.log("Lỗi backend trả về:", error.response?.data);
  setPasswordError("Bấm sai mật khẩu hiện tại. Vui lòng thử lại !");
}
};


  return (
    <>
    <Header user={user} />
    <div className="account-page">
      <aside className="account-sidebar">
        <Link className={tab === "profile" ? "active" : ""} to="/account?tab=profile">
          Thông tin cá nhân
        </Link>

        <Link className={tab === "password" ? "active" : ""} to="/account?tab=password">
          Đổi mật khẩu
        </Link>

        <Link className={tab === "security" ? "active" : ""} to="/account?tab=security">
          Thiết lập bảo mật
        </Link>
      </aside>

      <main className="account-content">
      {tab === "profile" && mode === "edit-basic" && (
  <>
    <h1>Thay đổi thông tin cá nhân</h1>

    <form className="account-card edit-form" onSubmit={handleSave}>
      <label>Tên đầy đủ</label>
      <input
        value={user.full_name}
        onChange={(e) => setUser({ ...user, full_name: e.target.value })}
      />

      <label>Ngày tháng năm sinh</label>
      <input
        type="date"
        value={user.birthday}
        onChange={(e) => setUser({ ...user, birthday: e.target.value })}
      />

      <label>Giới tính</label>
      <select
        value={user.sex}
        onChange={(e) => setUser({ ...user, sex: e.target.value })}
      >
        <option value="">Chọn giới tính</option>
        <option value="MALE">Nam</option>
        <option value="FEMALE">Nữ</option>
        <option value="OTHER">Khác</option>
      </select>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={goBackProfile}>
          Hủy
        </button>
        <button type="submit">Lưu</button>
      </div>
    </form>
  </>
)}

    {tab === "profile" && mode === "edit-contact" && (
      <>
        <h1>Thay đổi thông tin liên lạc</h1>

        <form className="account-card edit-form" onSubmit={handleSave}>
        <label>Số điện thoại</label>
        <input
          value={user.phone}
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
        />

        <label>Email</label>
        <input
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
        />

        <label>Địa chỉ</label>
        <input
          value={user.address}
          onChange={(e) => setUser({ ...user, address: e.target.value })}
        />

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={goBackProfile}>
              Hủy
            </button>
            <button type="submit">Lưu</button>
          </div>
        </form>
      </>
    )}

      {tab === "profile" && !mode && (
    <>
      <h1>Thông tin cá nhân</h1>

      <section className="account-card">
        <div className="account-card-header">
          <h2>Thông tin cơ bản</h2>
          <Link to="/account?tab=profile&mode=edit-basic" className="change-button">
            Thay đổi
          </Link>
        </div>

        <div className="profile-avatar">
          {user.full_name
            ? user.full_name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(-2)
                .toUpperCase()
            : "AD"}
        </div>

        <div className="info-row">
          <span>Tên đầy đủ</span>
          <strong>{user.full_name || "Chưa cập nhật"}</strong>
        </div>

        <div className="info-row">
          <span>Ngày tháng năm sinh</span>
          <strong>{user.birthday || "Chưa cập nhật"}</strong>
        </div>

        <div className="info-row">
          <span>Giới tính</span>
          <strong>{renderSex(user.sex)}</strong>
        </div>
      </section>

      <section className="account-card">
        <div className="account-card-header">
          <h2>Thông tin liên lạc</h2>
          <Link to="/account?tab=profile&mode=edit-contact" className="change-button">
            Thay đổi
          </Link>
        </div>

        <div className="info-row">
          <span>Số điện thoại</span>
          <strong>{user.phone || "Chưa cập nhật"}</strong>
        </div>

        <div className="info-row">
          <span>Email</span>
          <strong>{user.email || "Chưa cập nhật"}</strong>
        </div>

        <div className="info-row">
          <span>Địa chỉ</span>
          <strong>{user.address || "Chưa cập nhật"}</strong>
        </div>
      </section>
    </>
  )}

        {tab === "password" && (
          <>
            <h1>Đổi mật khẩu</h1>

            <form 
                className="account-card password-form"
                onSubmit={handleChangePassword}
              >
              <label>Mật khẩu hiện tại</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu hiện tại" 
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
              />

              <label>Mật khẩu mới</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
              />

              <label>Xác nhận mật khẩu mới</label>
              <input 
                type="password" 
                placeholder="Nhập lại mật khẩu mới" 
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
              />

              {passwordError && <p className="error">{passwordError}</p>}

              {passwordSuccess && (
                <p className="success-message">
                  Đổi mật khẩu thành công !{" "}
                  <Link to="/">Quay về trang chủ</Link>
                </p>
              )}
              <button type="submit">Cập nhật mật khẩu</button>
            </form>
          </>
        )}

        {tab === "security" && (
          <>
            <h1>Thiết lập bảo mật</h1>

            <div className="account-card">
              <h2>Bảo mật tài khoản</h2>

              <div className="info-row">
                <span>Xác thực email</span>
                <strong className="verified">Đã xác thực</strong>
              </div>

              <div className="info-row">
                <span>Xác thực số điện thoại</span>
                <strong className="verified">Đã xác thực</strong>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  </>  
  );
}

export default AccountPage;