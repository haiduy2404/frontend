import { useState } from "react";
import {
  getCompanies,
  createCompanyBankAccount,
} from "../../services/companyService";
import { lookupCompanyByTaxCode } from "../../services/externalService";

const extractCompanyList = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const normalizeCompanyBanks = (company) => {
  if (
    Array.isArray(company?.list_of_bank) &&
    company.list_of_bank.length > 0
  ) {
    return company.list_of_bank.map((bank) => ({
      id: bank.id || "",
      bank_account_name: bank.bank_name || "",
      bank_account_number: bank.account_number || "",
      is_default: Boolean(bank.is_default),
    }));
  }

  if (
    Array.isArray(company?.bank_accounts) &&
    company.bank_accounts.length > 0
  ) {
    return company.bank_accounts.map((bank) => ({
      id: bank.id || bank.bank_account_id || "",
      bank_account_name:
        bank.bank_account_name ||
        bank.bank_name ||
        "",
      bank_account_number:
        bank.bank_account_number ||
        bank.account_number ||
        "",
      is_default: Boolean(bank.is_default),
    }));
  }

  if (
    company?.bank_name ||
    company?.account_number ||
    company?.bank_account_number
  ) {
    return [
      {
        id: company.bank_account_id || "",
        bank_account_name:
          company.bank_name ||
          company.bank_account_name ||
          "",
        bank_account_number:
          company.account_number ||
          company.bank_account_number ||
          "",
        is_default: true,
      },
    ];
  }

  return [];
};

const useImportSupplierBank = () => {
  const [companyLoading, setCompanyLoading] =
    useState(false);

  const [companyId, setCompanyId] =
    useState(null);

  const [
    bankAccountOptions,
    setBankAccountOptions,
  ] = useState([]);

  const [
    showBankDropdown,
    setShowBankDropdown,
  ] = useState(false);

  const clearBankAccounts = () => {
    setBankAccountOptions([]);
    setShowBankDropdown(false);
  };

  const loadCompanyByTaxCode = async (
    taxCode,
    setHeaderData
  ) => {
    const normalizedTaxCode = String(
      taxCode || ""
    ).trim();

    if (!normalizedTaxCode) {
      alert("Vui lòng nhập MST trước khi load công ty");
      return false;
    }

    try {
      setCompanyLoading(true);

      const internalResponse =
        await getCompanies({
          search: normalizedTaxCode,
          page: 1,
          page_size: 10,
        });

      const internalResults =
        extractCompanyList(internalResponse);

      const duplicatedCompany =
        internalResults.find((item) => {
          const companyTaxCode = String(
            item.tax_code ||
              item.tax_office_code ||
              ""
          ).trim();

          return (
            companyTaxCode === normalizedTaxCode
          );
        });

      if (duplicatedCompany) {
        const banks =
          normalizeCompanyBanks(
            duplicatedCompany
          );

        setCompanyId(
          duplicatedCompany.id || null
        );

        setBankAccountOptions(banks);
        setShowBankDropdown(
          banks.length > 0
        );

        setHeaderData((prev) => ({
          ...prev,

          supplier_code:
            duplicatedCompany.supplier_code ||
            duplicatedCompany.code ||
            prev.supplier_code,

          supplier_name:
            duplicatedCompany.supplier_name ||
            duplicatedCompany.name ||
            prev.supplier_name,

          tax_code:
            duplicatedCompany.tax_code ||
            duplicatedCompany.tax_office_code ||
            prev.tax_code,

          address:
            duplicatedCompany.address ||
            duplicatedCompany.address_tax_office ||
            prev.address,

          bank_account_id:
            banks[0]?.id || "",

          bank_account_name:
            banks[0]?.bank_account_name || "",

          bank_account_number:
            banks[0]?.bank_account_number || "",
        }));

        return true;
      }

      clearBankAccounts();

      const externalResponse =
        await lookupCompanyByTaxCode(
          normalizedTaxCode
        );

      const company =
        externalResponse?.data ??
        externalResponse;

      setCompanyId(null);

      setHeaderData((prev) => ({
        ...prev,

        supplier_code:
          company?.supplier_code ||
          company?.code ||
          company?.customer_code ||
          company?.tax_code ||
          prev.supplier_code,

        supplier_name:
          company?.supplier_name ||
          company?.name ||
          company?.company_name ||
          company?.title ||
          prev.supplier_name,

        tax_code:
          company?.tax_code ||
          company?.taxCode ||
          company?.tax_office_code ||
          prev.tax_code,

        address:
          company?.address ||
          company?.full_address ||
          company?.address_tax_office ||
          prev.address,

        bank_account_id: "",
        bank_account_name: "",
        bank_account_number: "",
      }));

      return true;
    } catch (error) {
      console.error(
        "LOAD COMPANY ERROR:",
        error.response?.data || error
      );

      clearBankAccounts();

      alert(
        "Không tìm thấy công ty theo MST. Bạn có thể nhập tay."
      );

      return false;
    } finally {
      setCompanyLoading(false);
    }
  };

  const loadCompanyBanks = (company) => {
    setCompanyId(company?.id || null);

    const banks =
      normalizeCompanyBanks(company);

    setBankAccountOptions(banks);

    return banks;
  };

  const selectBankAccount = (
    bank,
    setHeaderData
  ) => {
    setHeaderData((prev) => ({
      ...prev,
      bank_account_id: bank?.id || "",
      bank_account_name:
        bank?.bank_account_name || "",
      bank_account_number:
        bank?.bank_account_number || "",
    }));

    setShowBankDropdown(false);
  };

  const createBankAccount = async ({
    bankName,
    bankAccountNumber,
  }) => {
    if (!companyId) {
      return null;
    }

    const response =
      await createCompanyBankAccount(
        companyId,
        {
          bank_name: bankName,
          bank_account_number:
            bankAccountNumber,
        }
      );

    const data =
      response?.data ?? response;

    const bank = {
      id: data?.id || "",
      bank_account_name:
        data?.bank_name ||
        bankName ||
        "",
      bank_account_number:
        data?.bank_account_number ||
        data?.account_number ||
        bankAccountNumber ||
        "",
    };

    setBankAccountOptions((prev) => [
      ...prev,
      bank,
    ]);

    return bank;
  };

  const resetSupplierBank = () => {
    setCompanyId(null);
    clearBankAccounts();
  };

  return {
    companyLoading,
    companyId,

    bankAccountOptions,
    setBankAccountOptions,

    showBankDropdown,
    setShowBankDropdown,

    clearBankAccounts,
    loadCompanyByTaxCode,
    loadCompanyBanks,
    selectBankAccount,
    createBankAccount,
    resetSupplierBank,
  };
};

export default useImportSupplierBank;