import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/ReleaseOrderDetailPage.css";
import { getWarehouses } from "../../../services/warehouseService";
import { getGoods } from "../../../services/goodsService";
import { getOpeningStocks } from "../../../services/openingStockService";
import {
  createReleaseOrder,
  submitReleaseOrder,
  getReleaseOrderByCode,
  updateReleaseOrder,
  getReleaseReferencesPageable,
  checkReleaseDuplicate,
} from "../../../services/releaseOrderService";

import {
  RiAddLine,
  RiDeleteBin6Line,
  RiCloseLine,
  RiSearchLine,
  RiCalendarLine,
} from "react-icons/ri";

function ReleaseOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canDo } = useAuth();
  const [searchParams] = useSearchParams();
  const [receiverUnitOptions, setReceiverUnitOptions] = useState([]);
  const [releaseTargetOptions, setReleaseTargetOptions] = useState([]);
  const [receiverUnitMode, setReceiverUnitMode] = useState("select");
  const [releaseTargetMode, setReleaseTargetMode] = useState("select");
  const isCreateMode = !id || id === "new";
  const isPrintMode = searchParams.get("mode") === "print";
  const cloneFrom = searchParams.get("clone_from");
  const isCloneMode = isCreateMode && Boolean(cloneFrom);

  const canSave = isCreateMode
    ? canDo("create_warehouse_release")
    : canDo("update_warehouse_release");

  const canComplete = canDo("complete_warehouse_release");

  const [releaseId, setReleaseId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [duplicateWarningData, setDuplicateWarningData] = useState(null);
  const [duplicatePendingAction, setDuplicatePendingAction] = useState(null);
  const [duplicateActionLoading, setDuplicateActionLoading] = useState(false);

  const [warehouseList, setWarehouseList] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const [goodsList, setGoodsList] = useState([]);
  const [goodsPage, setGoodsPage] = useState(1);
  const [goodsTotalPages, setGoodsTotalPages] = useState(1);
  const [goodsLoading, setGoodsLoading] = useState(false);
  const [showGoodsDropdown, setShowGoodsDropdown] = useState(false);
  const [activeGoodsRowId, setActiveGoodsRowId] = useState(null);
  const [goodsKeyword, setGoodsKeyword] = useState("");
  const [debouncedGoodsKeyword, setDebouncedGoodsKeyword] = useState("");
  const [deletedItems, setDeletedItems] = useState([]);
  const enterNavigationRef = useRef(null);
  const warehouseIdRef = useRef("");
  const debouncedGoodsKeywordRef = useRef("");
  const goodsSearchRequestIdRef = useRef(0);
  const goodsPendingRequestsRef = useRef(0);
  const goodsRequestControllerRef = useRef(null);

  const handleEnterMoveNext = (event) => {
  if (
    event.key !== "Enter" ||
    event.nativeEvent?.isComposing ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey
  ) {
    return;
  }

  event.preventDefault();

  const container = enterNavigationRef.current;

  if (!container) return;

  const fields = Array.from(
    container.querySelectorAll(
      '[data-enter-next="true"]:not(:disabled):not([readonly])'
    )
  );

  const currentIndex = fields.indexOf(event.currentTarget);

  if (currentIndex === -1) return;

  const nextIndex = event.shiftKey
    ? currentIndex - 1
    : currentIndex + 1;

  const nextField = fields[nextIndex];

  // Làm mất focus để onBlur của ô hiện tại chạy trước
  event.currentTarget.blur();

  if (!nextField) return;

  requestAnimationFrame(() => {
    nextField.focus();

    if (
      nextField.tagName === "INPUT" &&
      nextField.type !== "checkbox" &&
      typeof nextField.select === "function"
    ) {
      nextField.select();
    }
  });
};

  const fetchReleaseReferences = async (warehouseId) => {
    try {
        const baseParams = warehouseId ? { warehouse_id: warehouseId } : {};

        const [targetResponse, receiverResponse] = await Promise.all([
        getReleaseReferencesPageable({
            ...baseParams,
            type: "RELEASE_TARGET",
        }),
        getReleaseReferencesPageable({
            ...baseParams,
            type: "RECEIVER_UNIT",
        }),
        ]);

        setReleaseTargetOptions(targetResponse.data || []);
        setReceiverUnitOptions(receiverResponse.data || []);
    } catch (error) {
        console.error(
        "LOAD RELEASE REFERENCES ERROR:",
        error.response?.data || error
        );
    }
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

  const convertViDateToPickerDate = (value) => {
    if (!value) return "";

    const text = String(value).trim();
    if (!text) return "";

    if (text.includes("/")) {
      const [day, month, year] = text.split("/");
      if (!day || !month || !year) return "";
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return text.split("T")[0];
  };

  const openDatePicker = (event) => {
    const picker = event.currentTarget.querySelector(".calendar-native-input");
    if (!picker || picker.disabled) return;

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.click();
  };

  const formatISOToViDate = (value) => {
    if (!value) return "";

    const dateOnly = String(value).split("T")[0];

    if (dateOnly.includes("/")) return dateOnly;

    const [year, month, day] = dateOnly.split("-");
    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
  };

  const convertDateToISO = (value) => {
    if (!value) return null;

    const text = String(value).trim();

    if (text.includes("/")) {
      const [day, month, year] = text.split("/");

      if (day && month && year) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }

    return text.split("T")[0];
  };

  const autoFillYear = (value) => {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{1,2})\/(\d{1,2})$/);

    if (!match) return value;

    const currentYear = new Date().getFullYear();
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");

    return `${day}/${month}/${currentYear}`;
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    const text = String(value).trim();
    if (!text) return 0;

    let normalized = text;

    if (text.includes(",")) {
      normalized = text.replace(/\./g, "").replace(",", ".");
    } else if ((text.match(/\./g) || []).length > 1) {
      normalized = text.replace(/\./g, "");
    }

    const number = Number(normalized);
    return Number.isNaN(number) ? 0 : number;
  };

  const formatViNumber = (value, fractionDigits = 2) => {
    const number = parseNumber(value);

    return number.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };

  const parseExpressionNumber = (value) => {
  const text = String(value || "").trim();

  if (!text) {
    throw new Error("Số không hợp lệ");
  }

  let normalized = text;

  // Dạng Việt Nam: 1.234,56
  if (text.includes(",")) {
    if ((text.match(/,/g) || []).length > 1) {
      throw new Error("Số không hợp lệ");
    }

    const [integerPart, decimalPart] = text.split(",");
    const normalizedInteger = integerPart.replace(/\./g, "");

    if (
      !normalizedInteger ||
      !/^\d+$/.test(normalizedInteger) ||
      !decimalPart ||
      !/^\d+$/.test(decimalPart)
    ) {
      throw new Error("Số không hợp lệ");
    }

    normalized = `${normalizedInteger}.${decimalPart}`;
  }
  // Dạng phân cách hàng nghìn: 1.000 hoặc 1.000.000
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, "");
  }
  // Dạng số thông thường: 10 hoặc 10.5
  else if (!/^\d+(\.\d+)?$/.test(text)) {
    throw new Error("Số không hợp lệ");
  }

  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    throw new Error("Số không hợp lệ");
  }

  return number;
};

