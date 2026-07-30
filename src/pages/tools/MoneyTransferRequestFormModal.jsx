import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiCloseLine, RiRefreshLine, RiPrinterLine } from "react-icons/ri";

import {
  createMoneyTransferRequest,
  updateMoneyTransferRequest,
} from "../../services/moneyTransferRequestService";
import { getCompanies } from "../../services/companyService";
import { lookupCompanyByTaxCode } from "../../services/externalService";

const createEmptyForm = () => ({
  company_id: "",
  company_code: "",
  company_name: "",
  company_address: "",
  company_tax_code: "",
  request_date: new Date().toISOString().slice(0, 10),
  total_amount: "",
  bank_account_number: "",
  bank_name: "",
  reason: "",
});

const parseMoney = (value) => {
  const text = String(value ?? "").trim().replace(/\s/g, "");

  if (!text) return NaN;

  if (text.includes(",")) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  const dotCount = (text.match(/\./g) || []).length;

  if (dotCount > 1) {
    return Number(text.replace(/\./g, ""));
  }

  if (dotCount === 1) {
    const [integerPart, decimalPart] = text.split(".");

    if (decimalPart?.length === 3) {
      return Number(`${integerPart}${decimalPart}`);
    }
  }

  return Number(text);
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const number = Number(value);
  if (Number.isNaN(number)) return "";

  return number.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  });
};

const getErrorMessage = (error, fallbackMessage) => {
  const data = error.response?.data;

  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const firstError = Object.entries(data)[0];

    if (firstError) {
      const [field, messages] = firstError;
      const message = Array.isArray(messages) ? messages[0] : messages;
      return `${field}: ${message}`;
    }
  }

  return fallbackMessage;
};

const getArrayResults = (response) => {
  const payload = response?.data || response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

function MoneyTransferRequestFormModal({
  mode,
  requestId,
  initialData,
  onClose,
  onSaved,
}) {
  const navigate = useNavigate();
  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  const [formData, setFormData] = useState(createEmptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState("");

  useEffect(() => {
    if (!initialData) {
      setFormData(createEmptyForm());
      setCompanyMessage("");
      return;
    }

    const company = initialData.company || {};

    setFormData({
      company_id:
        initialData.company_id || company.id || company.company_id || "",
      company_code: initialData.company_code || company.code || "",
      company_name: initialData.company_name || company.name || "",
      company_address:
        initialData.company_address ||
        company.address ||
        company.address_tax_office ||
        "",
      company_tax_code:
        initialData.company_tax_code ||
        company.tax_code ||
        company.tax_office_code ||
        "",
      request_date:
        initialData.request_date || new Date().toISOString().slice(0, 10),
      total_amount: formatMoney(initialData.total_amount),
      bank_account_number: initialData.bank_account_number || "",
      bank_name: initialData.bank_name || "",
      reason: initialData.reason || "",
    });

    setCompanyMessage("");
  }, [initialData]);

  const handleChange = (event) => {
    if (isViewMode) return;

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "company_tax_code"
        ? {
            company_id: "",
            company_code: "",
            company_name: "",
            company_address: "",
          }
        : {}),
    }));

    if (name === "company_tax_code") {
      setCompanyMessage("");
    }
  };

  const applyCompany = (company, taxCode) => {
    const companyId = company.company_id || company.id || "";
    const companyCode =
      company.company_code || company.supplier_code || company.code || "";
    const companyName =
      company.company_name || company.supplier_name || company.name || "";
    const companyAddress =
      company.company_address ||
      company.address ||
      company.full_address ||
      company.address_tax_office ||
      "";
    const companyTaxCode =
      company.company_tax_code ||
      company.tax_code ||
      company.taxCode ||
      company.tax_office_code ||
      taxCode;

    setFormData((previous) => ({
      ...previous,
      company_id: companyId,
      company_code: companyCode,
      company_name: companyName,
      company_address: companyAddress,
      company_tax_code: companyTaxCode,
    }));

    setCompanyMessage(
      companyId ? "Đã tải thông tin công ty." : "Không lấy được ID công ty."
    );
  };

  const handleLoadCompany = async () => {
    if (isViewMode) return;

    const taxCode = formData.company_tax_code.trim();

    if (!taxCode) {
      alert("Vui lòng nhập mã số thuế công ty");
      return;
    }

    try {
      setLoadingCompany(true);
      setCompanyMessage("");

      const internalResponse = await getCompanies({
        search: taxCode,
        page: 1,
        page_size: 10,
      });

      const internalResults = getArrayResults(internalResponse);
      const internalCompany = internalResults.find(
        (item) =>
          String(
            item.company_tax_code || item.tax_code || item.tax_office_code || ""
          ).trim() === taxCode
      );

      if (internalCompany) {
        applyCompany(internalCompany, taxCode);
        return;
      }

      const lookupResponse = await lookupCompanyByTaxCode(taxCode);
      const lookupCompany = lookupResponse?.data || lookupResponse;

      if (!lookupCompany) {
        setCompanyMessage("Không tìm thấy công ty theo mã số thuế này.");
        return;
      }

      applyCompany(lookupCompany, taxCode);
    } catch (error) {
      console.error(
        "LOAD COMPANY BY TAX CODE ERROR:",
        error.response?.data || error
      );

      setCompanyMessage("");
      alert(
        getErrorMessage(
          error,
          "Không tìm thấy công ty theo MST. Bạn có thể nhập tay."
        )
      );
    } finally {
      setLoadingCompany(false);
    }
  };

  const validate = () => {
    if (!formData.company_tax_code.trim()) {
      alert("Vui lòng nhập mã số thuế công ty");
      return false;
    }

    if (!formData.company_name.trim()) {
      alert("Vui lòng tải hoặc nhập tên công ty");
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

    if (!formData.bank_name.trim()) {
      alert("Vui lòng nhập tên ngân hàng");
      return false;
    }

    if (!formData.bank_account_number.trim()) {
      alert("Vui lòng nhập số tài khoản");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    company_id: formData.company_id || null,
    company_code: formData.company_code.trim() || null,
    company_name: formData.company_name.trim(),
    company_address: formData.company_address.trim() || null,
    company_tax_code: formData.company_tax_code.trim(),
    request_date: formData.request_date,
    total_amount: String(parseMoney(formData.total_amount)),
    bank_account_number: formData.bank_account_number.trim(),
    bank_name: formData.bank_name.trim(),
    reason: formData.reason.trim() || null,
  });

  const handleSave = async () => {
    if (isViewMode || !validate()) return;

    try {
      setSaving(true);
      const payload = buildPayload();

      if (isCreateMode) {
        await createMoneyTransferRequest(payload);
      } else {
        await updateMoneyTransferRequest(requestId, payload);
      }

      onSaved(
        isCreateMode
          ? "Tạo giấy đề nghị chuyển tiền thành công"
          : "Cập nhật giấy đề nghị chuyển tiền thành công"
      );
    } catch (error) {
      console.error(
        "SAVE MONEY TRANSFER REQUEST ERROR:",
        error.response?.data || error
      );
      alert(getErrorMessage(error, "Không thể lưu giấy đề nghị chuyển tiền"));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!requestId) {
      alert("Không tìm thấy ID giấy đề nghị chuyển tiền");
      return;
    }

    navigate(`/dashboard/tools/money-transfer-requests/${requestId}/print`);
  };

  const fieldDisabled = saving || loadingCompany || isViewMode;

  return (
    <div className="money-transfer-overlay">
      <form
        className="money-transfer-modal"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <div className="money-transfer-modal-header">
          <div>
            <div className="money-transfer-kicker">
              {isCreateMode ? "TẠO MỚI" : isViewMode ? "XEM" : "CẬP NHẬT"}
            </div>

            <h2>
              {isCreateMode
                ? "Lập giấy đề nghị chuyển tiền"
                : isViewMode
                ? "Xem giấy đề nghị chuyển tiền"
                : "Chỉnh sửa giấy đề nghị chuyển tiền"}
            </h2>
          </div>

          <button
            type="button"
            className="money-transfer-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            <RiCloseLine />
          </button>
        </div>

        <div className="money-transfer-form-grid">
          <label className="money-transfer-field full-width">
            <span>Mã số thuế công ty *</span>

            <div className="money-transfer-tax-code-row">
              <input
                name="company_tax_code"
                value={formData.company_tax_code}
                onChange={handleChange}
                placeholder="Nhập mã số thuế"
                disabled={fieldDisabled}
              />

              {!isViewMode && (
                <button
                  type="button"
                  className="money-transfer-load-company-btn"
                  onClick={handleLoadCompany}
                  disabled={saving || loadingCompany}
                >
                  <RiRefreshLine />
                  {loadingCompany ? "Đang tải..." : "Tải công ty"}
                </button>
              )}
            </div>

            {companyMessage && !isViewMode && (
              <small className="money-transfer-company-message">
                {companyMessage}
              </small>
            )}
          </label>

          <label className="money-transfer-field full-width">
            <span>Tên công ty *</span>
            <input
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Tên công ty được tải theo mã số thuế"
              maxLength={255}
              disabled={fieldDisabled}
            />
          </label>

          <label className="money-transfer-field">
            <span>Ngày đề nghị *</span>
            <input
              type="date"
              name="request_date"
              value={formData.request_date}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
          </label>

          <label className="money-transfer-field">
            <span>Tổng số tiền *</span>
            <input
              name="total_amount"
              inputMode="decimal"
              value={formData.total_amount}
              onChange={handleChange}
              onBlur={(event) => {
                if (isViewMode) return;

                const amount = parseMoney(event.target.value);

                if (Number.isFinite(amount)) {
                  setFormData((previous) => ({
                    ...previous,
                    total_amount: formatMoney(amount),
                  }));
                }
              }}
              placeholder="0"
              disabled={fieldDisabled}
            />
          </label>

          <label className="money-transfer-field">
            <span>Tên ngân hàng *</span>
            <input
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              maxLength={200}
              disabled={fieldDisabled}
            />
          </label>

          <label className="money-transfer-field">
            <span>Số tài khoản *</span>
            <input
              name="bank_account_number"
              value={formData.bank_account_number}
              onChange={handleChange}
              maxLength={50}
              disabled={fieldDisabled}
            />
          </label>

          <label className="money-transfer-field full-width">
            <span>Lý do</span>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={4}
              disabled={fieldDisabled}
            />
          </label>
        </div>

        <div className="money-transfer-modal-footer money-transfer-form-actions">
          <button
            type="button"
            className="money-transfer-secondary-btn"
            onClick={onClose}
            disabled={saving}
          >
            {isViewMode ? "Đóng" : "Hủy"}
          </button>

          {isViewMode ? (
            <button
              type="button"
              className="money-transfer-primary-btn"
              onClick={handlePrint}
            >
              <RiPrinterLine />
              <span>In</span>
            </button>
          ) : (
            <button
              type="submit"
              className="money-transfer-primary-btn"
              disabled={saving || loadingCompany}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default MoneyTransferRequestFormModal;