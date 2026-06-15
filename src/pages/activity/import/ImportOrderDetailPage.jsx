import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../../styles/ImportOrderDetailPage.css";
import { getGoods } from "../../../services/goodsService";
import { getCompanies, createCompanyBankAccount } from "../../../services/companyService";
import { getWarehouses } from "../../../services/warehouseService";
import {
  createWarehouseReceipt,
  updateWarehouseReceipt,
  getWarehouseReceiptByCode,
} from "../../../services/warehouseReceiptService";

import { lookupCompanyByTaxCode } from "../../../services/externalService";
import GoodsFormModal from "../../../components/GoodsFormModal";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiCheckboxLine,
  RiTruckLine,
  RiKeyboardBoxLine,
  RiSettings3Line,
  RiQuestionLine,
  RiCloseLine,
  RiSearchLine,
  RiCalendarLine,
  RiLoader4Line,
  RiPrinterLine,
} from "react-icons/ri";

function ImportOrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const isCreateMode = !id;
    const [companyLoading, setCompanyLoading] = useState(false);
    const [bankAccountOptions, setBankAccountOptions] = useState([]);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [warehouseList, setWarehouseList] = useState([]);
    const [warehouseLoading, setWarehouseLoading] = useState(false);
    const [goodsList, setGoodsList] = useState([]);
    const [goodsPage, setGoodsPage] = useState(1);
    const [goodsTotalPages, setGoodsTotalPages] = useState(1);
    const [goodsLoading, setGoodsLoading] = useState(false);
    const [showGoodsDropdown, setShowGoodsDropdown] = useState(false);
    const [activeGoodsRowId, setActiveGoodsRowId] = useState(null);
    const [goodsKeyword, setGoodsKeyword] = useState("");
    const [detailLoading, setDetailLoading] = useState(false);
    const [receiptId, setReceiptId] = useState(null);
    const [searchParams] = useSearchParams();
    const isPrintMode = searchParams.get("mode") === "print";
    const isEditReceivedMode = searchParams.get("mode") === "edit-items";
    const isLockedWhenReceived = isPrintMode || isEditReceivedMode;
    const isLockedOnlyPrint = isPrintMode;
    const [showPrintReasonModal, setShowPrintReasonModal] = useState(false);
    const [printReason, setPrintReason] = useState("");
    const [transferBankId, setTransferBankId] = useState("");
    const [transferBankName, setTransferBankName] = useState("");
    const [transferBankAccountNumber, setTransferBankAccountNumber] = useState("");
    const [showReceiptPrintModal, setShowReceiptPrintModal] = useState(false);
    const [receiptWarehouseKeeper, setReceiptWarehouseKeeper] = useState("");
    const [showAddGoodsModal, setShowAddGoodsModal] = useState(false);
    const [deletedItems, setDeletedItems] = useState([]);
    const [companyId, setCompanyId] = useState(null);
    const handlePrint = () => {
      window.print();
    };
    

    const formatISOToViDate = (value) => {
      if (!value) return "";

      return String(value).split("T")[0];
    };


  const getCurrentTerms = () => {
    const today = new Date();

    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();

    return `${month}/${year}`;
  };

  const getTodayViDate = () => {
    const today = new Date();

    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatPickerDateToViDate = (value) => {
    if (!value) return "";

    const [year, month, day] = value.split("-");

    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
  };

      const handleLoadCompanyByTaxCode = async () => {
      const taxCode = headerData.tax_code.trim();

      if (!taxCode) {
        alert("Vui lòng nhập MST trước khi load công ty");
        return;
      }

      try {
        setCompanyLoading(true);

        const internalCompanyResponse = await getCompanies({
          search: taxCode,
          page: 1,
          page_size: 10,
        });

      const internalPayload =
        internalCompanyResponse?.data || internalCompanyResponse;

      const internalResults = Array.isArray(internalPayload)
        ? internalPayload
        : Array.isArray(internalPayload?.data?.results)
        ? internalPayload.data.results
        : Array.isArray(internalPayload?.results)
        ? internalPayload.results
        : Array.isArray(internalPayload?.data)
        ? internalPayload.data
        : [];

        const duplicatedCompany = internalResults.find((item) => {
        return String(item.tax_code || item.tax_office_code || "").trim() === taxCode;
        });

          if (duplicatedCompany) {
            const duplicatedBankAccounts =
              Array.isArray(duplicatedCompany.list_of_bank) &&
              duplicatedCompany.list_of_bank.length > 0
                ? duplicatedCompany.list_of_bank.map((bank) => ({
                    id: bank.id || "",

                    // Load MST dùng field này
                    bank_account_name: bank.bank_name || "",
                    bank_account_number: bank.account_number || "",
                  }))
                : Array.isArray(duplicatedCompany.bank_accounts) &&
                  duplicatedCompany.bank_accounts.length > 0
                ? duplicatedCompany.bank_accounts.map((bank) => ({
                    id: bank.id || bank.bank_account_id || "",

                    // Nếu endpoint này trả kiểu mới thì vẫn ăn
                    bank_account_name: bank.bank_account_name || "",
                    bank_account_number: bank.bank_account_number || "",
                  }))
                : duplicatedCompany.bank_name || duplicatedCompany.account_number
                ? [
                    {
                      id: duplicatedCompany.bank_account_id || "",
                      bank_account_name: duplicatedCompany.bank_name || "",
                      bank_account_number: duplicatedCompany.account_number || "",
                    },
                  ]
                : [];

            setBankAccountOptions(duplicatedBankAccounts);
            setShowBankDropdown(duplicatedBankAccounts.length > 0);

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
                  bank_account_id: duplicatedBankAccounts[0]?.id || "",
                  bank_account_name: duplicatedBankAccounts[0]?.bank_account_name || "",
                  bank_account_number: duplicatedBankAccounts[0]?.bank_account_number || "",
            }));

            return;
          }
 

        setBankAccountOptions([]);
        setShowBankDropdown(false);

        const result = await lookupCompanyByTaxCode(taxCode);
        const company = result?.data || result;

        setHeaderData((prev) => ({
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

            bank_account_id: "",
            bank_account_name: "",
            bank_account_number: "",
        }));
      } catch (error) {
        console.error("LOAD COMPANY ERROR:", error.response?.data || error);
        setBankAccountOptions([]);
        setShowBankDropdown(false);
        alert("Không tìm thấy công ty theo MST. Bạn có thể nhập tay.");
      } finally {
        setCompanyLoading(false);
      }
    };

        const fetchWarehouseList = async () => {
        try {
        setWarehouseLoading(true);

        const data = await getWarehouses({
          search: "",
          page: 1,
          page_size: 100,
        });

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.data?.results)
          ? data.data.results
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setWarehouseList(results);
      } catch (error) {
        console.error("LOAD WAREHOUSE LIST ERROR:", error.response?.data || error);
        alert("Không tải được danh sách kho");
        setWarehouseList([]);
      } finally {
        setWarehouseLoading(false);
      }
    };

    useEffect(() => {
        fetchWarehouseList();
    }, []);

    const [items, setItems] = useState([
        {
          id: 1,
          inventory_id: "",
          goods_id: "",
          goods_code: "",
          goods_name: "",
          unit_id: "",
          unit: "",
          unit_options: [],
          conversion_ratio: "",
          requested_quantity: "1,00",
          actual_quantity: "0,00",
          marked_old: false,
          unit_price: "0,00",
          amount: "0,00",
          vat: "0",
          is_delete: false,
        },
    ]);

    const [headerData, setHeaderData] = useState({
      terms: getCurrentTerms(),
      inward_date: getTodayViDate(),
      warehouse_id: "",
      delivery_person: "",
      invoice_symbol: "",
      invoice_no: "",
      invoice_date: "",
      supplier_code: "",
      supplier_name: "",
      tax_code: "",
      address: "",
      description: "",
      bank_account_id: "",
      bank_account_name: "",
      bank_account_number: "",
    });

    const handleHeaderChange = (e) => {
      const { name, value } = e.target;

      setHeaderData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "bank_account_name" || name === "bank_account_number"
          ? { bank_account_id: "" }
          : {}),
      }));

      if (name === "tax_code") {
        setBankAccountOptions([]);
        setShowBankDropdown(false);
      }
    };

    const handleSelectBankAccount = (bank) => {
      setHeaderData((prev) => ({
        ...prev,
        bank_account_id: bank.id || "",
        bank_account_name: bank.bank_account_name || "",
        bank_account_number: bank.bank_account_number || "",
      }));

      setShowBankDropdown(false);
    };

    const createEmptyRow = () => ({
      id: Date.now(),
      goods_id: "",
      goods_code: "",
      goods_name: "",
      unit: "",
      requested_quantity: "1,00",
      actual_quantity: "0,00",
      marked_old: false,
      unit_price: "0,00",
      amount: "0",
      unit_id: "",
      unit_options: [],
      vat: "0",
      is_delete: false,
      inventory_id: "",
      conversion_ratio: "",
    });

    const handleAddRow = (rowId) => {
      setItems((prev) => {
        const newRow = createEmptyRow();

        if (!rowId) {
          return [...prev, newRow];
        }

        const index = prev.findIndex((item) => item.id === rowId);

        if (index === -1) {
          return [...prev, newRow];
        }

        return [
          ...prev.slice(0, index + 1),
          newRow,
          ...prev.slice(index + 1),
        ];
      });
    };

    const handleDeleteAllRows = () => {
      setDeletedItems((old) => [
        ...old,
        ...items
          .filter((item) => item.inventory_id)
          .map((item) => ({
            ...item,
            is_delete: true,
          })),
      ]);

      setItems([]);
    };

    const handleDeleteRow = (rowId) => {
      setItems((prev) => {
        const deletedItem = prev.find((item) => item.id === rowId);

        if (deletedItem?.inventory_id) {
          setDeletedItems((old) => {
            const existed = old.some(
              (item) => String(item.inventory_id) === String(deletedItem.inventory_id)
            );

            if (existed) return old;

            return [
              ...old,
              {
                ...deletedItem,
                is_delete: true,
              },
            ];
          });
        }

        return prev.filter((item) => item.id !== rowId);
      });
    };
    const fetchGoodsDropdown = async ({
        keyword = "",
        pageNumber = 1,
        append = false,
    } = {}) => {
        if (goodsLoading) return;

        try {
            setGoodsLoading(true);

            const data = await getGoods({
            search: keyword,
            page: pageNumber,
            page_size: 30,
            });

            const results = Array.isArray(data)
              ? data
              : Array.isArray(data?.data?.results)
              ? data.data.results
              : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.data)
              ? data.data
              : [];

            const totalPages =
              data?.data?.total_pages ||
              data?.total_pages ||
              Math.ceil((data?.data?.count || data?.count || results.length) / 30) ||
              1;

            setGoodsList((prev) => (append ? [...prev, ...results] : results));
            setGoodsPage(pageNumber);
            setGoodsTotalPages(totalPages);
        } catch (error) {
            console.error("LOAD GOODS DROPDOWN ERROR:", error.response?.data || error);
            alert("Không tải được danh sách hàng hóa");
        } finally {
            setGoodsLoading(false);
        }
    };

    const handleGoodsDropdownScroll = (e) => {
    const element = e.currentTarget;

    const isBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 8;

    if (isBottom && !goodsLoading && goodsPage < goodsTotalPages) {
        fetchGoodsDropdown({
        keyword: goodsKeyword,
        pageNumber: goodsPage + 1,
        append: true,
        });
    }
    };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const text = String(value).trim();

    if (!text) return 0;

    let number;

    if (text.includes(",")) {
      number = Number(text.replace(/\./g, "").replace(",", "."));
    } else {
      number = Number(text.replace(/\./g, ""));
    }

    return Number.isNaN(number) ? 0 : number;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
  const number = parseNumber(value);

  return number.toLocaleString("vi-VN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

    const handleSelectGoods = (goods) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== activeGoodsRowId) {
            return item;
          }

          const quantity = parseNumber(item.requested_quantity || 0);

          const unitPrice = parseNumber(
            goods.unit_price || goods.price || goods.purchase_price || 0
          );

          const unitOptions = Array.isArray(goods.units)
            ? goods.units.map((unitItem) => ({
                unit_id: unitItem.unit_id || unitItem.unit?.id || "",
                unit_name:
                  unitItem.unit_name ||
                  unitItem.unit?.name ||
                  unitItem.name ||
                  "",
                conversion_ratio: Number(unitItem.conversion_ratio || 1),
                is_default: Boolean(unitItem.is_default),
              }))
            : [];

          const defaultUnit =
            unitOptions.find((unitItem) => unitItem.is_default) ||
            unitOptions[0] ||
            null;

          return {
            ...item,
            goods_id: goods.id,
            goods_code: goods.code || goods.goods_code || "",
            goods_name: goods.name || goods.goods_name || "",

            unit_id: defaultUnit?.unit_id || goods.unit_id || "",
            unit:
              defaultUnit?.unit_name ||
              goods.unit ||
              goods.unit_name ||
              goods.goods_unit_name ||
              goods.main_unit ||
              "",
            unit_options: unitOptions,
            conversion_ratio: defaultUnit?.conversion_ratio
                ? String(defaultUnit.conversion_ratio)
                : "1",
            unit_price: formatViNumber(unitPrice, 2),
            amount: formatViNumber(
            Math.round(quantity * unitPrice),
            0
          ),
          };
        })
      );

      setShowGoodsDropdown(false);
      setActiveGoodsRowId(null);
      setGoodsKeyword("");
    };

    const handleChangeItemUnit = (rowId, unitId) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== rowId) return item;

          const selectedUnit = item.unit_options?.find(
            (unitItem) => String(unitItem.unit_id) === String(unitId)
          );

          return {
            ...item,
            unit_id: unitId,
            unit: selectedUnit?.unit_name || item.unit,
            conversion_ratio: selectedUnit?.conversion_ratio
              ? String(selectedUnit.conversion_ratio)
              : "",
          };
        })
      );
    };

    const handleChangeItemField = (rowId, field, value) => {
        if (field === "vat") {
          setItems((prev) => {
            const firstRowId = prev[0]?.id;
            const oldVat = prev.find(
              (x) => x.id === rowId
            )?.vat;

            return prev.map((item) => {
              if (item.id === rowId) {
                return {
                  ...item,
                  vat: value,
                };
              }

              if (
                rowId === firstRowId &&
                item.vat === oldVat
              ) {
                return {
                  ...item,
                  vat: value,
                };
              }

              return item;
            });
          });

          return;
        }

        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== rowId) {
              return item;
            }

            const nextItem = {
              ...item,
              [field]: value,
            };

            if (field === "marked_old") {
              nextItem.actual_quantity = value
                ? item.requested_quantity
                : "0,00";
            }

            const quantity = parseNumber(
              field === "requested_quantity"
                ? value
                : nextItem.requested_quantity
            );

            const unitPrice = parseNumber(
              field === "unit_price"
                ? value
                : nextItem.unit_price
            );

            if (
              field === "requested_quantity" ||
              field === "unit_price"
            ) {
              nextItem.amount = formatViNumber(
                Math.round(quantity * unitPrice),
                0
              );

              if (
                nextItem.marked_old &&
                field === "requested_quantity"
              ) {
                nextItem.actual_quantity = value;
              }
            }

            return nextItem;
          })
        );
      };
      const totalAmount = items.reduce((sum, item) => {
        return sum + parseNumber(item.amount);
    }  , 0);

    const roundMoney = (value) =>
      Math.round((Number(value) || 0) + Number.EPSILON);

    const vatSummary = items.reduce(
      (acc, item) => {
        const amount = parseNumber(item.amount);
        const rate = String(item.vat || "0");

        const vat = roundMoney(amount * (Number(rate) / 100));

        acc[rate] = (acc[rate] || 0) + vat;

        return acc;
      },
      {
        0: 0,
        5: 0,
        8: 0,
        10: 0,
      }
    );

    const vatAmount =
      vatSummary["0"] +
      vatSummary["5"] +
      vatSummary["8"] +
      vatSummary["10"];

    const grandTotal = roundMoney(totalAmount + vatAmount);

    const convertDateToISO = (value) => {
      if (!value) return null;

      return String(value).trim();
    };

  const buildReceiptPayload = (status) => {
  const inventoryPayloadItems = [
    ...items.map((item) => ({
      ...item,
      is_delete: false,
    })),
    ...deletedItems.map((item) => ({
      ...item,
      is_delete: true,
    })),
  ];
  const parseConversionRatio = (value) => {
  if (value === null || value === undefined || value === "") return 1;

  if (typeof value === "number") return value;

  const text = String(value).trim();

  if (text.includes(",")) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  // Nếu dạng 1.000, 10.000, 100.000 thì hiểu là hàng nghìn kiểu VN
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replace(/\./g, ""));
  }

  return Number(text);
};
  return {
    terms: headerData.terms || null,
    receipt_date: convertDateToISO(headerData.inward_date),
    warehouse_id: headerData.warehouse_id,
    delivery_persion: headerData.delivery_person || null,
    contract_code: headerData.invoice_symbol || null,
    invoice_code: headerData.invoice_no || null,
    invoice_date: headerData.invoice_date
      ? convertDateToISO(headerData.invoice_date)
      : null,
    company_code: headerData.supplier_code,
    company_name: headerData.supplier_name,
    company_address: headerData.address || null,
    company_tax_code: headerData.tax_code,
    description: headerData.description || null,
    inventory: inventoryPayloadItems
      .filter((item) => item.goods_id)
      .map((item) => ({
        inventory_id: item.inventory_id || null,
        goods_id: item.goods_id,
        goods_unit_id: item.unit_id || null,
        requested_quantity: parseNumber(item.requested_quantity),
        original_quantity: parseNumber(item.actual_quantity || item.requested_quantity),
        unit_price: parseNumber(item.unit_price),
        conversion_ratio: parseConversionRatio(item.conversion_ratio || 1),
        vat: Number(item.vat || 0),
        is_delete: Boolean(item.is_delete),
      })),

    bank_account_id: headerData.bank_account_id || null,
    bank_name: headerData.bank_account_name.trim(),
    bank_account_name: headerData.bank_account_name.trim(),
    bank_account_number: headerData.bank_account_number.trim(),

    status, 
  };
};

