import { useEffect, useMemo, useState, useRef } from "react";
import "../../styles/CompanyListPage.css";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiRefreshLine,
  RiCloseLine,
  RiLoader4Line,
} from "react-icons/ri";

import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../services/companyService";

import { lookupCompanyByTaxCode } from "../../services/externalService";

function CompanyListPage() {
  const [companies, setCompanies] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingTaxCode, setLoadingTaxCode] = useState(false);
  const resizingRef = useRef(null);

  const defaultColumns = [
    { key: "supplier_code", label: "Mã KH", width: 120 },
    { key: "supplier_name", label: "Tên đơn vị cung cấp", width: 260 },
    { key: "tax_code", label: "Mã số thuế", width: 150 },
    { key: "address", label: "Địa chỉ", width: 300 },
    { key: "bank_name", label: "Tên ngân hàng", width: 220 },
    { key: "bank_account_number", label: "Số tài khoản ngân hàng", width: 220 },
  ];

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("companyListColumns");
    return saved ? JSON.parse(saved) : defaultColumns;
  });

  useEffect(() => {
    localStorage.setItem("companyListColumns", JSON.stringify(columns));
  }, [columns]);

  const handleStartResize = (event, columnKey) => {
    event.preventDefault();
    event.stopPropagation();

    const column = columns.find((col) => col.key === columnKey);
    if (!column) return;

    resizingRef.current = {
      columnKey,
      startX: event.clientX,
      startWidth: column.width,
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", handleStopResize);
  };

  const handleResizing = (event) => {
    if (!resizingRef.current) return;

    const { columnKey, startX, startWidth } = resizingRef.current;
    const diff = event.clientX - startX;
    const nextWidth = Math.max(80, startWidth + diff);

    setColumns((prev) =>
      prev.map((col) =>
        col.key === columnKey
          ? {
              ...col,
              width: nextWidth,
            }
          : col
      )
    );
  };

  const handleStopResize = () => {
    resizingRef.current = null;

    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    window.removeEventListener("mousemove", handleResizing);
    window.removeEventListener("mouseup", handleStopResize);
  };

  const emptyFormData = {
    supplier_code: "",
    supplier_name: "",
    tax_code: "",
    address: "",
    bank_accounts: [
      {
        bank_name: "",
        bank_account_number: "",
      },
    ],
  };

  const [formData, setFormData] = useState(emptyFormData);

  const normalizeCompany = (item) => {
    return {
      id: item.id,
      supplier_code: item.supplier_code || item.code || "",
      supplier_name: item.supplier_name || item.name || "",
      tax_code: item.tax_code || item.tax_office_code || "",
      address: item.address || item.address_tax_office || "",
      bank_accounts:
        Array.isArray(item.list_of_bank) && item.list_of_bank.length > 0
          ? item.list_of_bank.map((bank) => ({
              id: bank.id,
              bank_name: bank.bank_name || "",
              bank_account_number: bank.account_number || "",
              is_default: bank.is_default || false,
            }))
          : Array.isArray(item.bank_accounts) && item.bank_accounts.length > 0
          ? item.bank_accounts
          : item.bank_name || item.bank_account_number
          ? [
              {
                bank_name: item.bank_name || "",
                bank_account_number: item.bank_account_number || "",
              },
            ]
          : [
              {
                bank_name: "",
                bank_account_number: "",
              },
            ],
    };
  };

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies({
        search: searchText,
        page: 1,
        page_size: 100,
      });

      const payload = response?.data || response;

      const results = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : [];

      setCompanies(results.map(normalizeCompany));
    } catch (error) {
      console.error("LOAD COMPANIES ERROR:", error.response?.data || error);
      window.alert("Không tải được danh sách công ty");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return companies;
    }

    return companies.filter((company) => {
      return (
        company.supplier_code.toLowerCase().includes(keyword) ||
        company.supplier_name.toLowerCase().includes(keyword) ||
        company.tax_code.toLowerCase().includes(keyword) ||
        company.address.toLowerCase().includes(keyword) ||
        company.bank_accounts?.some((bank) => {
          return (
            bank.bank_name?.toLowerCase().includes(keyword) ||
            bank.bank_account_number?.toLowerCase().includes(keyword)
          );
        })
      );
    });
  }, [companies, searchText]);

  const isAllChecked =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((company) => selectedIds.includes(company.id));

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setShowForm(false);
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setShowForm(true);
  };

  const handleOpenEditForm = (company) => {
    setEditingId(company.id);

    setFormData({
      supplier_code: company.supplier_code || "",
      supplier_name: company.supplier_name || "",
      tax_code: company.tax_code || "",
      address: company.address || "",
      bank_accounts:
        company.bank_accounts && company.bank_accounts.length > 0
          ? company.bank_accounts
          : [
              {
                bank_name: "",
                bank_account_number: "",
              },
            ],
    });

    setShowForm(true);
  };

  const handleToggleAll = (event) => {
    const checked = event.target.checked;

    if (checked) {
      setSelectedIds(filteredCompanies.map((company) => company.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleOne = (event, id) => {
    event.stopPropagation();

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }

      return [...prev, id];
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: [
        ...prev.bank_accounts,
        {
          bank_name: "",
          bank_account_number: "",
        },
      ],
    }));
  };

  const handleBankAccountChange = (index, field, value) => {
    setFormData((prev) => {
      const newBankAccounts = [...prev.bank_accounts];

      newBankAccounts[index] = {
        ...newBankAccounts[index],
        [field]: value,
      };

      return {
        ...prev,
        bank_accounts: newBankAccounts,
      };
    });
  };

  const handleRemoveBankAccount = (index) => {
    setFormData((prev) => {
      const newBankAccounts = prev.bank_accounts.filter(
        (_, itemIndex) => itemIndex !== index
      );

      return {
        ...prev,
        bank_accounts:
          newBankAccounts.length > 0
            ? newBankAccounts
            : [
                {
                  bank_name: "",
                  bank_account_number: "",
                },
              ],
      };
    });
  };

  const handleLoadCompanyByTaxCode = async () => {
    const taxCode = formData.tax_code.trim();

    if (!taxCode) {
      window.alert("Vui lòng nhập mã số thuế trước khi load.");
      return;
    }

    try {
      setLoadingTaxCode(true);

      const result = await lookupCompanyByTaxCode(taxCode);
      const company = result?.data || result;

      setFormData((prev) => ({
        ...prev,
        supplier_code:
          company.supplier_code ||
          company.code ||
          company.customer_code ||
          company.tax_code ||
          prev.supplier_code,

        supplier_name:
          company.supplier_name ||
          company.name ||
          company.company_name ||
          company.title ||
          prev.supplier_name,

        tax_code:
          company.tax_code ||
          company.taxCode ||
          company.tax_office_code ||
          prev.tax_code,

        address:
          company.address ||
          company.full_address ||
          company.address_tax_office ||
          prev.address,

        bank_accounts: prev.bank_accounts,
      }));
    } catch (error) {
      console.error("LOAD COMPANY BY TAX CODE ERROR:", error.response?.data || error);
      window.alert("Không tìm được công ty theo mã số thuế.");
    } finally {
      setLoadingTaxCode(false);
    }
  };

  const handleDeleteOne = async (id) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa công ty này không?");

    if (!confirmed) return;

    try {
      await deleteCompany(id);

      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

      if (editingId === id) {
        resetForm();
      }

      await fetchCompanies();
    } catch (error) {
      console.error("DELETE COMPANY ERROR:", error.response?.data || error);
      window.alert("Xóa công ty thất bại.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      window.alert("Vui lòng chọn ít nhất một công ty để xóa.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} công ty đã chọn không?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteCompany(id)));

      if (selectedIds.includes(editingId)) {
        resetForm();
      }

      setSelectedIds([]);
      await fetchCompanies();

      window.alert("Xóa công ty đã chọn thành công.");
    } catch (error) {
      console.error("DELETE SELECTED COMPANIES ERROR:", error.response?.data || error);
      window.alert("Xóa công ty đã chọn thất bại.");
    }
  };

  const handleSave = async () => {
    const supplierCode = formData.supplier_code.trim();
    const supplierName = formData.supplier_name.trim();
    const taxCode = formData.tax_code.trim();
    const address = formData.address.trim();

    const validBankAccounts = formData.bank_accounts
      .map((bank) => ({
        bank_name: bank.bank_name.trim(),
        bank_account_number: bank.bank_account_number.trim(),
      }))
      .filter((bank) => {
        return bank.bank_name && bank.bank_account_number;
      });

    if (!supplierName || !taxCode || validBankAccounts.length === 0) {
      window.alert(
        "Vui lòng nhập tên đơn vị cung cấp, mã số thuế và ít nhất một tài khoản ngân hàng."
      );
      return;
    }

    const isDuplicateTaxCode = companies.some((company) => {
      return company.tax_code === taxCode && company.id !== editingId;
    });

    if (isDuplicateTaxCode) {
      window.alert("Mã số thuế này đã tồn tại.");
      return;
    }

    const payload = {
      supplier_code: supplierCode,
      supplier_name: supplierName,
      tax_code: taxCode,
      address,
      bank_accounts: validBankAccounts,
    };

    try {
      if (editingId) {
        await updateCompany(editingId, payload);
      } else {
        await createCompany(payload);
      }

      await fetchCompanies();
      resetForm();
    } catch (error) {
      console.error("SAVE COMPANY ERROR:", error.response?.data || error);
      window.alert(editingId ? "Cập nhật công ty thất bại." : "Thêm công ty thất bại.");
    }
  };

  const renderCompanyCell = (company, columnKey) => {
      if (columnKey === "bank_name") {
        return company.bank_accounts
          ?.filter((bank) => bank.bank_name)
          .map((bank, index) => <div key={index}>{bank.bank_name}</div>);
      }

      if (columnKey === "bank_account_number") {
        return company.bank_accounts
          ?.filter((bank) => bank.bank_account_number)
          .map((bank, index) => <div key={index}>{bank.bank_account_number}</div>);
      }

      return company[columnKey] || "";
  };

  return (
    <div className="company-list-page">
      <div className="company-list-toolbar">
        <div className="company-list-left">
          <input
            className="company-search-input"
            placeholder="🔍 Tìm kiếm mã số thuế, tên công ty"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <button className="icon-btn" title="Làm mới" onClick={fetchCompanies}>
            <RiRefreshLine />
          </button>
        </div>

        <div className="company-list-actions">
          <button className="delete-btn" onClick={handleDeleteSelected}>
            <RiDeleteBin6Line />
            <span>Xóa</span>
          </button>

          <button className="add-btn" onClick={handleOpenAddForm}>
            <RiAddLine />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      <div className="company-list-content">
        <div className="company-table-wrapper">
            <table className="company-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={handleToggleAll}
                    />
                  </th>

                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="resizable-th"
                      style={{
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                      }}
                    >
                      <span>{column.label}</span>

                      <span
                        className="column-resizer"
                        onMouseDown={(event) => handleStartResize(event, column.key)}
                      />
                    </th>
                  ))}

                  <th className="action-col">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <tr key={company.id}>
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(company.id)}
                          onChange={(event) => handleToggleOne(event, company.id)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>

                      {columns.map((column) => (
                        <td
                          key={column.key}
                          style={{
                            width: `${column.width}px`,
                            minWidth: `${column.width}px`,
                            maxWidth: `${column.width}px`,
                          }}
                        >
                          {renderCompanyCell(company, column.key)}
                        </td>
                      ))}

                      <td className="row-actions">
                        <button title="Sửa" onClick={() => handleOpenEditForm(company)}>
                          <RiEdit2Line />
                        </button>

                        <button
                          title="Xóa"
                          className="row-delete-btn"
                          onClick={() => handleDeleteOne(company.id)}
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-cell" colSpan={columns.length + 2}>
                      Không có dữ liệu công ty
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

      {showForm && (
        <div className="company-modal-overlay">
          <div className="company-modal">
            <div className="company-modal-header">
              <h3>{editingId ? "Chỉnh sửa công ty" : "Thêm công ty"}</h3>

              <button className="modal-close-btn" onClick={resetForm}>
                <RiCloseLine />
              </button>
            </div>

            <div className="company-modal-body">
              <label>Mã KH</label>
              <input
                name="supplier_code"
                value={formData.supplier_code}
                onChange={handleInputChange}
                placeholder="Nhập mã khách hàng / NCC"
              />

              <label>
                Mã số thuế <span>*</span>
              </label>

              <div className="tax-code-input-row">
                <input
                  name="tax_code"
                  value={formData.tax_code}
                  onChange={handleInputChange}
                  placeholder="Nhập mã số thuế"
                />

                <button
                  type="button"
                  className="load-tax-btn"
                  title="Load thông tin công ty"
                  onClick={handleLoadCompanyByTaxCode}
                  disabled={loadingTaxCode}
                >
                  <RiLoader4Line className={loadingTaxCode ? "loading-icon" : ""} />
                </button>
              </div>

              <label>
                Tên đơn vị cung cấp <span>*</span>
              </label>
              <input
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleInputChange}
                placeholder="Nhập tên đơn vị cung cấp"
              />

              <label>Địa chỉ</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ"
              />

              <label>
                Tài khoản ngân hàng <span>*</span>
              </label>

              {formData.bank_accounts.map((bank, index) => (
                <div className="bank-account-row" key={index}>
                  <input
                    value={bank.bank_name}
                    onChange={(event) =>
                      handleBankAccountChange(index, "bank_name", event.target.value)
                    }
                    placeholder="Tên ngân hàng"
                  />

                  <input
                    value={bank.bank_account_number}
                    onChange={(event) =>
                      handleBankAccountChange(
                        index,
                        "bank_account_number",
                        event.target.value
                      )
                    }
                    placeholder="Số tài khoản"
                  />

                  {formData.bank_accounts.length > 1 && (
                    <button
                      type="button"
                      className="remove-bank-btn"
                      onClick={() => handleRemoveBankAccount(index)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="add-bank-btn"
                onClick={handleAddBankAccount}
              >
                + Thêm tài khoản ngân hàng
              </button>
            </div>

            <div className="company-modal-actions">
              <button className="cancel-btn" onClick={resetForm}>
                Hủy
              </button>

              <button className="save-btn" onClick={handleSave}>
                {editingId ? "Lưu chỉnh sửa" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyListPage;