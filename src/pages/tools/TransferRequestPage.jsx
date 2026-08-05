import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFileList3Line,
  RiPrinterLine,
  RiRefreshLine,
  RiSearchLine,
} from "react-icons/ri";

import "../../styles/TransferRequestPage.css";
import { useAuth } from "../../contexts/AuthContext";
import MoneyTransferRequestFormModal from "./MoneyTransferRequestFormModal";
import {
  deleteMoneyTransferRequest,
  getMoneyTransferRequestById,
  getMoneyTransferRequests,
} from "../../services/moneyTransferRequestService";
import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../utils/listPageStateStorage";

const unwrapData = (response) => response?.data || response;
const formatMoney = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) return "";

  return number.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  });
};

const formatDate = (value) => {
  if (!value) return "";

  const text = String(value).trim();

  // Backend đã trả dd/mm/yyyy thì giữ nguyên
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return text;
  }

  // Backend trả yyyy-mm-dd hoặc yyyy-mm-ddTHH:mm:ss
  const dateOnly = text.split("T")[0];
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  return text;
};

const getStatusLabel = (status) =>
  status === "completed" ? "Hoàn thành" : "Tạm lưu";

function TransferRequestPage() {
  const navigate = useNavigate();
  const { canDo } = useAuth();
  const LIST_PAGE_STATE_KEY = "transfer-request-page-state";

  const handlePrintRequest = (requestId) => {
    if (!requestId) {
      alert("Không tìm thấy ID giấy đề nghị");
      return;
    }

    navigate(
      `/dashboard/tools/money-transfer-requests/${requestId}/print`
    );
  };

  const canView = canDo("view_money_transfer_request");
  const canCreate = canDo("create_money_transfer_request");
  const canUpdate = canDo("update_money_transfer_request");
  const canDelete = canDo("delete_money_transfer_request");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.search || "";
  });
  const [debouncedSearch, setDebouncedSearch] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.debouncedSearch || "";
  });
  const [companyTaxCode, setCompanyTaxCode] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.companyTaxCode || "";
  });
  const [dateFrom, setDateFrom] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.dateFrom || "";
  });
  const [dateTo, setDateTo] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    return stored.dateTo || "";
  });

  const [page, setPage] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    const parsedPage = Number(stored.page);
    return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const stored = getStoredListPageState(LIST_PAGE_STATE_KEY, {});
    const parsedPageSize = Number(stored.pageSize);
    return Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 30;
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formConfig, setFormConfig] = useState(null);

  useEffect(() => {
    saveStoredListPageState(LIST_PAGE_STATE_KEY, {
      search,
      debouncedSearch,
      companyTaxCode,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });
  }, [companyTaxCode, dateFrom, dateTo, debouncedSearch, page, pageSize, search]);

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
        company_tax_code: companyTaxCode || undefined,
        request_date_from: dateFrom || undefined,
        request_date_to: dateTo || undefined,
      });

      const data = response.data;

      setRows(data.results);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error("GET MONEY TRANSFER REQUESTS ERROR:", error.response?.data);
      alert("Không tải được danh sách giấy đề nghị chuyển tiền");
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    companyTaxCode,
    dateFrom,
    dateTo,
    debouncedSearch,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    if (!canCreate) return;

    setFormConfig({
      mode: "create",
      requestId: "",
      initialData: null,
    });
  };

const openEdit = async (requestId) => {
  if (!canUpdate) return;

  try {
    setActionLoading(true);

    const response = await getMoneyTransferRequestById(requestId);
    const detail = unwrapData(response);

    if (!detail?.id) {
      alert("Không tìm thấy dữ liệu giấy đề nghị");
      return;
    }

    setFormConfig({
      mode: "edit",
      requestId: detail.id,
      initialData: detail,
    });
  } catch (error) {
    console.error(
      "GET MONEY TRANSFER REQUEST DETAIL ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
        "Không tải được thông tin giấy đề nghị"
    );
  } finally {
    setActionLoading(false);
  }
};

  const handleDelete = async (requestId) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa giấy đề nghị này?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCompanyTaxCode("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  if (!canView) {
    return (
      <div className="money-transfer-no-permission">
        Tài khoản không được cấp quyền xem giấy đề nghị chuyển tiền.
      </div>
    );
  }

  return (
    <div className="money-transfer-page">
      <section className="money-transfer-header">
        <div className="money-transfer-title-wrap">
          <div className="money-transfer-title-icon">
            <RiFileList3Line />
          </div>

          <div>
            <div className="money-transfer-kicker">CÔNG CỤ TÀI CHÍNH</div>
            <h1>Giấy đề nghị chuyển tiền</h1>
            <p>
              Quản lý đề nghị chuyển tiền theo công ty, thời gian và tài khoản
              ngân hàng.
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
            <span>Mã số thuế công ty</span>
            <input
              value={companyTaxCode}
              placeholder="Nhập mã số thuế"
              onChange={(event) => {
                setCompanyTaxCode(event.target.value);
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
                <th>Mã số thuế</th>
                <th>Tên công ty</th>
                <th>Ngân hàng</th>
                <th>Số tài khoản</th>
                <th className="number-cell">Tổng số tiền</th>
                <th>Trạng thái</th>
                <th>Lý do</th>
                <th className="action-cell">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="money-transfer-status">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="money-transfer-status">Không có dữ liệu</div>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.request_date)}</td>
                    <td className="company-id-cell">
                      {item.company_tax_code}
                    </td>
                    <td>{item.company_name}</td>
                    <td>{item.bank_name}</td>
                    <td>{item.bank_account_number}</td>
                    <td className="number-cell amount-cell">
                      {formatMoney(item.total_amount)} đ
                    </td>
                    <td>
                      <span
                        className={`money-transfer-status-badge ${
                          item.status === "completed"
                            ? "is-completed"
                            : "is-draft"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="reason-cell">{item.reason}</td>
                    <td className="action-cell">
                      <div className="money-transfer-actions">
                        <button
                          type="button"
                          title="In giấy đề nghị"
                          onClick={() => handlePrintRequest(item.id)}
                          disabled={actionLoading}
                        >
                          <RiPrinterLine />
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() => openEdit(item.id)}
                            disabled={actionLoading}
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
                            disabled={actionLoading}
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

      {formConfig && (
        <MoneyTransferRequestFormModal
          mode={formConfig.mode}
          requestId={formConfig.requestId}
          initialData={formConfig.initialData}
          onClose={() => setFormConfig(null)}
          onSaved={async (message) => {
            alert(message);
            setFormConfig(null);
            await fetchRows();
          }}
        />
      )}

    </div>
  );
}

export default TransferRequestPage;