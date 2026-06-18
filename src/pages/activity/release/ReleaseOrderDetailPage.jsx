import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../styles/ImportOrderDetailPage.css";
import { getGoods } from "../../../services/goodsService";
import { getWarehouses } from "../../../services/warehouseService";
import {
  createReleaseOrder,
  submitReleaseOrder,
  getReleaseOrderByCode,
  updateReleaseOrder,
  getReleaseReferencesPageable,
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

  const isCreateMode = !id || id === "new";
  const isPrintMode = searchParams.get("mode") === "print";

  const canSave = isCreateMode
    ? canDo("create_release_order")
    : canDo("update_release_order");

  const canComplete = canDo("complete_release_order");

  const [releaseId, setReleaseId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
  const fetchReleaseReferences = async () => {
    try {
        const [targetResponse, receiverResponse] = await Promise.all([
        getReleaseReferencesPageable({
            type: "RELEASE_TARGET",
        }),
        getReleaseReferencesPageable({
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

  const [headerData, setHeaderData] = useState({
    terms: getCurrentTerms(),
    release_date: getTodayViDate(),
    warehouse_id: "",
    receiver_unit: "",
    release_target: "",
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

  const handleSelectGoods = (goods) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeGoodsRowId) return item;

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

  const handleAddRow = (rowId) => {
    setItems((prev) => {
      const newRow = createEmptyRow();

      if (!rowId) return [...prev, newRow];

      const index = prev.findIndex((item) => item.id === rowId);
      if (index === -1) return [...prev, newRow];

      return [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)];
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
        description: headerData.description || null,

        items: releasePayloadItems
        .filter((item) => item.goods_id && !item.is_delete)
        .map((item) => ({
            goods_id: item.goods_id,
            goods_unit_id: item.unit_id || null,
            requested_quantity: parseNumber(item.requested_quantity),
        })),
    };
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

    if (validItems.length === 0) {
      alert("Vui lòng chọn ít nhất một vật tư");
      return false;
    }

    return true;
  };

    const handleSaveDraft = async () => {
    try {
        if (!validateBeforeSubmit()) return;

        const payload = buildReleasePayload();

        if (isCreateMode) {
        await createReleaseOrder(payload);
        } else {
        await updateReleaseOrder(releaseId, payload);
        }

        alert("Lưu lệnh xuất kho thành công");
        navigate("/dashboard/activity/export/order");
    } catch (error) {
        console.error("SAVE RELEASE ORDER ERROR:", error.response?.data || error);
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

        const payload = buildReleasePayload();

        let targetId = releaseId;

        if (isCreateMode) {
        const created = await createReleaseOrder(payload);
        targetId = created?.data?.id;
        } else {
        await updateReleaseOrder(releaseId, payload);
        }

        if (targetId) {
        await submitReleaseOrder(targetId);
        }

        alert("Trình duyệt lệnh xuất kho thành công");
        navigate("/dashboard/activity/export/order");
    } catch (error) {
        console.error("SUBMIT RELEASE ORDER ERROR:", error.response?.data || error);
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

        const goodsResponse = await getGoods({
        search: "",
        page: 1,
        page_size: 10000,
        });

        const goodsResults = goodsResponse.data.results;

        const goodsMap = {};
        goodsResults.forEach((goods) => {
        goodsMap[goods.id] = goods;
        });

        setReleaseId(data.id);

        setHeaderData((prev) => ({
        ...prev,
        terms: data.terms || "",
        release_date: formatISOToViDate(data.release_date),
        warehouse_id: data.warehouse_id || "",
        receiver_unit: data.receiver_unit?.name || "",
        release_target: data.release_target?.name || "",
        description: data.description || "",
        }));

        const lines = data.items || [];

        setItems(
        lines.length > 0
            ? lines.map((line, index) => {
                const goods = goodsMap[line.goods_id];

                const unitOptions = Array.isArray(goods?.units)
                ? goods.units.map((unitItem) => ({
                    unit_id: unitItem.unit_id || "",
                    unit_name: unitItem.unit_name || "",
                    conversion_ratio: Number(unitItem.conversion_ratio || 1),
                    is_default: Boolean(unitItem.is_default),
                    }))
                : [];

                const selectedUnit =
                unitOptions.find(
                    (unitItem) =>
                    String(unitItem.unit_id) === String(line.goods_unit_id)
                ) || null;

                const requestedQuantity = parseNumber(line.requested_quantity);
                const actualQuantity = parseNumber(line.actual_quantity);

                return {
                id: line.item_id || index + 1,
                release_inventory_id: line.item_id || "",
                goods_id: line.goods_id || "",
                goods_code: goods?.code || "",
                goods_name: goods?.name || "",
                unit_id: line.goods_unit_id || "",
                unit: selectedUnit?.unit_name || "",
                unit_options: unitOptions,
                conversion_ratio: selectedUnit
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

    useEffect(() => {
        fetchWarehouseList();
        fetchReleaseReferences();
    }, []);

  useEffect(() => {
    if (id && id !== "new") {
      fetchReleaseDetail(id);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGoodsKeyword(goodsKeyword);
    }, 1000);

    return () => clearTimeout(timer);
  }, [goodsKeyword]);

  useEffect(() => {
    if (!showGoodsDropdown) return;

    fetchGoodsDropdown({
      keyword: debouncedGoodsKeyword,
      pageNumber: 1,
      append: false,
    });
  }, [debouncedGoodsKeyword, showGoodsDropdown]);

  if (detailLoading) {
    return <div className="import-order-detail-page">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="import-order-detail-page">
      <div className="import-order-detail-header">
        <div className="detail-header-left">
          <h2>
            {isCreateMode
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

      <div className="import-order-detail-body">
        <div className="info-section-title">Thông tin phiếu xuất kho</div>

        <div className="import-voucher-card">
          <div className="voucher-grid">
            <div className="form-group">
              <label>Kỳ</label>
              <input
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
                value={id && id !== "new" ? id : "Tự động tạo khi hoàn thành"}
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

                <button type="button" disabled={isPrintMode}>
                  <RiCalendarLine />
                  <input
                    type="date"
                    className="calendar-native-input"
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
                <select
                    name="receiver_unit"
                    value={headerData.receiver_unit}
                    onChange={handleHeaderChange}
                    disabled={isPrintMode}
                    >
                    <option value="">Chọn đơn vị lĩnh vật tư</option>

                    {receiverUnitOptions.map((item) => (
                        <option key={item.id} value={item.name}>
                        {item.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
              <label>
                Đối tượng xuất kho <span>*</span>
              </label>
                <select
                    name="release_target"
                    value={headerData.release_target}
                    onChange={handleHeaderChange}
                    disabled={isPrintMode}
                    >
                    <option value="">Chọn đối tượng xuất kho</option>

                    {releaseTargetOptions.map((item) => (
                        <option key={item.id} value={item.name}>
                        {item.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group description-group">
              <label>Diễn giải</label>
              <input
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
                          value={item.goods_code}
                          placeholder="Chọn mã VT"
                          disabled={isPrintMode}
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
                          }}
                        />

                        <button
                          type="button"
                          disabled={isPrintMode}
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
                              <span>Mã VT</span>
                              <span>Tên hàng</span>
                              <span></span>
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

                    <td>{item.goods_name}</td>

                    <td>
                      <select
                        className="table-unit-select"
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
                          handleChangeItemField(
                            item.id,
                            "requested_quantity",
                            e.target.value
                          )
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
                          sum + parseNumber(item.requested_quantity),
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
      </div>

      <div className="import-order-detail-footer">
        <button
          className="cancel-footer-btn"
          onClick={() => navigate("/dashboard/activity/export/order")}
        >
          {isPrintMode ? "Quay lại" : "Hủy"}
        </button>

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