const handleComplete = async () => {
  try {
    if (!headerData.inward_date) {
      alert("Vui lòng nhập ngày nhập kho");
      return;
    }

    if (!headerData.warehouse_id) {
      alert("Vui lòng chọn kho nhập");
      return;
    }

    if (!headerData.supplier_code || !headerData.supplier_name || !headerData.tax_code) {
      alert("Vui lòng nhập đầy đủ thông tin nhà cung cấp");
      return;
    }

    const validItems = items.filter((item) => item.goods_id);

    if (validItems.length === 0) {
      alert("Vui lòng chọn ít nhất một hàng hóa");
      return;
    }

    const payload = buildReceiptPayload("RECEIVED");

    console.log("SUBMIT BANK:", {
      bank_account_id: payload.bank_account_id,
      bank_account_name: payload.bank_account_name,
      bank_account_number: payload.bank_account_number,
}   );

    if (id && id !== "new" && receiptId) {
      await updateWarehouseReceipt(receiptId, payload);
      alert("Cập nhật phiếu nhập kho thành công");
    } else {
      await createWarehouseReceipt(payload);
      alert("Tạo phiếu nhập kho thành công");
    }

    navigate("/dashboard/activity/import/order");
  } catch (error) {
    console.error("CREATE WAREHOUSE RECEIPT ERROR:", error.response?.data || error);
    alert("Tạo phiếu nhập kho thất bại");
  }
};

  const handleFillActualQuantity = () => {
  setItems((prev) =>
    prev.map((item) => ({
      ...item,
      actual_quantity: item.requested_quantity,
      marked_old: true,
    }))
  );
};

    const fetchReceiptDetail = async (receiptCode) => {
      if (!receiptCode || receiptCode === "new") return;

      try {
        setDetailLoading(true);

        const response = await getWarehouseReceiptByCode(receiptCode);
        const data = response?.data || response;
        setReceiptId(data.id);
        setCompanyId(data.company?.id || null);

        const companyBankOptions = Array.isArray(data.company?.list_of_bank)
        ? data.company.list_of_bank.map((bank) => ({
            id: bank.id || "",
            bank_account_name: bank.bank_name || "",
            bank_account_number: bank.account_number || "",
            is_default: Boolean(bank.is_default),
          }))
        : [];

      setBankAccountOptions(companyBankOptions);

        setHeaderData((prev) => ({
          ...prev,
          terms: data.terms || "",
          inward_date: formatISOToViDate(data.receipt_date),
          warehouse_id: data.warehouse_id || data.warehouse?.id || "",
          delivery_person: data.delivery_persion || "",
          invoice_symbol: data.contract_code || "",
          invoice_no: data.invoice_code || "",
          invoice_date: formatISOToViDate(data.invoice_date),
          supplier_code: data.company?.code || "",
          supplier_name: data.company?.name || "",
          tax_code: data.company?.tax_office_code || "",
          address: data.company?.address || data.company?.address_tax_office || "",
          description: data.description || "",
          bank_account_id:
            data.bank_account_id ||
            data.bank_account?.id ||
            data.company?.bank_account_id ||
            "",
          bank_account_name: data.bank_account_name || data.company?.bank_account_name || "",
          bank_account_number:
            data.bank_account_number || data.company?.bank_account_number || "",
        }));

        const lines = data.inventory_lines || [];

        setItems(
          lines.length > 0
            ? lines.map((line, index) => {
                  const requestedQuantity = parseNumber(
                    line.request_quantity || line.requested_quantity || line.original_quantity || 0
                  );

                  const originalQuantity = parseNumber(line.original_quantity || 0);
                  const unitPrice = parseNumber(line.unit_price || 0);

                  const selectedUnit = Array.isArray(line.units)
                    ? line.units.find(
                        (unitItem) => String(unitItem.unit_id) === String(line.goods_unit_id)
                      )
                    : null;

                  return {
                    id: line.inventory_id || line.id || index + 1,
                    inventory_id: line.inventory_id || line.id || "",

                    goods_id: line.goods_id || "",
                    goods_code: line.goods_code || "",
                    goods_name: line.goods_name || "",

                    unit_id: line.goods_unit_id || "",
                    unit: selectedUnit?.unit_name || line.unit_name || "",

                    unit_options: Array.isArray(line.units)
                      ? line.units.map((unitItem) => ({
                          unit_id: unitItem.unit_id || "",
                          unit_name: unitItem.unit_name || "",
                          conversion_ratio: unitItem.conversion_ratio || "",
                          is_default: Boolean(unitItem.is_default),
                        }))
                      : [],

                    conversion_ratio:
                      selectedUnit?.conversion_ratio !== null &&
                      selectedUnit?.conversion_ratio !== undefined
                        ? String(selectedUnit.conversion_ratio)
                        : "",

                    requested_quantity: formatViNumber(requestedQuantity, 2),
                    actual_quantity: formatViNumber(originalQuantity, 2),
                    marked_old: requestedQuantity === originalQuantity,
                    unit_price: formatViNumber(unitPrice, 3),
                    amount: formatViNumber(
                      Math.round(originalQuantity * unitPrice),
                      0
                    ),
                    vat: String(Number(line.vat || 0)),
                    is_delete: false,
                  };
              })
            : [
                {
                    id: 1,
                    inventory_id: "",
                    goods_id: "",
                    goods_code: "",
                    goods_name: "",
                    unit_id: "",
                    unit: "",
                    unit_options: [],
                    conversion_ratio: "",
                    requested_quantity: "1,00",
                    actual_quantity: "0,00",
                    marked_old: false,
                    unit_price: "0,00",
                    amount: "0,00",
                    vat: "0",
                    is_delete: false,
                },
              ]
        );
      } catch (error) {
        console.error("LOAD RECEIPT DETAIL ERROR:", error.response?.data || error);
        alert("Không tải được chi tiết phiếu nhập");
      } finally {
        setDetailLoading(false);
      }
    };

    useEffect(() => {
      if (id && id !== "new") {
        fetchReceiptDetail(id);
      }
    }, [id]);
  
  const handleSaveDraft = async () => {
  try {
    if (!headerData.inward_date) {
      alert("Vui lòng nhập ngày nhập kho");
      return;
    }

    if (!headerData.warehouse_id) {
      alert("Vui lòng chọn kho nhập");
      return;
    }

    if (!headerData.supplier_code || !headerData.supplier_name || !headerData.tax_code) {
      alert("Vui lòng nhập đầy đủ thông tin nhà cung cấp");
      return;
    }

    const validItems = items.filter((item) => item.goods_id);

    if (validItems.length === 0) {
      alert("Vui lòng chọn ít nhất một hàng hóa");
      return;
    }

    const payload = buildReceiptPayload("WAITING_DELIVERY");
    console.log("SAVE PAYLOAD:", payload);


    if (id && id !== "new" && receiptId) {
      await updateWarehouseReceipt(receiptId, payload);
      alert("Lưu tạm phiếu nhập kho thành công");
    } else {
      await createWarehouseReceipt(payload);
      alert("Lưu tạm phiếu nhập kho thành công");
    }

    navigate("/dashboard/activity/import/order");
  } catch (error) {
    console.error("SAVE DRAFT WAREHOUSE RECEIPT ERROR:", error.response?.data || error);
    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Lưu tạm phiếu nhập kho thất bại"
    );
  }
};

