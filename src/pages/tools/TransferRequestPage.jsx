import { useCallback, useEffect, useState } from "react";
import {
  RiAddLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiEyeLine,
  RiFileList3Line,
  RiRefreshLine,
  RiSearchLine,
} from "react-icons/ri";

import "../../styles/TransferRequestPage.css";
import { useAuth } from "../../contexts/AuthContext";
import {
  createMoneyTransferRequest,
  deleteMoneyTransferRequest,
  getMoneyTransferRequestById,
  getMoneyTransferRequests,
  updateMoneyTransferRequest,
} from "../../services/moneyTransferRequestService";

const createEmptyForm = () => ({
  company_id: "",
  request_date: new Date().toISOString().slice(0, 10),
  total_amount: "",
  bank_account_number: "",
  bank_name: "",
  reason: "",
});

const parseMoney = (value) => {
  const text = String(value).trim();

  if (text.includes(",")) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  return Number(text);
};

const formatMoney = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) return "";

  return number.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  });
};

const formatDate = (value) => {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
};

function TransferRequestPage() {
  const { canDo } = useAuth();

  const canView = canDo("view_money_transfer_request");
  const canCreate = canDo("create_money_transfer_request");
  const canUpdate = canDo("update_money_transfer_request");
  const canDelete = canDo("delete_money_transfer_request");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formMode, setFormMode] = useState("");
  const [editingId, setEditingId] = useState("");
  const [formData, setFormData] = useState(createEmptyForm);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchRows = useCallback(async () => {
    if (!canView) return;

    try {
      setLoading(true);

    const response = await getMoneyTransferRequests({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        company_id: companyId || undefined,
        request_date_from: dateFrom || undefined,
        request_date_to: dateTo || undefined,
    });

    const data = response.data;

    setRows(data.results);
    setTotal(data.total);
    setTotalPages(data.total_pages);
    } catch (error) {
      console.error(
        "GET MONEY TRANSFER REQUESTS ERROR:",
        error.response?.data
      );
      alert("Không tải được danh sách giấy đề nghị chuyển tiền");
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    companyId,
    dateFrom,
    dateTo,
    debouncedSearch,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  if (!canView) {
    return (
      <div className="money-transfer-no-permission">
        Tài khoản không được cấp quyền xem giấy đề nghị chuyển tiền.
      </div>
    );
  }

  const openCreate = () => {
    if (!canCreate) return;
    setEditingId("");
    setFormData(createEmptyForm());
    setFormMode("create");
  };

  const closeForm = () => {
    if (saving) return;
    setFormMode("");
    setEditingId("");
    setFormData(createEmptyForm());
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.company_id.trim()) {
      alert("Vui lòng nhập company_id");
      return false;
    }

    if (!formData.request_date) {
      alert("Vui lòng chọn ngày đề nghị");
      return false;
    }

    const totalAmount = parseMoney(formData.total_amount);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      alert("Tổng số tiền phải lớn hơn 0");
      return false;
    }

    if (!formData.bank_account_number.trim()) {
      alert("Vui lòng nhập số tài khoản");
      return false;
    }

    if (!formData.bank_name.trim()) {
      alert("Vui lòng nhập tên ngân hàng");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    company_id: formData.company_id.trim(),
    request_date: formData.request_date,
    total_amount: String(parseMoney(formData.total_amount)),
    bank_account_number: formData.bank_account_number.trim(),
    bank_name: formData.bank_name.trim(),
    reason: formData.reason.trim()
      ? formData.reason.trim()
      : null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formMode === "create" && !canCreate) return;
    if (formMode === "edit" && !canUpdate) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      if (formMode === "create") {
        await createMoneyTransferRequest(payload);
        alert("Tạo giấy đề nghị chuyển tiền thành công");
      }

      if (formMode === "edit") {
        await updateMoneyTransferRequest(editingId, payload);
        alert("Cập nhật giấy đề nghị chuyển tiền thành công");
      }

      setFormMode("");
      setEditingId("");
      setFormData(createEmptyForm());
      await fetchRows();
    } catch (error) {
      console.error(
        "SAVE MONEY TRANSFER REQUEST ERROR:",
        error.response?.data
      );
      alert(
        error.response?.data?.message ||
          "Không thể lưu giấy đề nghị chuyển tiền"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (requestId) => {
    if (!canUpdate) return;

    try {
      setSaving(true);

      const data = await getMoneyTransferRequestById(requestId);

      setEditingId(data.id);
      setFormData({
        company_id: data.company_id,
        request_date: data.request_date,
        total_amount: formatMoney(data.total_amount),
        bank_account_number: data.bank_account_number,
        bank_name: data.bank_name,
        reason: data.reason,
      });
      setFormMode("edit");
    } catch (error) {
      console.error(
        "GET MONEY TRANSFER REQUEST DETAIL ERROR:",
        error.response?.data
      );
      alert("Không tải được thông tin giấy đề nghị");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (requestId) => {
    try {
      setSaving(true);
      const data = await getMoneyTransferRequestById(requestId);
      setDetailData(data);
    } catch (error) {
      console.error(
        "GET MONEY TRANSFER REQUEST DETAIL ERROR:",
        error.response?.data
      );
      alert("Không tải được chi tiết giấy đề nghị");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (requestId) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa giấy đề nghị này?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteMoneyTransferRequest(requestId);
      alert("Xóa giấy đề nghị chuyển tiền thành công");

      if (rows.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await fetchRows();
      }
    } catch (error) {
      console.error(
        "DELETE MONEY TRANSFER REQUEST ERROR:",
        error.response?.data
      );
      alert(
        error.response?.data?.message ||
          "Không thể xóa giấy đề nghị chuyển tiền"
      );
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCompanyId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="money-transfer-page">
      <section className="money-transfer-header">
        <div className="money-transfer-title-wrap">
          <div className="money-transfer-title-icon">
            <RiFileList3Line />
          </div>

          <div>
            <div className="money-transfer-kicker">
              CÔNG CỤ TÀI CHÍNH
            </div>
            <h1>Giấy đề nghị chuyển tiền</h1>
            <p>
              Quản lý đề nghị chuyển tiền theo công ty, thời gian và
              tài khoản ngân hàng.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            className="money-transfer-primary-btn"
            onClick={openCreate}
          >
            <RiAddLine />
            Lập giấy đề nghị
          </button>
        )}
      </section>

      <section className="money-transfer-filter-card">
        <div className="money-transfer-section-heading">
          <div>
            <h2>Bộ lọc tra cứu</h2>
            <p>Lọc danh sách theo công ty và ngày đề nghị.</p>
          </div>

          <button
            type="button"
            className="money-transfer-icon-btn"
            onClick={fetchRows}
            disabled={loading}
            title="Tải lại dữ liệu"
          >
            <RiRefreshLine />
          </button>
        </div>

        <div className="money-transfer-filter-grid">
          <label className="money-transfer-field">
            <span>Tìm kiếm</span>
            <div className="money-transfer-search-input">
              <RiSearchLine />
              <input
                value={search}
                placeholder="Nhập nội dung cần tìm"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </label>

          <label className="money-transfer-field">
            <span>Nhập mã số thuế công ty</span>
            <input
              value={companyId}
              placeholder="Nhập MST"
              onChange={(event) => {
                setCompanyId(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="money-transfer-field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="money-transfer-field">
            <span>Đến ngày</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <button
            type="button"
            className="money-transfer-clear-btn"
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      <section className="money-transfer-table-card">
        <div className="money-transfer-section-heading table-heading">
          <div>
            <h2>Danh sách đề nghị</h2>
            <p>
              Tổng cộng <strong>{total}</strong> bản ghi
            </p>
          </div>
        </div>

        <div className="money-transfer-table-scroll">
          <table className="money-transfer-table">
            <thead>
              <tr>
                <th>Ngày đề nghị</th>
                <th>Mã số thuế công ty</th>
                <th>Ngân hàng</th>
                <th>Số tài khoản</th>
                <th className="number-cell">Tổng số tiền</th>
                <th>Lý do</th>
                <th className="action-cell">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="money-transfer-status">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="money-transfer-status">
                      Không có dữ liệu
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.request_date)}</td>
                    <td className="company-id-cell">
                      {item.company_id}
                    </td>
                    <td>{item.bank_name}</td>
                    <td>{item.bank_account_number}</td>
                    <td className="number-cell amount-cell">
                      {formatMoney(item.total_amount)} đ
                    </td>
                    <td className="reason-cell">{item.reason}</td>
                    <td className="action-cell">
                      <div className="money-transfer-actions">
                        <button
                          type="button"
                          title="Xem chi tiết"
                          onClick={() => openDetail(item.id)}
                        >
                          <RiEyeLine />
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => openEdit(item.id)}
                          >
                            <RiEdit2Line />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="danger"
                            title="Xóa"
                            onClick={() => handleDelete(item.id)}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="money-transfer-pagination">
          <div>
            <span>Số dòng/trang</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div>
            <span>
              Trang {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((previous) => previous - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((previous) => previous + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {formMode && (
        <div className="money-transfer-overlay">
          <form className="money-transfer-modal" onSubmit={handleSubmit}>
            <div className="money-transfer-modal-header">
              <div>
                <div className="money-transfer-kicker">
                  {formMode === "create" ? "TẠO MỚI" : "CẬP NHẬT"}
                </div>
                <h2>
                  {formMode === "create"
                    ? "Lập giấy đề nghị chuyển tiền"
                    : "Chỉnh sửa giấy đề nghị chuyển tiền"}
                </h2>
              </div>

              <button
                type="button"
                className="money-transfer-close-btn"
                onClick={closeForm}
              >
                <RiCloseLine />
              </button>
            </div>

            <div className="money-transfer-form-grid">
              <label className="money-transfer-field full-width">
                <span>Nhập mã số thuế công ty *</span>
                <input
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleFormChange}
                  placeholder="MST"
                />
              </label>

              <label className="money-transfer-field">
                <span>Ngày đề nghị *</span>
                <input
                  type="date"
                  name="request_date"
                  value={formData.request_date}
                  onChange={handleFormChange}
                />
              </label>

              <label className="money-transfer-field">
                <span>Tổng số tiền *</span>
                <input
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleFormChange}
                  onBlur={(event) => {
                    const amount = parseMoney(event.target.value);
                    if (Number.isFinite(amount)) {
                      setFormData((previous) => ({
                        ...previous,
                        total_amount: formatMoney(amount),
                      }));
                    }
                  }}
                  placeholder="0"
                />
              </label>

              <label className="money-transfer-field">
                <span>Tên ngân hàng *</span>
                <input
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleFormChange}
                  maxLength={200}
                />
              </label>

              <label className="money-transfer-field">
                <span>Số tài khoản *</span>
                <input
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleFormChange}
                  maxLength={50}
                />
              </label>

              <label className="money-transfer-field full-width">
                <span>Lý do</span>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  rows={4}
                />
              </label>
            </div>

            <div className="money-transfer-modal-footer">
              <button
                type="button"
                className="money-transfer-secondary-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="money-transfer-primary-btn"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detailData && (
        <div className="money-transfer-overlay">
          <div className="money-transfer-detail-modal">
            <div className="money-transfer-modal-header">
              <div>
                <div className="money-transfer-kicker">CHI TIẾT</div>
                <h2>Giấy đề nghị chuyển tiền</h2>
              </div>
              <button
                type="button"
                className="money-transfer-close-btn"
                onClick={() => setDetailData(null)}
              >
                <RiCloseLine />
              </button>
            </div>

            <div className="money-transfer-detail-grid">
              <div><span>Mã đề nghị</span><strong>{detailData.id}</strong></div>
              <div><span>Company ID</span><strong>{detailData.company_id}</strong></div>
              <div><span>Ngày đề nghị</span><strong>{formatDate(detailData.request_date)}</strong></div>
              <div><span>Tổng số tiền</span><strong>{formatMoney(detailData.total_amount)} đ</strong></div>
              <div><span>Ngân hàng</span><strong>{detailData.bank_name}</strong></div>
              <div><span>Số tài khoản</span><strong>{detailData.bank_account_number}</strong></div>
              <div className="full-width"><span>Lý do</span><strong>{detailData.reason}</strong></div>
            </div>

            <div className="money-transfer-modal-footer">
              <button
                type="button"
                className="money-transfer-secondary-btn"
                onClick={() => setDetailData(null)}
              >
                Đóng
              </button>

              {canUpdate && (
                <button
                  type="button"
                  className="money-transfer-primary-btn"
                  onClick={() => {
                    const requestId = detailData.id;
                    setDetailData(null);
                    openEdit(requestId);
                  }}
                >
                  <RiEdit2Line />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferRequestPage;