const evaluateQuantityExpression = (value) => {
  const expression = String(value ?? "").replace(/\s+/g, "");

  if (!expression) return null;

  // Chỉ cho nhập số, dấu thập phân, phép tính và ngoặc
  if (!/^[0-9.,+\-*/()]+$/.test(expression)) {
    return null;
  }

  let position = 0;

  const currentCharacter = () => expression[position];

  const parseFactor = () => {
    const character = currentCharacter();

    // Số âm hoặc số dương
    if (character === "+" || character === "-") {
      position += 1;

      const valueAfterSign = parseFactor();

      return character === "-" ? -valueAfterSign : valueAfterSign;
    }

    // Biểu thức trong ngoặc
    if (character === "(") {
      position += 1;

      const result = parseExpression();

      if (currentCharacter() !== ")") {
        throw new Error("Thiếu dấu đóng ngoặc");
      }

      position += 1;
      return result;
    }

    // Đọc một số
    const startPosition = position;

    while (
      position < expression.length &&
      /[0-9.,]/.test(currentCharacter())
    ) {
      position += 1;
    }

    if (startPosition === position) {
      throw new Error("Thiếu số");
    }

    const numberText = expression.slice(startPosition, position);

    return parseExpressionNumber(numberText);
  };

  const parseTerm = () => {
    let result = parseFactor();

    while (
      currentCharacter() === "*" ||
      currentCharacter() === "/"
    ) {
      const operator = currentCharacter();
      position += 1;

      const rightValue = parseFactor();

      if (operator === "*") {
        result *= rightValue;
      } else {
        if (rightValue === 0) {
          throw new Error("Không thể chia cho 0");
        }

        result /= rightValue;
      }
    }

    return result;
  };

  function parseExpression() {
    let result = parseTerm();

    while (
      currentCharacter() === "+" ||
      currentCharacter() === "-"
    ) {
      const operator = currentCharacter();
      position += 1;

      const rightValue = parseTerm();

      if (operator === "+") {
        result += rightValue;
      } else {
        result -= rightValue;
      }
    }

    return result;
  }

  try {
    const result = parseExpression();

    if (position !== expression.length || !Number.isFinite(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
};

  const parseConversionRatio = (value) => {
    if (value === null || value === undefined || value === "") return 1;
    if (typeof value === "number") return value;

    const text = String(value).trim();

    if (text.includes(",")) {
      return Number(text.replace(/\./g, "").replace(",", "."));
    }

    if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
      return Number(text.replace(/\./g, ""));
    }

    return Number(text) || 1;
  };

  const mapUnitOptions = (units) =>
    Array.isArray(units)
      ? units.map((unitItem) => ({
          unit_id: unitItem.unit_id || "",
          unit_name: unitItem.unit_name || "",
          conversion_ratio:
          unitItem.conversion_ratio !== null &&
          unitItem.conversion_ratio !== undefined
            ? Number(unitItem.conversion_ratio)
            : null,
          is_default: Boolean(unitItem.is_default),
        }))
      : [];

  const fetchUnitsByGoodsIds = async (_warehouseId, goodsIds) => {
    if (!goodsIds.length) return {};

    const entries = goodsIds.map((goodsId) => [goodsId, []]);
    return Object.fromEntries(entries);
  };

  const [headerData, setHeaderData] = useState({
    terms: getCurrentTerms(),
    release_date: getTodayViDate(),
    warehouse_id: "",
    receiver_unit: "",
    release_target: "",
    contract_number: "",
    description: "",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      release_inventory_id: "",
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
      is_delete: false,
    },
  ]);

  const createEmptyRow = () => ({
    id: Date.now(),
    release_inventory_id: "",
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
    is_delete: false,
  });

    const handleHeaderChange = (e) => {
    const { name, value } = e.target;

    setHeaderData((prev) => ({
        ...prev,
        [name]: value,
    }));

    if (name === "warehouse_id") {
        setGoodsList([]);
        setGoodsKeyword("");
        setShowGoodsDropdown(false);
        setActiveGoodsRowId(null);
        setItems([createEmptyRow()]);
        setDeletedItems([]);
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

  const fetchGoodsDropdown = useCallback(async ({
    keyword = "",
    pageNumber = 1,
    append = false,
    warehouseId = warehouseIdRef.current,
  } = {}) => {
    if (!warehouseId) return;

    const keywordSnapshot = keyword;
    const requestId = append ? null : ++goodsSearchRequestIdRef.current;

    if (goodsRequestControllerRef.current) {
      goodsRequestControllerRef.current.abort();
    }

    const controller = new AbortController();
    goodsRequestControllerRef.current = controller;

    goodsPendingRequestsRef.current += 1;
    setGoodsLoading(true);

    try {
      const data = await getGoods(
        {
          search: keywordSnapshot,
          page: pageNumber,
          page_size: 30,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) {
        return;
      }

      if (!append && requestId !== goodsSearchRequestIdRef.current) {
        return;
      }
      if (append && keywordSnapshot !== debouncedGoodsKeywordRef.current) {
        return;
      }

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
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return;
      }

      console.error("LOAD GOODS DROPDOWN ERROR:", error.response?.data || error);
      alert("Không tải được danh sách hàng hóa");
    } finally {
      if (goodsRequestControllerRef.current === controller) {
        goodsRequestControllerRef.current = null;
      }
      goodsPendingRequestsRef.current -= 1;
      if (goodsPendingRequestsRef.current === 0) {
        setGoodsLoading(false);
      }
    }
  }, []);

  const openGoodsDropdown = (rowId, keyword = "") => {
    const normalizedKeyword = keyword || "";
    setActiveGoodsRowId(rowId);
    setShowGoodsDropdown(true);
    setGoodsKeyword(normalizedKeyword);
    setDebouncedGoodsKeyword(normalizedKeyword);
  };

  const handleGoodsDropdownScroll = (e) => {
    const element = e.currentTarget;

    const isBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 8;

    if (isBottom && !goodsLoading && goodsPage < goodsTotalPages) {
      fetchGoodsDropdown({
        keyword: debouncedGoodsKeywordRef.current,
        pageNumber: goodsPage + 1,
        append: true,
      });
    }
  };

  const handleSelectGoods = (goods) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeGoodsRowId) return item;

        const unitOptions = mapUnitOptions(goods.units);
        const defaultUnit =
          unitOptions.find((unitItem) => unitItem.is_default) ||
          unitOptions[0] ||
          null;

        return {
          ...item,
          goods_id: goods.goods_id || goods.id,
          goods_code: goods.goods_code || goods.code || "",
          goods_name: goods.goods_name || goods.name || "",
          remaining_quantity: goods.quantity ?? goods.remaining_quantity ?? 0,
          unit_id: defaultUnit?.unit_id || goods.unit_id || "",
          unit: defaultUnit?.unit_name || goods.unit_name || goods.unit || "",
          unit_options: unitOptions,
          conversion_ratio:
          defaultUnit?.conversion_ratio !== null &&
          defaultUnit?.conversion_ratio !== undefined
            ? String(defaultUnit.conversion_ratio)
            : "",
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
          conversion_ratio:
            selectedUnit?.conversion_ratio !== null &&
            selectedUnit?.conversion_ratio !== undefined
              ? String(selectedUnit.conversion_ratio)
              : "",
        };
      })
    );
  };

  const handleChangeItemField = (rowId, field, value) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== rowId) return item;

          const nextItem = {
            ...item,
            [field]: value,
          };

          if (field === "marked_old") {
            nextItem.actual_quantity = value ? item.requested_quantity : "0,00";
          }

          if (field === "requested_quantity" && nextItem.marked_old) {
            nextItem.actual_quantity = value;
          }

          return nextItem;
        })
      );
    };

    const handleRequestedQuantityBlur = (rowId, value) => {
      const result = evaluateQuantityExpression(value);

      if (result === null) {
        alert(
          "Phép tính SL yêu cầu không hợp lệ.\n" +
          "Ví dụ hợp lệ: 10 + 5 - 2 hoặc (10 + 5) * 2"
        );

        return false;
      }

      if (result < 0) {
        alert("SL yêu cầu không được nhỏ hơn 0");
        return false;
      }

      handleChangeItemField(
        rowId,
        "requested_quantity",
        formatViNumber(result, 2)
      );

      return true;
    };

  const handleAddRow = (rowId) => {
    setItems((prev) => {
      const newRow = createEmptyRow();

      if (!rowId) return [...prev, newRow];

      const index = prev.findIndex((item) => item.id === rowId);
      if (index === -1) return [...prev, newRow];

      return [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)];
    });
  };

  const handleRequestedQuantityKeyDown = (event, rowId) => {
  if (
    event.nativeEvent?.isComposing ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey
  ) {
    return;
  }

  // Mũi tên xuống: chuyển sang ô SL yêu cầu của dòng kế tiếp,
  // không thêm dòng mới.
  if (event.key === "ArrowDown") {
    event.preventDefault();

    const currentIndex = items.findIndex(
      (item) => String(item.id) === String(rowId)
    );
    const nextItem = items[currentIndex + 1];

    if (!nextItem) return;

    const isValid = handleRequestedQuantityBlur(
      rowId,
      event.currentTarget.value
    );

    if (!isValid) {
      event.currentTarget.focus();
      event.currentTarget.select();
      return;
    }

    requestAnimationFrame(() => {
      const nextQuantityInput =
        enterNavigationRef.current?.querySelector(
          `[data-requested-quantity-row-id="${String(nextItem.id)}"]`
        );

      if (!nextQuantityInput) return;

      nextQuantityInput.focus();
      nextQuantityInput.select();
    });

    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  // Shift + Enter vẫn quay lại ô trước.
  if (event.shiftKey) {
    handleEnterMoveNext(event);
    return;
  }

  // Enter: kiểm tra SL yêu cầu rồi thêm một dòng mới ngay bên dưới.
  event.preventDefault();

  const isValid = handleRequestedQuantityBlur(
    rowId,
    event.currentTarget.value
  );

  if (!isValid) {
    event.currentTarget.focus();
    event.currentTarget.select();
    return;
  }

  const newRow = createEmptyRow();

  setItems((prev) => {
    const currentIndex = prev.findIndex(
      (item) => String(item.id) === String(rowId)
    );

    if (currentIndex === -1) {
      return [...prev, newRow];
    }

    return [
      ...prev.slice(0, currentIndex + 1),
      newRow,
      ...prev.slice(currentIndex + 1),
    ];
  });

  setShowGoodsDropdown(false);
  setActiveGoodsRowId(null);
  setGoodsKeyword("");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const newGoodsCodeInput =
        enterNavigationRef.current?.querySelector(
          `[data-goods-code-row-id="${String(newRow.id)}"]`
        );

      if (!newGoodsCodeInput) return;

      newGoodsCodeInput.focus();

      if (typeof newGoodsCodeInput.select === "function") {
        newGoodsCodeInput.select();
      }
    });
  });
};

  const handleDeleteRow = (rowId) => {
    setItems((prev) => {
      const deletedItem = prev.find((item) => item.id === rowId);

      if (deletedItem?.release_inventory_id) {
        setDeletedItems((old) => {
          const existed = old.some(
            (item) =>
              String(item.release_inventory_id) ===
              String(deletedItem.release_inventory_id)
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

    const buildReleasePayload = () => {
    const releasePayloadItems = [
        ...items.map((item) => ({
        ...item,
        is_delete: false,
        })),
        ...deletedItems.map((item) => ({
        ...item,
        is_delete: true,
        })),
    ];

    return {
        terms: headerData.terms || null,
        release_date: convertDateToISO(headerData.release_date),
        warehouse_id: headerData.warehouse_id,
        receiver_unit: headerData.receiver_unit || null,
        receiver_unit_id: null,
        release_target: headerData.release_target || null,
        release_target_id: null,
        contract_number: headerData.contract_number?.trim() || null,
        description: headerData.description || null,

        items: releasePayloadItems
        .filter((item) => item.goods_id)
        .map((item) => ({
            item_id: item.release_inventory_id || null,
            goods_id: item.goods_id,
            goods_unit_id: item.unit_id || null,
            goods_name_display: item.goods_name || null,
            requested_quantity:
              evaluateQuantityExpression(item.requested_quantity) ?? 0,
            conversion_ratio: parseConversionRatio(item.conversion_ratio || 1),
            is_delete: Boolean(item.is_delete),
        })),
    };
    };

    const checkDuplicateBeforeSave = async () => {
      const payload = buildReleasePayload();

      const selectedReleaseTarget = releaseTargetOptions.find(
        (item) => item.name === headerData.release_target
      );

      const response = await checkReleaseDuplicate({
        release_date: payload.release_date,

        release_target_id:
          selectedReleaseTarget?.id || null,

        items: payload.items
          .filter((item) => !item.is_delete)
          .map((item) => ({
            goods_id: item.goods_id,
          })),

        window_days: 30,

        ...(!isCreateMode && releaseId
          ? { exclude_release_id: releaseId }
          : {}),
      });

      const data =
        response?.data?.data ??
        response?.data ??
        response ??
        {};

      return data?.has_warning ? data : null;
    };

const executeSaveDraft = async () => {
  const payload = buildReleasePayload();

  if (isCreateMode) {
    await createReleaseOrder(payload);
  } else {
    await updateReleaseOrder(releaseId, payload);
  }

  alert("Lưu lệnh xuất kho thành công");
  navigate("/dashboard/activity/export/order");
};

const executeComplete = async () => {
  const payload = buildReleasePayload();

  let targetId = releaseId;

  if (isCreateMode) {
    const created = await createReleaseOrder(payload);

    const createdData =
      created?.data?.data ||
      created?.data ||
      created;

    targetId = createdData?.id;
  } else {
    await updateReleaseOrder(releaseId, payload);
  }

  if (targetId) {
    await submitReleaseOrder(targetId);
  }

  alert("Trình duyệt lệnh xuất kho thành công");
  navigate("/dashboard/activity/export/order");
};

const closeDuplicateWarning = () => {
  if (duplicateActionLoading) return;

  setDuplicateWarningData(null);
  setDuplicatePendingAction(null);
};

const handleConfirmDuplicateAction = async () => {
  if (!duplicatePendingAction || duplicateActionLoading) return;

  try {
    setDuplicateActionLoading(true);

    // Không check duplicate lần 2.
    if (duplicatePendingAction === "save") {
      await executeSaveDraft();
    } else {
      await executeComplete();
    }
  } catch (error) {
    console.error(
      "CONFIRM DUPLICATE RELEASE ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Không thể tiếp tục tạo lệnh xuất kho"
    );
  } finally {
    setDuplicateActionLoading(false);
  }
};

const getDuplicateTicketStatusText = (status) => {
  switch (status) {
    case "PENDING":
      return "Nháp";
    case "WAIT_TO_APPROVE":
      return "Chờ duyệt";
    case "WAITING_RELEASE":
      return "Chờ xuất kho";
    case "RELEASED":
      return "Đã xuất kho";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status || "—";
  }
};

  const validateBeforeSubmit = () => {
    if (!headerData.release_date) {
      alert("Vui lòng nhập ngày xuất kho");
      return false;
    }

    if (!headerData.warehouse_id) {
      alert("Vui lòng chọn kho xuất");
      return false;
    }

    if (!headerData.receiver_unit) {
      alert("Vui lòng nhập đơn vị lĩnh vật tư");
      return false;
    }

    if (!headerData.release_target) {
      alert("Vui lòng nhập đối tượng xuất kho");
      return false;
    }

    const validItems = items.filter((item) => item.goods_id);

    const invalidQuantityItem = validItems.find((item) => {
    const result = evaluateQuantityExpression(
      item.requested_quantity
    );

    return result === null || result < 0;
  });

  if (invalidQuantityItem) {
    alert(
      `SL yêu cầu của vật tư ${
        invalidQuantityItem.goods_code || ""
      } không hợp lệ`
    );

    return false;
}

    if (validItems.length === 0) {
      alert("Vui lòng chọn ít nhất một vật tư");
      return false;
    }
    
    return true;
  };

const handleSaveDraft = async () => {
  try {
    if (!validateBeforeSubmit()) return;

    const duplicateData = await checkDuplicateBeforeSave();

    if (duplicateData) {
      setDuplicateWarningData(duplicateData);
      setDuplicatePendingAction("save");
      return;
    }

    await executeSaveDraft();
  } catch (error) {
    console.error(
      "SAVE RELEASE ORDER ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Lưu lệnh xuất kho thất bại"
    );
  }
};

const handleComplete = async () => {
  try {
    if (!validateBeforeSubmit()) return;

    const duplicateData = await checkDuplicateBeforeSave();

    if (duplicateData) {
      setDuplicateWarningData(duplicateData);
      setDuplicatePendingAction("complete");
      return;
    }

    await executeComplete();
  } catch (error) {
    console.error(
      "SUBMIT RELEASE ORDER ERROR:",
      error.response?.data || error
    );

    alert(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "Trình duyệt lệnh xuất kho thất bại"
    );
  }
};

    const fetchReleaseDetail = async (releaseCode) => {
    if (!releaseCode || releaseCode === "new") return;

    try {
        setDetailLoading(true);

        const response = await getReleaseOrderByCode(releaseCode);
        const data = response.data;

        setReleaseId(data.id);

        setHeaderData((prev) => ({
        ...prev,
        terms: data.terms || "",
        release_date: formatISOToViDate(data.release_date),
        warehouse_id: data.warehouse_id || "",
        receiver_unit: data.receiver_unit?.name || "",
        release_target: data.release_target?.name || "",
        contract_number: data.contract_number || "",
        description: data.description || "",
        }));

        const lines = data.items || [];
        const uniqueGoodsIds = [
          ...new Set(lines.map((line) => line.goods_id).filter(Boolean)),
        ];
        const unitsByGoodsId = await fetchUnitsByGoodsIds(
          data.warehouse_id,
          uniqueGoodsIds
        );

        setItems(
        lines.length > 0
            ? lines.map((line, index) => {
                const requestedQuantity = parseNumber(line.requested_quantity);
                const actualQuantity = parseNumber(line.actual_quantity);
                const lineUnits = unitsByGoodsId[line.goods_id] || [];
                const unitOptions = mapUnitOptions(lineUnits);
                const selectedUnit = unitOptions.find(
                  (unitItem) =>
                    String(unitItem.unit_id) === String(line.goods_unit_id)
                );

                return {
                id: line.item_id || index + 1,
                release_inventory_id: line.item_id || "",
                goods_id: line.goods_id || "",
                goods_code: line.goods_code || "",
                goods_name: line.goods_name || "",
                unit_id: line.goods_unit_id || "",
                unit: selectedUnit?.unit_name || line.goods_unit_name || "",
                unit_options: unitOptions,
                conversion_ratio:
                  line.conversion_ratio !== null &&
                  line.conversion_ratio !== undefined
                    ? String(line.conversion_ratio)
                    : line.goods_conversion_ratio !== null &&
                      line.goods_conversion_ratio !== undefined
                    ? String(line.goods_conversion_ratio)
                    : line.unit_conversion_ratio !== null &&
                      line.unit_conversion_ratio !== undefined
                    ? String(line.unit_conversion_ratio)
                    : selectedUnit?.conversion_ratio !== null &&
                      selectedUnit?.conversion_ratio !== undefined
                    ? String(selectedUnit.conversion_ratio)
                    : "",
                requested_quantity: formatViNumber(requestedQuantity, 2),
                actual_quantity: formatViNumber(actualQuantity, 2),
                marked_old: requestedQuantity === actualQuantity,
                is_delete: false,
                };
            })
            : [createEmptyRow()]
        );
    } catch (error) {
        console.error("LOAD RELEASE DETAIL ERROR:", error.response?.data || error);
        alert("Không tải được chi tiết phiếu xuất");
    } finally {
        setDetailLoading(false);
    }
    };

    const fetchCloneReleaseDetail = async (releaseCode) => {
      if (!releaseCode) return;

      try {
        setDetailLoading(true);

        const response = await getReleaseOrderByCode(releaseCode);

        const data = response?.data?.data || response?.data || response;

        const warehouseId = data.warehouse_id || "";

        const receiverUnitName =
          data.receiver_unit?.name ||
          data.receiver_unit_name ||
          "";

        const releaseTargetName =
          data.release_target?.name ||
          data.release_target_name ||
          "";

        setReleaseId(null);

        setHeaderData({
          terms: data.terms || getCurrentTerms(),
          release_date: data.release_date || getTodayViDate(),
          warehouse_id: warehouseId,
          receiver_unit: receiverUnitName,
          release_target: releaseTargetName,
          contract_number: data.contract_number || "",
          description: data.description || "",
        });

        setReceiverUnitMode("manual");
        setReleaseTargetMode("manual");

        const lines = Array.isArray(data.items) ? data.items : [];

        const uniqueGoodsIds = [
          ...new Set(lines.map((line) => line.goods_id).filter(Boolean)),
        ];

        const unitsByGoodsId = await fetchUnitsByGoodsIds(
          warehouseId,
          uniqueGoodsIds
        );

        setItems(
          lines.length > 0
            ? lines.map((line, index) => {
                const requestedQuantity = parseNumber(line.requested_quantity);

                const lineUnits = unitsByGoodsId[line.goods_id] || [];
                const unitOptions = mapUnitOptions(lineUnits);

                const selectedUnit = unitOptions.find(
                  (unitItem) =>
                    String(unitItem.unit_id) === String(line.goods_unit_id)
                );

                return {
                  id: Date.now() + index,

                  // Không giữ item_id cũ khi nhân bản
                  release_inventory_id: "",

                  goods_id: line.goods_id || "",
                  goods_code: line.goods_code || "",
                  goods_name: line.goods_name || "",

                  unit_id: line.goods_unit_id || "",
                  unit:
                    selectedUnit?.unit_name ||
                    line.goods_unit_name ||
                    line.default_goods_unit_name ||
                    "",

                  unit_options:
                    unitOptions.length > 0
                      ? unitOptions
                      : [
                          {
                            unit_id: line.goods_unit_id || "",
                            unit_name:
                              line.goods_unit_name ||
                              line.default_goods_unit_name ||
                              "",
                            conversion_ratio: 1,
                            is_default: true,
                          },
                        ],

              conversion_ratio:
                line.conversion_ratio !== null &&
                line.conversion_ratio !== undefined
                  ? String(line.conversion_ratio)
                  : line.goods_conversion_ratio !== null &&
                    line.goods_conversion_ratio !== undefined
                  ? String(line.goods_conversion_ratio)
                  : line.unit_conversion_ratio !== null &&
                    line.unit_conversion_ratio !== undefined
                  ? String(line.unit_conversion_ratio)
                  : selectedUnit?.conversion_ratio !== null &&
                    selectedUnit?.conversion_ratio !== undefined
                  ? String(selectedUnit.conversion_ratio)
                  : "",

                  requested_quantity: formatViNumber(requestedQuantity, 2),

                  // Phiếu mới nên reset thực xuất
                  actual_quantity: "0,00",

                  marked_old: false,
                  is_delete: false,
                };
              })
            : [createEmptyRow()]
        );

        setDeletedItems([]);
      } catch (error) {
        console.error("CLONE RELEASE DETAIL ERROR:", error.response?.data || error);
        alert("Không tải được dữ liệu phiếu cần nhân bản");
      } finally {
        setDetailLoading(false);
      }
    };

    useEffect(() => {
        fetchWarehouseList();
    }, []);

    // Danh sách đối tượng xuất kho / đơn vị lĩnh được cache theo kho —
    // tải lại mỗi khi người dùng đổi kho xuất
    useEffect(() => {
        fetchReleaseReferences(headerData.warehouse_id);
    }, [headerData.warehouse_id]);

    useEffect(() => {
      if (!isCreateMode) {
        fetchReleaseDetail(id);
        return;
      }

      if (cloneFrom) {
        fetchCloneReleaseDetail(cloneFrom);
      }
    }, [id, cloneFrom, isCreateMode]);

  useEffect(() => {
    warehouseIdRef.current = headerData.warehouse_id;
  }, [headerData.warehouse_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGoodsKeyword(goodsKeyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [goodsKeyword]);

  useEffect(() => {
    debouncedGoodsKeywordRef.current = debouncedGoodsKeyword;
  }, [debouncedGoodsKeyword]);

  useEffect(() => {
    if (!showGoodsDropdown || !headerData.warehouse_id) return;

    fetchGoodsDropdown({
      keyword: debouncedGoodsKeyword,
      pageNumber: 1,
      append: false,
      warehouseId: headerData.warehouse_id,
    });
  }, [debouncedGoodsKeyword, showGoodsDropdown, headerData.warehouse_id, fetchGoodsDropdown]);

  if (detailLoading) {
    return <div className="import-order-detail-page">Đang tải dữ liệu...</div>;
  }

  const hasWarehouseSelected = Boolean(headerData.warehouse_id);

  return (
    <div className="import-order-detail-page">
      <div className="import-order-detail-header">
        <div className="detail-header-left">
          <h2>
            {isCloneMode
              ? `Nhân bản lệnh xuất kho từ ${cloneFrom}`
              : isCreateMode
              ? "Lệnh xuất kho vật tư"
              : `Lệnh xuất kho vật tư ${id}`}
          </h2>

          <select className="header-select" defaultValue="release">
            <option value="release">Xuất kho vật tư</option>
          </select>
        </div>

        <div className="detail-header-actions">
          <button
            className="header-icon-btn"
            onClick={() => navigate("/dashboard/activity/export/order")}
          >
            <RiCloseLine />
          </button>
        </div>
      </div>

      <div
        className="import-order-detail-body"
        ref={enterNavigationRef}
      >
        <div className="info-section-title">Thông tin phiếu xuất kho</div>

        <div className="import-voucher-card">
          <div className="voucher-grid">
            <div className="form-group">
              <label>Kỳ</label>
              <input
                data-enter-next="true"
                onKeyDown={handleEnterMoveNext}
                name="terms"
                value={headerData.terms}
                onChange={handleHeaderChange}
                placeholder="Nhập kỳ"
                disabled={isPrintMode}
              />
            </div>

            <div className="form-group">
              <label>Số phiếu XK</label>
                <input
                  value={
                    id && id !== "new"
                      ? id
                      : isCloneMode
                      ? "Tự động tạo khi lưu phiếu nhân bản"
                      : "Tự động tạo khi hoàn thành"
                  }
                  readOnly
                  disabled
                />
            </div>

            <div className="form-group">
              <label>
                Ngày, tháng, năm XK <span>*</span>
              </label>

              <div className="input-with-icon">
                <input
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  className="date-text-input"
                  name="release_date"
                  value={headerData.release_date}
                  onChange={handleHeaderChange}
                  onBlur={(e) =>
                    setHeaderData((prev) => ({
                      ...prev,
                      release_date: autoFillYear(e.target.value),
                    }))
                  }
                  placeholder="dd/mm/yyyy"
                  disabled={isPrintMode}
                />
                <button
                  type="button"
                  disabled={isPrintMode}
                  onClick={openDatePicker}
                >
                  <RiCalendarLine />
                  <input
                    type="date"
                    className="calendar-native-input"
                    value={convertViDateToPickerDate(headerData.release_date)}
                    disabled={isPrintMode}
                    onChange={(e) =>
                      setHeaderData((prev) => ({
                        ...prev,
                        release_date: formatPickerDateToViDate(e.target.value),
                      }))
                    }
                  />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                Xuất kho <span>*</span>
              </label>
                <select
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  name="warehouse_id"
                  value={headerData.warehouse_id}
                  onChange={handleHeaderChange}
                  disabled={isPrintMode}
                >
                <option value="">
                  {warehouseLoading ? "Đang tải danh sách kho..." : "Chọn kho xuất"}
                </option>

                {warehouseList.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
                <label>
                    Đơn vị lĩnh vật tư <span>*</span>
                </label>
                    {receiverUnitMode === "manual" ? (
                    <>
                        <input
                          data-enter-next="true"
                          onKeyDown={handleEnterMoveNext}
                          value={headerData.receiver_unit}
                          onChange={(e) =>
                            setHeaderData((prev) => ({
                              ...prev,
                              receiver_unit: e.target.value,
                            }))
                          }
                          placeholder="Nhập đơn vị lĩnh vật tư"
                          disabled={isPrintMode}
                        />
                        <button
                        type="button"
                        className="switch-select-btn"
                        onClick={() => {
                            setReceiverUnitMode("select");
                            setHeaderData((prev) => ({
                            ...prev,
                            receiver_unit: "",
                            }));
                        }}
                        >
                        Chọn từ danh sách
                        </button>
                    </>
                    ) : (
                    <select
                      data-enter-next="true"
                      onKeyDown={handleEnterMoveNext}
                      value={headerData.receiver_unit}
                      onChange={(e) => {
                        if (e.target.value === "__manual__") {
                          setReceiverUnitMode("manual");
                          return;
                        }

                        setHeaderData((prev) => ({
                          ...prev,
                          receiver_unit: e.target.value,
                        }));
                      }}
                      disabled={isPrintMode}
                    >
                <option value="">Chọn đơn vị lĩnh vật tư</option>
                <option value="__manual__">Không chọn / Nhập tay</option>

                {headerData.receiver_unit &&
                    !receiverUnitOptions.some(
                    (item) => item.name === headerData.receiver_unit
                    ) && (
                    <option value={headerData.receiver_unit}>
                        {headerData.receiver_unit}
                    </option>
                )}

                {receiverUnitOptions.map((item) => (
                    <option key={item.id || item.name} value={item.name}>
                    {item.name}
                    </option>
                ))}
                </select>
            )}
            </div>
            <div className="form-group">
            <label>
                Đối tượng xuất kho <span>*</span>
            </label>

            {releaseTargetMode === "manual" ? (
                <>
                <input
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  value={headerData.release_target}
                  onChange={(e) =>
                    setHeaderData((prev) => ({
                      ...prev,
                      release_target: e.target.value,
                    }))
                  }
                  placeholder="Nhập đối tượng xuất kho"
                  disabled={isPrintMode}
                />

                <button
                    type="button"
                    className="switch-select-btn"
                    onClick={() => {
                    setReleaseTargetMode("select");
                    setHeaderData((prev) => ({
                        ...prev,
                        release_target: "",
                    }));
                    }}
                >
                    Chọn từ danh sách
                </button>
                </>
            ) : (
                <select
                  data-enter-next="true"
                  onKeyDown={handleEnterMoveNext}
                  value={headerData.release_target}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "__manual__") {
                      setReleaseTargetMode("manual");
                      return;
                    }

                    setHeaderData((prev) => ({
                      ...prev,
                      release_target: value,
                    }));
                  }}
                  disabled={isPrintMode}
                >
                <option value="">Chọn đối tượng xuất kho</option>
                <option value="__manual__">Không chọn / Nhập tay</option>

                {headerData.release_target &&
                    !releaseTargetOptions.some(
                    (item) => item.name === headerData.release_target
                    ) && (
                    <option value={headerData.release_target}>
                        {headerData.release_target}
                    </option>
                )}

                {releaseTargetOptions.map((item) => (
                    <option key={item.id || item.name} value={item.name}>
                    {item.name}
                    </option>
                ))}
                </select>
            )}
            </div>
            <div className="form-group">
            <label>Hợp đồng số</label>
            <input
              data-enter-next="true"
              onKeyDown={handleEnterMoveNext}
              name="contract_number"
              value={headerData.contract_number}
              onChange={handleHeaderChange}
              placeholder="Nhập số hợp đồng"
              disabled={isPrintMode}
            />
            </div>

            <div className="form-group description-group">
              <label>Diễn giải</label>
              <input
                data-enter-next="true"
                onKeyDown={handleEnterMoveNext}
                name="description"
                value={headerData.description}
                onChange={handleHeaderChange}
                placeholder="Nhập nội dung xuất kho"
                disabled={isPrintMode}
              />
            </div>
          </div>
        </div>

        <div className="detail-section-title">Chi tiết</div>

        {!hasWarehouseSelected ? (
          <div className="warehouse-required-placeholder">
            Vui lòng chọn <strong>Xuất kho</strong> ở phía trên để thêm vật tư xuất kho.
          </div>
        ) : (
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
                <col className="col-action" />
              </colgroup>

              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã VT</th>
                  <th>Tên hàng</th>
                  <th>ĐVT</th>
                  <th>Tỷ lệ chuyển đổi</th>
                  <th>SL yêu cầu</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={[
                      "goods-row",
                      activeGoodsRowId === item.id
                        ? "goods-dropdown-active-row"
                        : "",
                      item.is_delete ? "deleted-goods-row" : "",
                    ].join(" ")}
                  >
                    <td>{index + 1}</td>

                    <td className="goods-code-dropdown-cell">
                      <div className="goods-code-dropdown-box">
                        <input
                          data-enter-next="true"
                          data-goods-code-row-id={String(item.id)}
                          onKeyDown={handleEnterMoveNext}
                          value={item.goods_code}
                          placeholder="Chọn mã VT"
                          disabled={isPrintMode}
                          onFocus={() => {
                            openGoodsDropdown(item.id, item.goods_code || "");
                          }}
                          onChange={(e) => {
                            const value = e.target.value;

                            handleChangeItemField(item.id, "goods_code", value);

                            setActiveGoodsRowId(item.id);
                            setShowGoodsDropdown(true);
                            setGoodsKeyword(value);
                          }}
                        />

                        <button
                          type="button"
                          disabled={isPrintMode}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (showGoodsDropdown && activeGoodsRowId === item.id) {
                              setShowGoodsDropdown(false);
                              return;
                            }

                            openGoodsDropdown(item.id, item.goods_code || "");
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
                              <span>Mã VT</span>
                              <span>Tên hàng</span>
                              <span></span>
                            </div>

                            {goodsList.map((goods) => (
                              <div
                                key={goods.goods_id}
                                className="goods-code-dropdown-item"
                                onClick={() => handleSelectGoods(goods)}
                              >
                                <span>{goods.code || goods.goods_code}</span>
                                <span>{goods.name || goods.goods_name}</span>
                                <span></span>
                              </div>
                            ))}

                            {goodsLoading && (
                              <div className="goods-code-dropdown-status">
                                Đang tải...
                              </div>
                            )}

                            {!goodsLoading && goodsList.length === 0 && (
                              <div className="goods-code-dropdown-status">
                                Không có dữ liệu
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <input
                        data-enter-next="true"
                        onKeyDown={handleEnterMoveNext}
                        className="table-text-input"
                        value={item.goods_name || ""}
                        placeholder="Tên hàng"
                        onChange={(e) =>
                          handleChangeItemField(
                            item.id,
                            "goods_name",
                            e.target.value
                          )
                        }
                        disabled={isPrintMode || !item.goods_id}
                      />
                    </td>

                    <td>
                      <select
                        data-enter-next="true"
                        onKeyDown={handleEnterMoveNext}
                        value={item.unit_id || ""}
                        onChange={(e) =>
                          handleChangeItemUnit(item.id, e.target.value)
                        }
                        disabled={isPrintMode || !item.goods_id}
                      >
                        {item.unit_options && item.unit_options.length > 0 ? (
                          item.unit_options.map((unitItem) => (
                            <option
                              key={unitItem.unit_id}
                              value={unitItem.unit_id}
                            >
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
                        value={
                          item.conversion_ratio !== null &&
                          item.conversion_ratio !== undefined &&
                          item.conversion_ratio !== ""
                            ? item.conversion_ratio
                            : "-"
                        }
                        readOnly
                        disabled
                      />
                    </td>

                    <td className="number-col">
                    <input
                      className="table-number-input"
                      value={item.requested_quantity}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (/^[0-9.,+\-*/()\s]*$/.test(value)) {
                          handleChangeItemField(
                            item.id,
                            "requested_quantity",
                            value
                          );
                        }
                      }}
                      onBlur={(e) =>
                        handleRequestedQuantityBlur(
                          item.id,
                          e.target.value
                        )
                      }
                      data-enter-next="true"
                      data-requested-quantity-row-id={String(item.id)}
                      onKeyDown={(e) =>
                        handleRequestedQuantityKeyDown(e, item.id)
                      }
                      disabled={isPrintMode}
                    />
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
                      items.reduce(
                        (sum, item) =>
                          sum +
                          (evaluateQuantityExpression(
                            item.requested_quantity
                          ) ?? 0),
                        0
                      ),
                      2
                    )}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
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
        )}
      </div>

      {duplicateWarningData?.has_warning && (
        <div className="release-duplicate-modal-overlay">
          <div className="release-duplicate-modal">
            <div className="release-duplicate-modal-header">
              <div>
                <h3>Cảnh báo vật tư đã xuất gần đây</h3>

                <p>
                  Đối tượng xuất kho:{" "}
                  <strong>
                    {duplicateWarningData.release_target || "—"}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="release-duplicate-modal-close"
                onClick={closeDuplicateWarning}
                disabled={duplicateActionLoading}
              >
                <RiCloseLine />
              </button>
            </div>

            <div className="release-duplicate-modal-note">
              Các vật tư dưới đây đã được xuất trong{" "}
              <strong>{duplicateWarningData.window_days || 7} ngày gần đây</strong>
              {" "}({duplicateWarningData.window_from} -{" "}
              {duplicateWarningData.window_to})
            </div>

            <div className="release-duplicate-table-wrap">
              <table className="release-duplicate-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã VT</th>
                    <th>Tên vật tư</th>
                    <th>Số lần</th>
                    <th>Phiếu đã xuất gần đây</th>
                  </tr>
                </thead>

                <tbody>
                  {(duplicateWarningData.warnings || []).map(
                    (warning, index) => (
                      <tr key={warning.goods_id || index}>
                        <td>{index + 1}</td>

                        <td>
                          <strong>{warning.goods_code || "—"}</strong>
                        </td>

                        <td>{warning.goods_name || "—"}</td>

                        <td>
                          {warning.occurrences ??
                            warning.tickets?.length ??
                            0}
                        </td>

                        <td>
                          <div className="release-duplicate-ticket-list">
                            {(warning.tickets || []).map((ticket) => (
                              <div
                                className="release-duplicate-ticket"
                                key={ticket.release_id || ticket.code}
                              >
                                <div className="release-duplicate-ticket-main">
                                  <strong>{ticket.code || "—"}</strong>

                                  <span>{ticket.release_date || "—"}</span>

                                  <span>
                                    {ticket.quantity || "—"}{" "}
                                    {ticket.unit_name || ""}
                                  </span>
                                </div>

                                <div className="release-duplicate-ticket-sub">
                                  <span>
                                    Kho: {ticket.warehouse_code || "—"}
                                  </span>

                                  <span>
                                    Đơn vị lĩnh: {ticket.receiver_unit || "—"}
                                  </span>

                                  <span>
                                    {getDuplicateTicketStatusText(ticket.status)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="release-duplicate-modal-footer">
              <button
                type="button"
                className="release-duplicate-cancel-btn"
                onClick={closeDuplicateWarning}
                disabled={duplicateActionLoading}
              >
                Hủy
              </button>

              <button
                type="button"
                className="release-duplicate-complete-btn"
                onClick={handleConfirmDuplicateAction}
                disabled={duplicateActionLoading}
              >
                {duplicateActionLoading
                  ? "Đang xử lý..."
                  : duplicatePendingAction === "save"
                  ? "Lưu tạm"
                  : "Hoàn thành"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="import-order-detail-footer">
        <button
          className="cancel-footer-btn"
          onClick={() => navigate("/dashboard/activity/export/order")}
        >
          {isPrintMode ? "Quay lại" : "Hủy"}
        </button>

        {isPrintMode && id && id !== "new" && (
          <button
            type="button"
            className="complete-btn"
            onClick={() =>
              navigate(
                `/dashboard/activity/export/order/${id}/show-detail-goods-print`
              )
            }
          >
            In
          </button>
        )}

        {!isPrintMode && canSave && (
          <button className="save-draft-btn" onClick={handleSaveDraft}>
            Lưu tạm
          </button>
        )}

        {!isPrintMode && canComplete && (
          <button className="complete-btn" onClick={handleComplete}>
            Hoàn thành
          </button>
        )}
      </div>
    </div>
  );
}

export default ReleaseOrderDetailPage;