const handleOpenTransferPrint = () => {
  if (!id || id === "new") {
    alert("Cần lưu phiếu trước khi in giấy đề nghị chuyển tiền");
    return;
  }

  setPrintReason("");
  setTransferBankId(headerData.bank_account_id || "");
  setTransferBankName(headerData.bank_account_name || "");
  setTransferBankAccountNumber(headerData.bank_account_number || "");
  setShowPrintReasonModal(true);
};

  const handleOpenReceiptPrint = () => {
    if (!id || id === "new") {
      alert("Cần lưu phiếu trước khi in phiếu nhập kho");
      return;
    }

    setReceiptWarehouseKeeper("");
    setShowReceiptPrintModal(true);
  };

  const handleConfirmReceiptPrint = () => {
  if (!receiptWarehouseKeeper.trim()) {
    alert("Vui lòng nhập người thủ kho");
    return;
  }

    const hasVat = items.some(
    (item) => Number(item.vat || 0) > 0
  );

  if (hasVat) {
    navigate(`/dashboard/activity/import/order/${id}/receipt-print-vat`, {
      state: {
        signerThuKho: receiptWarehouseKeeper.trim(),
      },
    });
    return;
  }

  navigate(`/dashboard/activity/import/order/${id}/receipt-print-no-vat`, {
    state: {
      signerThuKho: receiptWarehouseKeeper.trim(),
    },
  });
};

  const handleSelectTransferBank = (bankId) => {
    setTransferBankId(bankId);

    const selectedBank = bankAccountOptions.find(
      (bank) => String(bank.id) === String(bankId)
    );

    setTransferBankName(selectedBank?.bank_account_name || "");
    setTransferBankAccountNumber(selectedBank?.bank_account_number || "");
  };

  const handleConfirmTransferPrint = async () => {
    if (!printReason.trim()) {
      alert("Vui lòng nhập lý do in phiếu");
      return;
    }

    let finalBankId = transferBankId;
    let finalBankName = transferBankName.trim();
    let finalBankAccountNumber = transferBankAccountNumber.trim();

    if (!finalBankName || !finalBankAccountNumber) {
      alert("Vui lòng chọn tài khoản ngân hàng hoặc nhập đầy đủ tài khoản mới");
      return;
    }

    const selectedBank = bankAccountOptions.find(
      (bank) => String(bank.id) === String(transferBankId)
    );

    if (selectedBank) {
      finalBankId = selectedBank.id || "";
      finalBankName = selectedBank.bank_account_name || "";
      finalBankAccountNumber = selectedBank.bank_account_number || "";
    } else {
      if (!companyId) {
        alert("Không tìm thấy công ty để lưu tài khoản ngân hàng mới");
        return;
      }

      try {
        const newBank = await createCompanyBankAccount(companyId, {
          bank_name: finalBankName,
          bank_account_number: finalBankAccountNumber,
        });

        setBankAccountOptions((prev) => [
          ...prev,
          {
            id: newBank.id,
            bank_account_name: newBank.bank_name,
            bank_account_number: newBank.bank_account_number,
          },
        ]);

        finalBankId = newBank.id;
        finalBankName = newBank.bank_name;
        finalBankAccountNumber = newBank.bank_account_number;
      } catch (error) {
        console.error("CREATE BANK ACCOUNT ERROR:", error.response?.data || error);
        alert("Không lưu được tài khoản ngân hàng mới");
        return;
      }
    }

    navigate(`/dashboard/activity/import/order/${id}/transfer-request-print`, {
      state: {
        printReason: printReason.trim(),

        transferTaxCode: headerData.tax_code,
        transferCompanyName: headerData.supplier_name,
        transferCompanyAddress: headerData.address,

        transferBankId: finalBankId,
        transferBankName: finalBankName,
        transferBankAccountNumber: finalBankAccountNumber,
      },
    });
  };

  const selectedConversionRatio =
  items.find((item) => item.conversion_ratio)?.conversion_ratio || "";

    const autoFillYear = (value) => {
    const text = String(value || "").trim();

    const match = text.match(/^(\d{1,2})\/(\d{1,2})$/);

    if (!match) {
      return value;
    }

    const currentYear = new Date().getFullYear();

    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");

    return `${day}/${month}/${currentYear}`;
  };

  return (
    <div className="import-order-detail-page">
      <div className="import-order-detail-header">
        <div className="detail-header-left">
          <h2>
            {isCreateMode
              ? "Lệnh nhập kho mua hàng"
              : `Lệnh nhập kho mua hàng ${id}`}
          </h2>

          <select className="header-select" defaultValue="purchase">
            <option value="purchase">Nhập kho mua hàng</option>
            <option value="goods">Nhập kho hàng hóa</option>
          </select>
        </div>

        <div className="detail-header-actions">
          <button
            className="header-icon-btn"
            onClick={() => navigate("/dashboard/activity/import/order")}
          >
            <RiCloseLine />
          </button>
        </div>
      </div>

      <div className="import-order-detail-body">
        <div className="info-section-title">Thông tin phiếu nhập kho</div>

        <div className="import-voucher-card">
        <div className="voucher-grid">
            <div className="form-group">
            <label>Kỳ</label>
              <input
                name="terms"
                value={headerData.terms}
                onChange={handleHeaderChange}
                placeholder="Nhập kỳ"
                disabled={isLockedWhenReceived}
              />
            </div>

          <div className="form-group">
            <label>Số phiếu NK</label>
            <input value={id && id !== "new" ? id : "Tự động tạo khi hoàn thành"} readOnly disabled={isPrintMode} />
          </div>

            <div className="form-group">
            <label>
                Ngày, tháng, năm NK <span>*</span>
            </label>
              <div className="input-with-icon">
                <input
                  name="inward_date"
                  value={headerData.inward_date}
                  onChange={handleHeaderChange}
                  onBlur={(e) =>
                    setHeaderData((prev) => ({
                      ...prev,
                      inward_date: autoFillYear(e.target.value),
                    }))
                  }
                  placeholder="dd/mm/yyyy"
                  disabled={isLockedWhenReceived}
                />

                <button type="button" disabled={isLockedWhenReceived}>
                  <RiCalendarLine />
                  <input
                    type="date"
                    className="calendar-native-input"
                    disabled={isLockedWhenReceived}
                    onChange={(e) =>
                      setHeaderData((prev) => ({
                        ...prev,
                        inward_date: formatPickerDateToViDate(e.target.value),
                      }))
                    }
                  />
                </button>
              </div>
            </div>
            <div className="form-group">
            <label>
                Nhập kho <span>*</span>
            </label>
            <select
                name="warehouse_id"
                value={headerData.warehouse_id}
                onChange={handleHeaderChange}
                disabled={isLockedWhenReceived}
                >
                <option value="">
                    {warehouseLoading ? "Đang tải danh sách kho..." : "Chọn kho nhập"}
                </option>

                {warehouseList.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                    </option>
            ))}
            </select>
            </div>

            <div className="form-group">
            <label>Người giao hàng</label>
            <input
                name="delivery_person"
                value={headerData.delivery_person}
                onChange={handleHeaderChange}
                placeholder="Nhập người giao hàng"
                disabled={isLockedOnlyPrint}            
              />
            </div>

            <div className="form-group">
            <label>Ký hiệu HĐ</label>
            <input
                name="invoice_symbol"
                value={headerData.invoice_symbol}
                onChange={handleHeaderChange}
                placeholder="Nhập ký hiệu hóa đơn"
                disabled={isLockedOnlyPrint}            
            />
            </div>

            <div className="form-group">
            <label>Số hóa đơn</label>
            <input
                name="invoice_no"
                value={headerData.invoice_no}
                onChange={handleHeaderChange}
                placeholder="Nhập số hóa đơn"
                disabled={isLockedOnlyPrint}            
            />
            </div>

            <div className="form-group">
            <label>Ngày, tháng, năm hóa đơn</label>
              <div className="input-with-icon">
                <input
                  name="invoice_date"
                  value={headerData.invoice_date}
                  onChange={handleHeaderChange}
                  onBlur={(e) =>
                    setHeaderData((prev) => ({
                      ...prev,
                      invoice_date: autoFillYear(e.target.value),
                    }))
                  }
                  placeholder="dd/mm/yyyy"
                  disabled={isLockedOnlyPrint}
                />

                <button type="button" disabled={isLockedOnlyPrint}>
                  <RiCalendarLine />
                  <input
                    type="date"
                    className="calendar-native-input"
                    disabled={isLockedOnlyPrint}
                    onChange={(e) =>
                      setHeaderData((prev) => ({
                        ...prev,
                        invoice_date: formatPickerDateToViDate(e.target.value),
                      }))
                    }
                  />
                </button>
              </div>
            </div>

            <div className="form-group">
                <label>MST</label>

                <div className="tax-code-load-row">
                    <input
                    name="tax_code"
                    value={headerData.tax_code}
                    onChange={handleHeaderChange}
                    placeholder="Nhập mã số thuế"
                    disabled={isLockedOnlyPrint}            
                    />

                    <button
                        type="button"
                        className="load-company-btn"
                        title="Load công ty theo MST"
                        onClick={handleLoadCompanyByTaxCode}
                        disabled={companyLoading || isLockedOnlyPrint}            
                      >
                      <RiLoader4Line className={companyLoading ? "loading-icon" : ""} />
                    </button>
                </div>
              </div>

            <div className="form-group">
            <label>Mã KH</label>
            <input
                name="supplier_code"
                value={headerData.supplier_code}
                onChange={handleHeaderChange}
                placeholder="Nhập mã khách hàng / NCC"
                disabled={isLockedOnlyPrint}            
            />
            </div>

            <div className="form-group">
            <label>Tên đơn vị cung cấp</label>
            <input
                name="supplier_name"
                value={headerData.supplier_name}
                onChange={handleHeaderChange}
                placeholder="Nhập tên đơn vị cung cấp"
                disabled={isLockedOnlyPrint}            
            />
            </div>
            <div className="form-group description-group">
            <label>Diễn giải</label>
            <input
                name="description"
                value={headerData.description}
                onChange={handleHeaderChange}
                placeholder="Nhập diễn giải"
                disabled={isPrintMode}
            />
            </div>
        </div>
        </div>
        <div className="detail-section-title">Chi tiết</div>

        <div className="detail-card">
          <div className="detail-search">
            <RiSearchLine />
            <input placeholder="Tìm kiếm" />
          </div>

          <div className="order-detail-table-wrapper">
            <table className="order-detail-table">
                <colgroup>
                  <col className="col-stt" />
                  <col className="col-code" />
                  <col className="col-name" />
                  <col className="col-unit" />
                  <col className="col-qty" />
                  <col className="col-qty" />
                  <col className="col-qty" />
                  <col className="col-check" />
                  <col className="col-price" />
                  <col className="col-amount" />
                  <col className="col-vat" />
                  <col className="col-action" />
                </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã hàng</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th>Tỷ lệ chuyển đổi</th>
                  <th>SL yêu cầu</th>
                  <th>SL thực nhập</th>
                  <th>Đánh dấu đủ</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                  <th>Thuế VAT</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={[
                        "goods-row",
                        activeGoodsRowId === item.id ? "goods-dropdown-active-row" : "",
                        item.is_delete ? "deleted-goods-row" : "",
                      ].join(" ")}
                    >
                    <td>{index + 1}</td>
                    <td className="goods-code-dropdown-cell">
                    <div className="goods-code-dropdown-box">
                        <input
                        value={item.goods_code}
                        placeholder="Chọn mã hàng"
                        onFocus={() => {
                            setActiveGoodsRowId(item.id);
                            setShowGoodsDropdown(true);
                            setGoodsKeyword(item.goods_code || "");

                            fetchGoodsDropdown({
                            keyword: item.goods_code || "",
                            pageNumber: 1,
                            append: false,
                            });
                        }}
                        onChange={(e) => {
                            const value = e.target.value;

                            handleChangeItemField(item.id, "goods_code", value);

                            setActiveGoodsRowId(item.id);
                            setShowGoodsDropdown(true);
                            setGoodsKeyword(value);

                            fetchGoodsDropdown({
                            keyword: value,
                            pageNumber: 1,
                            append: false,
                            });
                        }}
                        />

                        <button
                        type="button"
                        onClick={() => {
                            setActiveGoodsRowId(item.id);
                            setShowGoodsDropdown(!showGoodsDropdown);
                            setGoodsKeyword(item.goods_code || "");

                            fetchGoodsDropdown({
                            keyword: item.goods_code || "",
                            pageNumber: 1,
                            append: false,
                            });
                        }}
                        >
                        ▾
                        </button>

                        {showGoodsDropdown && activeGoodsRowId === item.id && (
                        <div
                            className="goods-code-dropdown-list"
                            onScroll={handleGoodsDropdownScroll}
                        >
                            <div className="goods-code-dropdown-header">
                            <span>Mã hàng</span>
                            <span>Tên hàng</span>
                            <button
                              type="button"
                              className="goods-code-add-btn"
                              title="Thêm hàng hóa"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowGoodsDropdown(false);
                                setShowAddGoodsModal(true);
                              }}
                              disabled={isPrintMode}
                            >
                              +
                            </button>
                            </div>

                            {goodsList.map((goods) => (
                            <div
                                key={goods.id}
                                className="goods-code-dropdown-item"
                                onClick={() => handleSelectGoods(goods)}
                            >
                                <span>{goods.code || goods.goods_code}</span>
                                <span>{goods.name || goods.goods_name}</span>
                                <span></span>
                            </div>
                            ))}

                            {goodsLoading && (
                            <div className="goods-code-dropdown-status">Đang tải...</div>
                            )}

                            {!goodsLoading && goodsList.length === 0 && (
                            <div className="goods-code-dropdown-status">Không có dữ liệu</div>
                            )}
                        </div>
                        )}
                    </div>
                    </td>
                    <td>{item.goods_name}</td>
                    <td>
                      <select
                        className="table-unit-select"
                        value={item.unit_id || ""}
                        onChange={(e) => handleChangeItemUnit(item.id, e.target.value)}
                        disabled={isPrintMode || !item.goods_id}
                      >
                        {item.unit_options && item.unit_options.length > 0 ? (
                          item.unit_options.map((unitItem) => (
                            <option key={unitItem.unit_id} value={unitItem.unit_id}>
                              {unitItem.unit_name}
                            </option>
                          ))
                        ) : (
                          <option value="">{item.unit || "Chọn ĐVT"}</option>
                        )}
                      </select>
                    </td>

                    <td className="number-col">
                      <input
                        className="table-number-input"
                        value={item.conversion_ratio || ""}
                        readOnly
                        disabled
                      />
                    </td>

                    <td className="number-col">
                      <input
                        className="table-number-input"
                        value={item.requested_quantity}
                        onChange={(e) =>
                          handleChangeItemField(item.id, "requested_quantity", e.target.value)
                        }
                        disabled={isPrintMode}
                      />
                    </td>
                    <td className="number-col">
                    <input
                        className="table-number-input"
                        value={item.actual_quantity}
                        onChange={(e) =>
                        handleChangeItemField(item.id, "actual_quantity", e.target.value)
                        }
                        disabled={isPrintMode}
                    />
                    </td>
                    <td className="center-col">
                      <input
                          type="checkbox"
                          checked={item.marked_old}
                          onChange={(e) =>
                            handleChangeItemField(item.id, "marked_old", e.target.checked)
                        }
                          disabled={isPrintMode}
                      />
                    </td>
                    <td className="number-col">
                    <input
                      className="table-number-input"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleChangeItemField(item.id, "unit_price", e.target.value)
                      }
                      onBlur={(e) =>
                        handleChangeItemField(
                          item.id,
                          "unit_price",
                          formatViNumber(e.target.value, 3)
                        )
                      }
                      disabled={isPrintMode}
                    />
                    </td>
                    <td className="number-col">{item.amount}</td>
                    <td>
                      <select
                        className="table-vat-select"
                        value={item.vat || "0"}
                        onChange={(e) =>
                          handleChangeItemField(item.id, "vat", e.target.value)
                        }
                        disabled={isPrintMode}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="8">8%</option>
                        <option value="10">10%</option>
                      </select>
                    </td>
                      <td className="delete-row-col">
                        <div className="detail-action-row add-row-action">
                          <button
                            type="button"
                            className="goods-code-add-btn"
                            onClick={() => handleAddRow(item.id)}
                            disabled={isPrintMode}
                          >
                            <RiAddLine />
                          </button>
                          <button
                            className="delete-row-btn"
                            onClick={() => handleDeleteRow(item.id)}
                            disabled={isPrintMode}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}

                <tr className="table-total-row">
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>

                  <td className="number-col">
                    {formatViNumber(
                      items.reduce((sum, item) => sum + parseNumber(item.requested_quantity), 0),
                      2
                    )}
                  </td>

                  <td className="number-col">
                    {formatViNumber(
                      items.reduce((sum, item) => sum + parseNumber(item.actual_quantity), 0),
                      2
                    )}
                  </td>

                  <td></td>
                  <td></td>
                  <td className="number-col">
                     {formatViNumber(totalAmount, 0)}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

                <div className="money-summary">
                  <div className="money-row">
                    <span>Cộng</span>
                    <strong>{formatViNumber(totalAmount, 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 0%</span>
                    <strong>{formatViNumber(vatSummary["0"], 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 5%</span>
                    <strong>{formatViNumber(vatSummary["5"], 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 8%</span>
                    <strong>{formatViNumber(vatSummary["8"], 0)}</strong>
                  </div>

                  <div className="money-row">
                    <span>Thuế VAT 10%</span>
                    <strong>{formatViNumber(vatSummary["10"], 0)}</strong>
                  </div>

                  <div className="money-row total">
                    <span>Tổng cộng</span>
                    <strong>{formatViNumber(grandTotal, 0)}</strong>
                  </div>
                </div>

          <div className="table-bottom-bar">
            <div>
              Tổng số: <strong>{items.length}</strong>
            </div>

            <div className="table-pagination">
              <span>Số dòng/trang</span>
              <select defaultValue={20}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <strong>1 - {items.length}</strong>
              <button disabled>‹</button>
              <button disabled>›</button>
            </div>
          </div>
        </div>
      </div>

      <div className="import-order-detail-footer">
        <button
          className="cancel-footer-btn"
          onClick={() => navigate("/dashboard/activity/import/order")}
        >
          {isPrintMode ? "Quay lại" : "Hủy"}
        </button>

        {isPrintMode ? (
          <>
            <button className="complete-btn" onClick={handleOpenReceiptPrint}>
              <RiPrinterLine />
              <span>In Phiếu nhập kho</span>
            </button>

            <button className="complete-btn" onClick={handleOpenTransferPrint}>
              <RiPrinterLine />
              <span>In Giấy Đề Nghị Chuyển tiền</span>
            </button>
          </>
        ) : (
          <>
            <button className="save-draft-btn" onClick={handleSaveDraft}>
                Lưu tạm
            </button>

            <button className="complete-btn" onClick={handleComplete}>
              Hoàn thành
            </button>
          </>
        )}
      </div>
          {showReceiptPrintModal && (
            <div className="print-reason-modal-overlay">
              <div className="print-reason-modal">
                <div className="print-reason-modal-header">
                  <h3>Người thủ kho</h3>
                  <button
                    type="button"
                    onClick={() => setShowReceiptPrintModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="print-reason-modal-body">
                  <label>Người thủ kho</label>
                  <input
                    value={receiptWarehouseKeeper}
                    onChange={(e) => setReceiptWarehouseKeeper(e.target.value)}
                    placeholder="Nhập tên người thủ kho"
                  />
                </div>

                <div className="print-reason-modal-footer">
                  <button
                    type="button"
                    className="print-reason-cancel-btn"
                    onClick={() => setShowReceiptPrintModal(false)}
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    className="print-reason-confirm-btn"
                    onClick={handleConfirmReceiptPrint}
                  >
                    Đồng ý in
                  </button>
                </div>
              </div>
            </div>
          )}
          {showPrintReasonModal && (
          <div className="print-reason-modal-overlay">
            <div className="print-reason-modal">
              <div className="print-reason-modal-header">
                <h3>Lý do in Phiếu nhập tiền</h3>
                <button
                  type="button"
                  onClick={() => setShowPrintReasonModal(false)}
                >
                  ×
                </button>
              </div>
                <div className="print-reason-modal-body">
                  <div className="transfer-info-grid">
                    <div className="form-group">
                      <label>MST</label>
                      <input value={headerData.tax_code} readOnly disabled />
                    </div>

                    <div className="form-group">
                      <label>Tên công ty</label>
                      <input value={headerData.supplier_name} readOnly disabled />
                    </div>

                    <div className="form-group transfer-full-row">
                      <label>Địa chỉ</label>
                      <input value={headerData.address} readOnly disabled />
                    </div>
                      <div className="form-group transfer-full-row">
                        <label>Chọn tài khoản ngân hàng đã lưu</label>
                        <select
                          value={transferBankId}
                          onChange={(e) => handleSelectTransferBank(e.target.value)}
                        >
                          <option value="">Không chọn / Nhập tay</option>

                          {bankAccountOptions.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.bank_account_name} - {bank.bank_account_number}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group transfer-full-row">
                        <label>Tên ngân hàng</label>
                        <input
                          value={transferBankName}
                          onChange={(e) => {
                            setTransferBankName(e.target.value);
                            setTransferBankId("");
                          }}
                          placeholder="Nhập tên ngân hàng"
                        />
                      </div>

                      <div className="form-group transfer-full-row">
                        <label>Số tài khoản ngân hàng</label>
                        <input
                          value={transferBankAccountNumber}
                          onChange={(e) => {
                            setTransferBankAccountNumber(e.target.value);
                            setTransferBankId("");
                          }}
                          placeholder="Nhập số tài khoản ngân hàng"
                        />
                      </div>
                  </div>

                  <label>Lý do</label>
                  <textarea
                    value={printReason}
                    onChange={(e) => setPrintReason(e.target.value)}
                    placeholder="Nhập lý do in phiếu"
                    rows={4}
                  />
                </div>

              <div className="print-reason-modal-footer">
                <button
                  type="button"
                  className="print-reason-cancel-btn"
                  onClick={() => setShowPrintReasonModal(false)}
                >
                  Hủy
                </button>

                <button
                  type="button"
                  className="print-reason-confirm-btn"
                  onClick={handleConfirmTransferPrint}
                >
                  Đồng ý in
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddGoodsModal && (
        <GoodsFormModal
          onClose={() => setShowAddGoodsModal(false)}
          onSuccess={(goods) => {
            setShowAddGoodsModal(false);

            if (goods) {
              handleSelectGoods(goods);
            }

            fetchGoodsDropdown({
              keyword: goodsKeyword,
              pageNumber: 1,
              append: false,
            });
          }}
        />
        )}
    </div>
  );
}

export default ImportOrderDetailPage;