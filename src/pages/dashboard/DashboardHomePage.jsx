import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RiAlertLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiDownload2Line,
  RiRefreshLine,
  RiBuilding2Line,
} from "react-icons/ri";

import "../../styles/DashboardHomePage.css";
import { useAuth } from "../../contexts/AuthContext";

import axiosInstance from "../../services/authService";
import { getWarehouses } from "../../services/warehouseService";

import RecentActivitiesModal from "../../components/RecentActivitiesModal";
import StockWarningModal from "../../components/StockWarningModal";


/* =========================================================
   HELPERS
   ========================================================= */

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
};

const getRoleName = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role;

  return (
    role.name ||
    role.role_name ||
    role.label ||
    role.code ||
    role.role_code ||
    ""
  );
};

const getWarehouseId = (warehouse) => {
  if (!warehouse) return "";

  if (typeof warehouse === "string") {
    return warehouse;
  }

  return warehouse.id || warehouse.warehouse_id || "";
};

const getWarehouseName = (warehouse) => {
  if (!warehouse) return "";
  if (typeof warehouse === "string") return warehouse;

  const code =
    warehouse.code || warehouse.warehouse_code || warehouse.short_code || "";
  const name =
    warehouse.name || warehouse.warehouse_name || warehouse.label || "";

  if (code && name) return `${code} - ${name}`;

  return name || code || String(warehouse.id || warehouse.warehouse_id || "");
};

const unwrapWarehouseList = (response) => {
  const payload = response?.data ?? response ?? [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const readStoredUser = () => {
  if (typeof window === "undefined") return null;

  const candidateKeys = [
    "user",
    "auth_user",
    "current_user",
    "currentUser",
    "profile",
    "user_info",
    "auth",
  ];

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (parsed?.user) return parsed.user;
      if (parsed?.data?.user) return parsed.data.user;
      if (parsed?.data && typeof parsed.data === "object") return parsed.data;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Bỏ qua storage không phải JSON.
    }
  }

  return null;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (value) => {
  const [year, month] = String(value || "").split("-");
  if (!year || !month) return "";
  return `${month}/${year}`;
};

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

// API trả quantity dạng decimal string, ví dụ "10.00000".
const formatDecimalString = (value) => {
  if (value === null || value === undefined || value === "") return "—";

  const text = String(value).trim();
  if (!text) return "—";
  if (!text.includes(".")) return text;

  const [integerPart, decimalPart = ""] = text.split(".");
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
};

const formatQuantityWithUnit = (value, unitName) => {
  const quantity = formatDecimalString(value);
  if (quantity === "—") return quantity;
  return unitName ? `${quantity} ${unitName}` : quantity;
};

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    fallback
  );
};

const emptyTicketCounters = {
  period_month: "",
  managed_warehouse_count: 0,
  is_unrestricted: null,
  receipt: {
    today: 0,
    month_total: 0,
    by_status: {},
  },
  release: {
    today: 0,
    month_total: 0,
    by_status: {},
  },
  transfer: {
    today: 0,
    month_total: 0,
    by_status: {},
  },
  from_cache: false,
};

const emptyStockStatus = {
  total_goods: 0,
  buckets: [],
  config_coverage: {
    goods_with_config: 0,
    total_goods: 0,
    has_any_config: false,
  },
  from_cache: false,
};

const STOCK_STATUS_COLORS = {
  OK: "#2563eb",
  BELOW_MIN: "#f59e0b",
  OUT_OF_STOCK: "#ef4444",
  ABOVE_MAX: "#38bdf8",
  NEGATIVE: "#8b5cf6",
};

const STOCK_STATUS_CLASSES = {
  OK: "available",
  BELOW_MIN: "warning",
  OUT_OF_STOCK: "empty",
  ABOVE_MAX: "above-max",
  NEGATIVE: "overload",
};

