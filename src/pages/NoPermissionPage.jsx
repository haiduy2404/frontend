import { useNavigate } from "react-router-dom";

function NoPermissionPage() {
  const navigate = useNavigate();

  return (
    <div className="no-permission-page">
      <h1>Không có quyền truy cập</h1>
      <p>Bạn không được cấp quyền thực hiện hành động hoặc xem nội dung này.</p>
      <button type="button" onClick={() => navigate("/dashboard")}>
        Quay lại trang chính
      </button>
    </div>
  );
}

export default NoPermissionPage;