function DashboardHomePage() {
  const auth = useAuth() || {};
  const storedUser = useMemo(() => readStoredUser(), []);

  const user =
    auth.user ||
    auth.currentUser ||
    auth.profile ||
    auth.account ||
    storedUser ||
    {};

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const monthInputRef = useRef(null);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [filterWarehouses, setFilterWarehouses] = useState([]);
  const [warehouseFilterLoading, setWarehouseFilterLoading] = useState(false);

  const selectedWarehouseIds = useMemo(
    () => (selectedWarehouseId ? [selectedWarehouseId] : []),
    [selectedWarehouseId]
  );
  const [ticketCounters, setTicketCounters] = useState(emptyTicketCounters);
  const [stockStatusData, setStockStatusData] = useState(emptyStockStatus);
  const [warningGoods, setWarningGoods] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  const [showRecentActivitiesModal, setShowRecentActivitiesModal] =
  useState(false);

  const [showStockWarningModal, setShowStockWarningModal] =
    useState(false);

  const [ticketLoading, setTicketLoading] = useState(false);
  const [stockStatusLoading, setStockStatusLoading] = useState(false);
  const [warningLoading, setWarningLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [stockStatusError, setStockStatusError] = useState("");
  const [warningError, setWarningError] = useState("");
  const [activityError, setActivityError] = useState("");

  /* =========================
     ROLE
     ========================= */

  const roles = useMemo(() => {
    const sources = [
      auth.roles,
      user.roles,
      user.role,
      user.position,
      user.position_name,
      user.position?.name,
    ];

    const result = [];

    sources.forEach((source) => {
      asArray(source).forEach((role) => {
        const name = String(getRoleName(role) || "").trim();

        if (
          name &&
          !result.some((item) => normalizeText(item) === normalizeText(name))
        ) {
          result.push(name);
        }
      });
    });

    return result;
  }, [auth.roles, user]);

  const positionName =
    user?.position?.name ||
    auth?.position?.name ||
    user?.position_name ||
    auth?.position_name ||
    "";

  const roleText =
    String(positionName || "").trim() ||
    (roles.length > 0 ? roles.join(", ") : "Người dùng");

  // Giữ đúng layout riêng hiện tại: chỉ position.name = "Thủ kho_vận dụng".
  const isWarehouseKeeperOperation =
    normalizeText(positionName) === "thu kho van dung";

  /* =========================
     WAREHOUSE LOGIN DATA
     ========================= */

  const warehouses = useMemo(() => {
    const list =
      user.warehouses ||
      user.assigned_warehouses ||
      user.assignedWarehouses ||
      user.warehouse_permissions ||
      auth.warehouses ||
      auth.assignedWarehouses ||
      [];

    const result = Array.isArray(list) ? [...list] : [];
    const singleWarehouse = user.warehouse || auth.warehouse || null;

    if (singleWarehouse && result.length === 0) {
      result.push(singleWarehouse);
    }

    if (result.length === 0 && (user.warehouse_id || auth.warehouse_id)) {
      result.push({
        id: user.warehouse_id || auth.warehouse_id,
        warehouse_id: user.warehouse_id || auth.warehouse_id,
        code: user.warehouse_code || auth.warehouse_code || "",
        name: user.warehouse_name || auth.warehouse_name || "",
      });
    }

    return result;
  }, [auth, user]);

  useEffect(() => {
  const fetchFilterWarehouses = async () => {
    try {
      setWarehouseFilterLoading(true);

      const response = await getWarehouses({
        search: "",
        page: 1,
        page_size: 100,
      });

      const results = unwrapWarehouseList(response);

      setFilterWarehouses(results);
    } catch (error) {
      console.error(
        "LOAD DASHBOARD WAREHOUSES ERROR:",
        error?.response?.data || error
      );

      setFilterWarehouses([]);
    } finally {
      setWarehouseFilterLoading(false);
    }
  };

  fetchFilterWarehouses();
}, []);

const warehouseOptions = useMemo(() => {
  return filterWarehouses
    .map((warehouse) => ({
      id: getWarehouseId(warehouse),
      name: getWarehouseName(warehouse),
    }))
    .filter((warehouse) => warehouse.id);
}, [filterWarehouses]);

  const warehouseText = useMemo(() => {
    if (warehouses.length === 0) {
      return (
        user.warehouse_name ||
        auth.warehouse_name ||
        user.warehouse_id ||
        auth.warehouse_id ||
        "Chưa xác định"
      );
    }

    if (isWarehouseKeeperOperation) {
      return getWarehouseName(warehouses[0]) || "Kho được phân quyền";
    }

    if (warehouses.length === 1) {
      return getWarehouseName(warehouses[0]);
    }

    const firstTwo = warehouses.slice(0, 2).map(getWarehouseName).filter(Boolean);

    if (warehouses.length > 2) {
      return `${firstTwo.join(", ")} +${warehouses.length - 2} kho`;
    }

    return firstTwo.join(", ");
  }, [
    auth.warehouse_id,
    auth.warehouse_name,
    isWarehouseKeeperOperation,
    user.warehouse_id,
    user.warehouse_name,
    warehouses,
  ]);

  /* =========================================================
     DASHBOARD CHUNG - các role khác, bao gồm Thủ kho thường
     ========================================================= */

  const fetchDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      let unrestricted = null;

      try {
        setTicketLoading(true);
        setTicketError("");

        const ticketResponse = await axiosInstance.post(
          "/inventory/dashboard/ticket-counters",
          {
            warehouse_ids: selectedWarehouseIds,
            period_month: selectedMonth,
            refresh,
          }
        );

        const ticketPayload =
          ticketResponse?.data?.data ?? ticketResponse?.data ?? emptyTicketCounters;

        unrestricted = Boolean(ticketPayload?.is_unrestricted);

        setTicketCounters({
          ...emptyTicketCounters,
          ...ticketPayload,
          receipt: {
            ...emptyTicketCounters.receipt,
            ...(ticketPayload?.receipt || {}),
            by_status: ticketPayload?.receipt?.by_status || {},
          },
          release: {
            ...emptyTicketCounters.release,
            ...(ticketPayload?.release || {}),
            by_status: ticketPayload?.release?.by_status || {},
          },
          transfer: {
            ...emptyTicketCounters.transfer,
            ...(ticketPayload?.transfer || {}),
            by_status: ticketPayload?.transfer?.by_status || {},
          },
        });
        // Thủ kho_vận dụng chỉ cần số liệu phiếu xuất từ ticket-counters.
        // Không gọi recent-activities / stock-warnings / stock-status.
        if (isWarehouseKeeperOperation) {
          return;
        }
      } catch (error) {
        console.error("DASHBOARD TICKET COUNTERS ERROR:", error?.response?.data || error);
        setTicketCounters(emptyTicketCounters);
        setTicketError(
          getApiErrorMessage(error, "Không tải được số liệu phiếu trên dashboard.")
        );
      } finally {
        setTicketLoading(false);
      }

      try {
        setActivityLoading(true);
        setActivityError("");

        const activityResponse = await axiosInstance.post(
          "/inventory/dashboard/recent-activities",
          {
            warehouse_ids: selectedWarehouseIds,
            period_month: null,
            activity_types: ["receipt", "release", "transfer"],
            page: 1,
            page_size: 5,
            refresh,
          }
        );

        const activityPayload =
          activityResponse?.data?.data ?? activityResponse?.data ?? {};

        setRecentActivities(
          Array.isArray(activityPayload?.results) ? activityPayload.results : []
        );
      } catch (error) {
        console.error("DASHBOARD RECENT ACTIVITIES ERROR:", error?.response?.data || error);
        setRecentActivities([]);
        setActivityError(
          getApiErrorMessage(error, "Không tải được hoạt động kho gần đây.")
        );
      } finally {
        setActivityLoading(false);
      }

      // Nếu ticket-counters lỗi thì chưa xác định được phạm vi tài khoản.
      // Không đoán ORGANIZATION để tránh gọi sai quyền và dính 403.
      if (unrestricted === null) {
        setStockStatusData(emptyStockStatus);
        setWarningGoods([]);
        setStockStatusError("");
        setWarningError("");
        return;
      }

      try {
        setWarningLoading(true);
        setWarningError("");

        const warningResponse = await axiosInstance.post(
          "/inventory/dashboard/stock-warnings",
          {
            scope_type: unrestricted ? "ORGANIZATION" : "WAREHOUSE",
            statuses: ["BELOW_MIN"],
            warehouse_ids: selectedWarehouseIds,
            goods_group_ids: [],
            page: 1,
            page_size: 5,
            refresh,
          }
        );

        const warningPayload =
          warningResponse?.data?.data ?? warningResponse?.data ?? {};

        setWarningGoods(
          Array.isArray(warningPayload?.results) ? warningPayload.results : []
        );
      } catch (error) {
        console.error("DASHBOARD STOCK WARNINGS ERROR:", error?.response?.data || error);
        setWarningGoods([]);
        setWarningError(
          getApiErrorMessage(error, "Không tải được cảnh báo tồn kho thấp.")
        );
      } finally {
        setWarningLoading(false);
      }

      if (!unrestricted) {
        // BE cấm stock-status với tài khoản bị giới hạn kho.
        setStockStatusData(emptyStockStatus);
        setStockStatusError("");
        return;
      }

      try {
        setStockStatusLoading(true);
        setStockStatusError("");

        const stockStatusResponse = await axiosInstance.post(
          "/inventory/dashboard/stock-status",
          { refresh }
        );

        const stockPayload =
          stockStatusResponse?.data?.data ?? stockStatusResponse?.data ?? {};

        setStockStatusData({
          ...emptyStockStatus,
          ...stockPayload,
          buckets: Array.isArray(stockPayload?.buckets) ? stockPayload.buckets : [],
          config_coverage: {
            ...emptyStockStatus.config_coverage,
            ...(stockPayload?.config_coverage || {}),
          },
        });
      } catch (error) {
        console.error("DASHBOARD STOCK STATUS ERROR:", error?.response?.data || error);
        setStockStatusData(emptyStockStatus);
        setStockStatusError(
          getApiErrorMessage(error, "Không tải được tình trạng kho.")
        );
      } finally {
        setStockStatusLoading(false);
      }
    },
    [      
      isWarehouseKeeperOperation,
      selectedMonth,
      selectedWarehouseIds,]
  );

  const handleLoadDashboard = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);

      await fetchDashboard({ refresh: false });

      setDashboardLoaded(true);
    } catch {
      // Lỗi cụ thể đã được set ở từng flow.
      setDashboardLoaded(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshPendingTickets = async () => {
  if (ticketLoading) return;

  try {
    setTicketLoading(true);
    setTicketError("");

    const response = await axiosInstance.post(
      "/inventory/dashboard/ticket-counters",
        {
          warehouse_ids: selectedWarehouseIds,
          period_month: selectedMonth,
          refresh: true,
        }
    );

    const payload =
      response?.data?.data ??
      response?.data ??
      emptyTicketCounters;

    setTicketCounters({
      ...emptyTicketCounters,
      ...payload,

      receipt: {
        ...emptyTicketCounters.receipt,
        ...(payload?.receipt || {}),
        by_status: payload?.receipt?.by_status || {},
      },

      release: {
        ...emptyTicketCounters.release,
        ...(payload?.release || {}),
        by_status: payload?.release?.by_status || {},
      },

      transfer: {
        ...emptyTicketCounters.transfer,
        ...(payload?.transfer || {}),
        by_status: payload?.transfer?.by_status || {},
      },
    });
  } catch (error) {
    console.error(
      "REFRESH TICKET COUNTERS ERROR:",
      error?.response?.data || error
    );

    setTicketError(
      getApiErrorMessage(
        error,
        "Không làm mới được số liệu phiếu."
      )
    );
  } finally {
    setTicketLoading(false);
  }
};

const handleRefreshStockStatus = async () => {
  if (stockStatusLoading || !isUnrestricted) return;

  try {
    setStockStatusLoading(true);
    setStockStatusError("");

    const response = await axiosInstance.post(
      "/inventory/dashboard/stock-status",
      {
        refresh: true,
      }
    );

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    setStockStatusData({
      ...emptyStockStatus,
      ...payload,

      buckets: Array.isArray(payload?.buckets)
        ? payload.buckets
        : [],

      config_coverage: {
        ...emptyStockStatus.config_coverage,
        ...(payload?.config_coverage || {}),
      },
    });
  } catch (error) {
    console.error(
      "REFRESH STOCK STATUS ERROR:",
      error?.response?.data || error
    );

    setStockStatusError(
      getApiErrorMessage(
        error,
        "Không làm mới được tình trạng kho."
      )
    );
  } finally {
    setStockStatusLoading(false);
  }
};

  /* =========================
     DERIVED DATA
     ========================= */

  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;
  const isUnrestricted = ticketCounters.is_unrestricted === true;

  const receiptWaitingDelivery = Number(
    ticketCounters.receipt?.by_status?.WAITING_DELIVERY || 0
  );
  const receiptReceived = Number(ticketCounters.receipt?.by_status?.RECEIVED || 0);
  const receiptPending = receiptWaitingDelivery + receiptReceived;

  const releasePendingDraft = Number(ticketCounters.release?.by_status?.PENDING || 0);
  const releaseWaitingApproval = Number(
    ticketCounters.release?.by_status?.WAIT_TO_APPROVE || 0
  );
  const releasePending = releasePendingDraft + releaseWaitingApproval;

  const receiptMainCount = isCurrentMonth
    ? Number(ticketCounters.receipt?.today || 0)
    : Number(ticketCounters.receipt?.month_total || 0);

  const releaseMainCount = isCurrentMonth
    ? Number(ticketCounters.release?.today || 0)
    : Number(ticketCounters.release?.month_total || 0);

  const stockStatus = useMemo(() => {
    return (stockStatusData.buckets || []).map((bucket) => {
      const status = String(bucket?.status || "").toUpperCase();

      return {
        status,
        key: STOCK_STATUS_CLASSES[status] || status.toLowerCase(),
        label: bucket?.label || status || "Không xác định",
        count: Number(bucket?.goods_count || 0),
        percent: Number(bucket?.percent || 0),
        color: STOCK_STATUS_COLORS[status] || "#94a3b8",
      };
    });
  }, [stockStatusData.buckets]);

  const donutBackground = useMemo(() => {
    const totalGoods = Number(stockStatusData.total_goods || 0);

    if (totalGoods <= 0 || stockStatus.length === 0) {
      return "#e5e7eb";
    }

    let current = 0;
    const parts = stockStatus.map((item, index) => {
      const start = current;
      const exactPercent = (item.count / totalGoods) * 100;
      current += exactPercent;

      const end = index === stockStatus.length - 1 ? 100 : current;
      return `${item.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${parts.join(", ")})`;
  }, [stockStatus, stockStatusData.total_goods]);

  const handleOpenMonthPicker = () => {
    const input = monthInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="dashboard-home-page">
      {/* ================= HEADER ================= */}
      <div className="dashboard-home-heading">
        <div>
          <div className="dashboard-home-breadcrumb">
            <span>⌂</span>
            <span>/</span>
            <span>Dashboard</span>
          </div>

          <h1>Tổng quan kho</h1>
        </div>

        <div className="dashboard-month-filter">
          <div className="dashboard-month-helper">
              Chọn kho và tháng để xem số liệu
          </div>

          <div className="dashboard-month-filter-actions">
            {!dashboardLoaded && (
              <button
                type="button"
                className="dashboard-load-data-btn"
                onClick={handleLoadDashboard}
                disabled={refreshing}
                title="Bấm để tải số liệu dashboard"
              >
                <RiRefreshLine className={refreshing ? "is-spinning" : ""} />

                <span>
                  {refreshing
                    ? "Đang tải..."
                    : isWarehouseKeeperOperation
                    ? "Báo cáo các lệnh xuất kho chờ xử lý"
                    : "Hoạt động & cảnh báo kho"}
                </span>
              </button>
            )}

              {/* FILTER THEO KHO */}
            <div className="dashboard-month-control dashboard-warehouse-control">
              <RiBuilding2Line />
              <span>
                <small>Lọc theo kho</small>

                <select
                  value={selectedWarehouseId}
                  onChange={(event) => {
                    setSelectedWarehouseId(event.target.value);
                    setDashboardLoaded(false);
                  }}
                  aria-label="Chọn kho để lọc dashboard"
                >
                  <option value="">Tất cả kho</option>

                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </span>
            </div>

            <div
              className="dashboard-month-control"
              role="button"
              tabIndex={0}
              onClick={handleOpenMonthPicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenMonthPicker();
                }
              }}
            >
              <RiCalendarLine />

              <span>
                <small>Lọc theo tháng</small>
                <strong>{formatMonth(selectedMonth)}</strong>
              </span>

              <span className="dashboard-month-arrow">⌄</span>

              <input
                ref={monthInputRef}
                className="dashboard-native-month-input"
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setDashboardLoaded(false);
                }}
                tabIndex={-1}
                aria-label="Chọn tháng để lọc dashboard"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= ROLE + WAREHOUSE ================= */}
      <div className="dashboard-context-grid">
        <div className="dashboard-context-card">
          <div className="dashboard-context-icon">👤</div>
          <span>Vai trò:</span>
          <strong>{roleText}</strong>
        </div>

        <div className="dashboard-context-card">
          <div className="dashboard-context-icon">🏢</div>
          <span>Kho đang phụ trách:</span>
          <strong>{warehouseText}</strong>
        </div>
      </div>

      {dashboardLoaded && ticketError ? (
        <div className="dashboard-warning-state dashboard-warning-state--error">
          {ticketError}
        </div>
      ) : null}

      {/* =====================================================
          DASHBOARD RIÊNG CHO THỦ KHO_VẬN DỤNG
         ===================================================== */}
        {isWarehouseKeeperOperation ? (
          <>
            {/* ================= 3 KPI CỦA THỦ KHO ================= */}
            <div className="dashboard-kpi-grid keeper-grid">
              <div className="dashboard-kpi-card">
                <div className="dashboard-kpi-icon blue">🏢</div>

                <div>
                  <span>Tổng số kho đang phụ trách</span>

                  <strong className="blue-text">
                    {!dashboardLoaded || ticketLoading
                      ? "—"
                      : formatNumber(ticketCounters.managed_warehouse_count)}
                  </strong>
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div className="dashboard-kpi-icon amber">▣</div>

                <div>
                  <span>
                    Phiếu xuất kho cần hoàn thành
                    <small> ({formatMonth(selectedMonth)})</small>
                  </span>

                  <strong className="amber-text">
                    {!dashboardLoaded || ticketLoading
                      ? "—"
                      : formatNumber(releasePending)}
                  </strong>
                </div>
              </div>

              <div className="dashboard-kpi-card">
                <div className="dashboard-kpi-icon green">
                  <RiCheckboxCircleLine />
                </div>

                <div>
                  <span>
                    {isCurrentMonth
                      ? "Phiếu xuất hôm nay"
                      : "Phiếu xuất trong tháng"}
                  </span>

                  <strong className="green-text">
                    {!dashboardLoaded || ticketLoading
                      ? "—"
                      : formatNumber(releaseMainCount)}
                  </strong>
                </div>
              </div>
            </div>

          </>
        ) : (
  /* =====================================================
     DASHBOARD CHO CÁC ROLE CÒN LẠI
     ===================================================== */
        <>
          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon blue">🏢</div>
              <div>
                <span>Tổng số kho đang phụ trách</span>
                <strong className="blue-text">
                  {!dashboardLoaded || ticketLoading
                    ? "—"
                    : formatNumber(ticketCounters.managed_warehouse_count)}
                </strong>
              </div>
            </div>

            {(!dashboardLoaded || isUnrestricted) ? (
              <div className="dashboard-kpi-card">
                <div className="dashboard-kpi-icon amber">🏷</div>
                <div>
                  <span>Tổng số mặt hàng</span>
                  <strong className="amber-text">
                    {!dashboardLoaded || stockStatusLoading
                      ? "—"
                      : formatNumber(stockStatusData.total_goods)}
                  </strong>
                </div>
              </div>
            ) : null}

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon green">
                <RiDownload2Line />
              </div>
              <div>
                <span>
                  {isCurrentMonth ? "Phiếu nhập hôm nay" : "Phiếu nhập trong tháng"}
                </span>
                <strong className="green-text">
                  {!dashboardLoaded || ticketLoading ? "—" : formatNumber(receiptMainCount)}
                </strong>
                <small className="dashboard-kpi-sub">
                  Chưa hoàn thành {formatMonth(selectedMonth)}:{" "}
                  {!dashboardLoaded ? "—" : formatNumber(receiptPending)}
                </small>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon orange">⇧</div>
              <div>
                <span>
                  {isCurrentMonth ? "Phiếu xuất hôm nay" : "Phiếu xuất trong tháng"}
                </span>
                <strong className="orange-text">
                  {!dashboardLoaded || ticketLoading ? "—" : formatNumber(releaseMainCount)}
                </strong>
                <small className="dashboard-kpi-sub">
                  Chưa hoàn thành {formatMonth(selectedMonth)}:{" "}
                  {!dashboardLoaded ? "—" : formatNumber(releasePending)}
                </small>
              </div>
            </div>
          </div>

          <div className="dashboard-mid-grid">
            <RecentActivitiesPanel
              rows={recentActivities}
              loading={activityLoading}
              error={activityError}
              loaded={dashboardLoaded}
              onViewAll={() => setShowRecentActivitiesModal(true)}
            />

            <WarningGoodsPanel
              rows={warningGoods}
              title="Cảnh báo tồn kho thấp"
              loading={warningLoading}
              error={warningError}
              showWarehouse={!isUnrestricted}
              loaded={dashboardLoaded}
              onViewAll={() => setShowStockWarningModal(true)}
            />
          </div>

          <div className="dashboard-bottom-grid">
            {(!dashboardLoaded || isUnrestricted) ? (
                <StockStatusPanel
                  data={stockStatusData}
                  rows={stockStatus}
                  donutBackground={donutBackground}
                  loading={stockStatusLoading}
                  error={stockStatusError}
                  loaded={dashboardLoaded}
                  onRefresh={handleRefreshStockStatus}
                />
            ) : null}

            <section className="dashboard-panel dashboard-month-pending-panel">
              <div className="dashboard-panel-header">
                <div className="dashboard-panel-title">
                  <span className="dashboard-title-bar" />
                  <h2>
                    Theo dõi phiếu chưa hoàn thành theo tháng{" "}
                    {formatMonth(selectedMonth)}
                  </h2>
                </div>

                <button
                  type="button"
                  className="dashboard-link-btn"
                  onClick={handleRefreshPendingTickets}
                  disabled={ticketLoading}
                  title="Làm mới số liệu phiếu"
                >
                  <RiRefreshLine
                    className={ticketLoading ? "is-spinning" : ""}
                  />
                  Làm mới
                </button>
              </div>

              <div className="dashboard-pending-grid">
                <div className="dashboard-pending-card receipt">
                  <div className="dashboard-pending-main">
                    <div className="dashboard-pending-icon">↓</div>

                    <div>
                      <span>Số phiếu nhập chưa hoàn thành trong tháng</span>
                      <strong>{!dashboardLoaded || ticketLoading ? "—" : formatNumber(receiptPending)}</strong>
                    </div>
                  </div>

                  <div className="dashboard-pending-breakdown">
                    <div>
                      <span>Chờ nhận hàng</span>
                      <strong>
                        {!dashboardLoaded || ticketLoading ? "—" : formatNumber(receiptWaitingDelivery)}
                      </strong>
                    </div>

                    <div>
                      <span>Đã nhận hàng</span>
                      <strong>
                        {!dashboardLoaded || ticketLoading ? "—" : formatNumber(receiptReceived)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="dashboard-pending-card release">
                  <div className="dashboard-pending-main">
                    <div className="dashboard-pending-icon">↑</div>

                    <div>
                      <span>Số phiếu xuất chưa hoàn thành trong tháng</span>
                      <strong>{!dashboardLoaded || ticketLoading ? "—" : formatNumber(releasePending)}</strong>
                    </div>
                  </div>

                  <div className="dashboard-pending-breakdown">
                    <div>
                      <span>Nháp</span>
                      <strong>
                        {!dashboardLoaded || ticketLoading ? "—" : formatNumber(releasePendingDraft)}
                      </strong>
                    </div>

                    <div>
                      <span>Chờ duyệt</span>
                      <strong>
                        {!dashboardLoaded || ticketLoading ? "—" : formatNumber(releaseWaitingApproval)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {showRecentActivitiesModal && (
        <RecentActivitiesModal
          onClose={() => setShowRecentActivitiesModal(false)}
        />
      )}

      {showStockWarningModal && (
        <StockWarningModal
          scopeType={isUnrestricted ? "ORGANIZATION" : "WAREHOUSE"}
          onClose={() => setShowStockWarningModal(false)}
        />
      )}

      <div className="dashboard-footer">
        <strong>Tháng đang xem: {formatMonth(selectedMonth)}</strong>
      </div>
    </div>
  );
}

    function RecentActivitiesPanel({
      rows,
      loading,
      error,
      loaded,
      onViewAll,
    }) {
    const getActivityPresentation = (activity) => {
    const type = activity?.activity_type;

    if (type === "receipt") {
      const warehouse =
        activity?.destination_warehouse_name ||
        activity?.destination_warehouse_code ||
        "—";

      return {
        type: "receipt",
        icon: "↓",
        title: `Nhập kho ${activity?.ticket_code || "—"}`,
        sub: `${warehouse}${
          activity?.goods_lines !== null && activity?.goods_lines !== undefined
            ? ` · ${formatNumber(activity.goods_lines)} mặt hàng`
            : ""
        }`,
      };
    }

    if (type === "release") {
      const warehouse =
        activity?.source_warehouse_name || activity?.source_warehouse_code || "—";

      return {
        type: "release",
        icon: "↑",
        title: `Xuất kho ${activity?.ticket_code || "—"}`,
        sub: `${warehouse}${
          activity?.goods_lines !== null && activity?.goods_lines !== undefined
            ? ` · ${formatNumber(activity.goods_lines)} mặt hàng`
            : ""
        }`,
      };
    }

    return {
      type: "transfer",
      icon: "↔",
      title: `Điều chuyển ${activity?.ticket_code || "—"}`,
      sub: `Từ ${activity?.source_warehouse_code || "—"} sang ${
        activity?.destination_warehouse_code || "—"
      }${
        activity?.goods_lines !== null && activity?.goods_lines !== undefined
          ? ` · ${formatNumber(activity.goods_lines)} mặt hàng`
          : ""
      }`,
    };
  };

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div className="dashboard-panel-title">
          <span className="dashboard-clock-icon">◷</span>
          <h2>Hoạt động kho gần đây</h2>
        </div>

        <button
          type="button"
          className="dashboard-link-btn"
          onClick={onViewAll}
          disabled={!loaded}
        >
          Xem tất cả
        </button>
      </div>

      {!loaded ? (
        <div className="dashboard-warning-state dashboard-placeholder-state">—</div>
      ) : loading ? (
        <div className="dashboard-warning-state">Đang tải hoạt động kho...</div>
      ) : error ? (
        <div className="dashboard-warning-state dashboard-warning-state--error">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="dashboard-warning-state">Chưa có hoạt động kho gần đây.</div>
      ) : (
        <div className="dashboard-activity-list">
          {rows.map((activity) => {
            const view = getActivityPresentation(activity);

            return (
              <div
                className="dashboard-activity-row"
                key={`${activity.activity_type}-${activity.ticket_id}`}
              >
                <div className={`dashboard-activity-icon ${view.type}`}>
                  {view.icon}
                </div>

                <div className="dashboard-activity-text">
                  <strong>{view.title}</strong>
                  <span>{view.sub}</span>
                </div>

                <time>{formatDateTime(activity.created_at)}</time>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

  function StockStatusPanel({
    data,
    rows,
    donutBackground,
    loading,
    error,
    loaded,
    onRefresh,
  }) {
    if (!loaded) {
      return (
        <section className="dashboard-panel stock-status-panel">
          <div className="dashboard-panel-title">
            <span className="dashboard-title-bar" />
            <h2>Tình trạng kho</h2>
          </div>

          <div className="dashboard-warning-state dashboard-placeholder-state">
            —
          </div>
        </section>
      );
    }

  if (loading) {
    return (
      <section className="dashboard-panel stock-status-panel">
        <div className="dashboard-warning-state">Đang tải tình trạng kho...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-panel stock-status-panel">
        <div className="dashboard-warning-state dashboard-warning-state--error">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel stock-status-panel">
      <div className="dashboard-panel-header">
        <div className="dashboard-panel-title">
          <span className="dashboard-title-bar" />
          <h2>Tình trạng kho</h2>
        </div>

        <button
          type="button"
          className="dashboard-link-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Làm mới tình trạng kho"
        >
          <RiRefreshLine className={loading ? "is-spinning" : ""} />
          Làm mới
        </button>
      </div>

      {data?.config_coverage?.has_any_config === false ? (
        <div className="dashboard-warning-state">
          Chưa đặt định mức cho mã vật tư nào — hai nhóm “Dưới định mức” và
          “Vượt mức” sẽ luôn bằng 0.
        </div>
      ) : null}

      <div className="dashboard-stock-status-body">
        <div className="dashboard-donut" style={{ background: donutBackground }}>
          <div className="dashboard-donut-center">
            <strong>{formatNumber(data.total_goods)}</strong>
            <span>mặt hàng</span>
          </div>
        </div>

        <div className="dashboard-stock-legends">
          {rows.map((item) => (
            <div
              className={`dashboard-stock-legend ${item.key}`}
              key={item.status}
            >
              <div className="dashboard-stock-legend-top">
                <span>
                  <i style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <strong>
                  {item.percent}%{" "}
                  <small>({formatNumber(item.count)} mặt hàng)</small>
                </strong>
              </div>

              <div className="dashboard-progress">
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, item.percent))}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <small className="dashboard-kpi-sub">Gồm cả mã chưa từng nhập.</small>
    </section>
  );
}

    function WarningGoodsPanel({
      rows,
      title,
      loading,
      error,
      showWarehouse,
      loaded,
      onViewAll,
    }) {
    return (
    <section className="dashboard-panel dashboard-warning-panel">
      <div className="dashboard-panel-header">
        <div className="dashboard-panel-title">
          <RiAlertLine className="dashboard-warning-title-icon" />
          <h2>{title}</h2>
        </div>

        <button
          type="button"
          className="dashboard-link-btn"
          onClick={onViewAll}
          disabled={!loaded}
        >
          Xem tất cả
        </button>
      </div>

      <div className="dashboard-table-wrap">
        {!loaded ? (
          <div className="dashboard-warning-state dashboard-placeholder-state">—</div>
        ) : loading ? (
          <div className="dashboard-warning-state">
            Đang tải cảnh báo tồn kho...
          </div>
        ) : error ? (
          <div className="dashboard-warning-state dashboard-warning-state--error">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="dashboard-warning-state">
            Không có hàng hóa dưới định mức.
          </div>
        ) : (
          <table className="dashboard-warning-table">
            <thead>
              <tr>
                <th>Mã vật tư</th>
                <th>Tên vật tư</th>
                {showWarehouse ? <th>Kho</th> : null}
                <th>Tồn hiện tại</th>
                <th>Ngưỡng cảnh báo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.goods_id}-${row.warehouse_id || "org"}-${row.status}`}
                >
                  <td>{row.goods_code || "—"}</td>
                  <td>{row.goods_name || "—"}</td>
                  {showWarehouse ? (
                    <td>
                      {row.warehouse_code && row.warehouse_name
                        ? `${row.warehouse_code} - ${row.warehouse_name}`
                        : row.warehouse_name || row.warehouse_code || "—"}
                    </td>
                  ) : null}
                  <td className="dashboard-warning-quantity">
                    {formatQuantityWithUnit(row.quantity, row.unit_name)}
                  </td>
                  <td>
                    {formatQuantityWithUnit(row.min_quantity, row.unit_name)}
                  </td>
                  <td>
                    <span
                      className={`dashboard-warning-badge dashboard-warning-badge--${String(
                        row.status || "warning"
                      ).toLowerCase()}`}
                    >
                      <RiAlertLine />
                      {row.status_label || "Cảnh báo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default DashboardHomePage;