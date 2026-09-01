import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import DashboardHomePage from "./pages/dashboard/DashboardHomePage";
import TheKhoExportPage from "./pages/report/TheKhoExportPage";
import ReleaseOrderPage from "./pages/activity/release/ReleaseOrderPage";
import ReleaseOrderDetailPage from "./pages/activity/release/ReleaseOrderDetailPage";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import ImportLayout from "./layouts/ImportLayout";
import AccountPage from "./pages/account/AccountPage";
import StockListPage from "./pages/stock/StockListPage";
import OpeningStockPage from "./pages/openingstock/OpeningStockPage";
import GoodsListPage from "./pages/goods/GoodsListPage";
import ImportOrderPage from "./pages/activity/import/ImportOrderPage";
import ImportOrderDetailPage from "./pages/activity/import/ImportOrderDetailPage";
import CompanyListPage from "./pages/company/CompanyListPage";
import TransferRequestPrintPage from "./pages/activity/import/TransferRequestPrintPage";
import ImportReceiptPrintNoVatForm from "./pages/activity/import/ImportReceiptPrintNoVatForm";
import ImportReceiptPrintVatForm from "./pages/activity/import/ImportReceiptPrintVatForm";
import InspectionPrintPage from "./pages/activity/import/InspectionPrintPage";
import ReceiptReportPageAcordingCompany from "./pages/report/ReceiptReportPageAcordingCompany";
import ReceiptReportPageAcordingGoods from "./pages/report/ReceiptReportPageAcordingGoods";
import WarehouseReceiptReportPage from "./pages/report/WarehouseReceiptReportPage";
import BeginningInventoryPage from "./pages/report/BeginningInventoryPage";
import NoPermissionPage from "./pages/NoPermissionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import RequireRole from "./components/RequireRole";
import { AuthProvider } from "./contexts/AuthContext";
import WarehouseReleasePage from "./pages/activity/release/WarehouseReleasePage";
import WarehouseTransferPage from "./pages/activity/transfer/WarehouseTransferPage";
import WarehouseTransferDetailPage from "./pages/activity/transfer/WarehouseTransferDetailPage";
import IndustrialA4Print from "./pages/activity/release/IndustrialA4Print";
import IndustrialA5Print from "./pages/activity/release/IndustrialA5Print";
import ApplicationA5Print from "./pages/activity/release/ApplicationA5Print";
import ProcessingA5Print from "./pages/activity/release/ProcessingA5Print";
import WarehouseTransferPrintPage from "./pages/activity/transfer/WarehouseTransferPrintPage";
import GoodsUnitPage from "./pages/good_unit/GoodsUnitPage";
import TransferRequestPage from "./pages/tools/TransferRequestPage";
import MoneyTransferRequestPrintPage from "./pages/tools/MoneyTransferRequestPrintPage";
import ReleaseReportPage from "./pages/report/ReleaseReportPage";
import ReleaseReportViewPage from "./pages/report/ReleaseReportViewPage";
import ShowDetailGoodsPrint from "./pages/activity/release/Show_Detail_Goods_Print";

import "./styles/auth.css";
import "./styles/responsive.css";

// Bridges global auth events from the axios interceptor to router navigation.
function AuthEventBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const onForbidden = () => navigate("/no-permission");
    const onLogout = () => navigate("/", { replace: true });

    window.addEventListener("auth:forbidden", onForbidden);
    window.addEventListener("auth:logout", onLogout);
    return () => {
      window.removeEventListener("auth:forbidden", onForbidden);
      window.removeEventListener("auth:logout", onLogout);
    };
  }, [navigate]);

  return null;
}

function ResponsiveRouteBridge() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.toLowerCase();

    const isPrintPage = pathname.includes("print");

    if (isPrintPage) {
      document.body.classList.remove("app-responsive");
      document.body.classList.add("app-print-page");
    } else {
      document.body.classList.remove("app-print-page");
      document.body.classList.add("app-responsive");
    }

    return () => {
      document.body.classList.remove("app-responsive");
      document.body.classList.remove("app-print-page");
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthEventBridge />
        <ResponsiveRouteBridge />

        <Routes>
          <Route path="/" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/no-permission" element={<NoPermissionPage />} />

          {/* All authenticated areas live behind ProtectedRoute */}
          <Route element={<ProtectedRoute />}>

            {/* Report result tabs: authenticated but intentionally OUTSIDE DashboardLayout */}
            <Route
              path="/warehouse-receipt-report/company"
              element={
                <RequireRole roles={["view_report"]}>
                  <ReceiptReportPageAcordingCompany />
                </RequireRole>
              }
            />

            <Route
              path="/warehouse-receipt-report/goods"
              element={
                <RequireRole roles={["view_report"]}>
                  <ReceiptReportPageAcordingGoods />
                </RequireRole>
              }
            />

            <Route
              path="/warehouse-release-report/view"
              element={
                <RequireRole roles={["view_report"]}>
                  <ReleaseReportViewPage />
                </RequireRole>
              }
            />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHomePage />} />
              <Route path="stock-manager" element={<div>Trang quản lý kho</div>} />
              <Route path="stock-manager/stock-list" element={<StockListPage />} />
              <Route
                path="stock-manager/opening-stock"
                element={<OpeningStockPage />}
              />
              <Route path="stock-manager/goods-list" element={<GoodsListPage />} />
              <Route
                  path="stock-manager/unit-list"
                  element={<GoodsUnitPage />}
              />
              <Route
                path="tools/transfer-request"
                element={
                  <RequireRole roles={["view_money_transfer_request"]}>
                    <TransferRequestPage />
                  </RequireRole>
                }
              />
              <Route
                path="stock-manager/company-list"
                element={<CompanyListPage />}
              />
              <Route
                path="report/receipt"
                element={
                  <RequireRole roles={["view_report"]}>
                    <WarehouseReceiptReportPage />
                  </RequireRole>
                }
              />

              <Route
                path="report/stock-card"
                element={<TheKhoExportPage />}
              />

              <Route
                path="report/release"
                element={
                  <RequireRole roles={["view_report"]}>
                    <ReleaseReportPage />
                  </RequireRole>
                }
              />

              <Route
                path="report/beginning-inventory"
                element={<BeginningInventoryPage />}
              />

              <Route
                path="activity/transfer"
                element={
                  <RequireRole roles={["view_warehouse_transfer"]}>
                    <WarehouseTransferPage />
                  </RequireRole>
                }
              />

              <Route path="activity/import" element={<ImportLayout />}>
                <Route index element={<Navigate to="order" replace />} />
                <Route
                  path="order"
                  element={
                    <RequireRole roles={["view_warehouse_receipt"]}>
                      <ImportOrderPage />
                    </RequireRole>
                  }
                />

              </Route>
                <Route path="activity/export" element={<Outlet />}>
                  <Route index element={<Navigate to="order" replace />} />

                  <Route
                    path="order"
                    element={
                      <RequireRole roles={["view_warehouse_release"]}>
                        <ReleaseOrderPage />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="release"
                    element={
                      <RequireRole roles={["view_actual_release"]}>
                        <WarehouseReleasePage />
                      </RequireRole>
                    }
                  />
                </Route>
              </Route>

            <Route
              path="/dashboard/activity/import/order-detail/new"
              element={
                <RequireRole roles={["create_warehouse_receipt"]}>
                  <ImportOrderDetailPage />
                </RequireRole>
              }
            />

            <Route
              path="/dashboard/activity/import/order-detail/:id"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <ImportOrderDetailPage />
                </RequireRole>
              }
            />
              <Route
                path="/dashboard/activity/export/order-detail/new"
                element={
                  <RequireRole roles={["create_warehouse_release"]}>
                    <ReleaseOrderDetailPage />
                  </RequireRole>
                }
              />
              <Route
                path="/dashboard/tools/money-transfer-requests/:id/print"
                element={
                  <RequireRole roles={["view_money_transfer_request"]}>
                    <MoneyTransferRequestPrintPage />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/export/order/:code/show-detail-goods-print"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <ShowDetailGoodsPrint />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/export/release-print-industrial-a4/:code"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <IndustrialA4Print />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/export/release-print-industrial-a5/:code"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <IndustrialA5Print />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/export/release-print-application-a5/:code"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <ApplicationA5Print />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/export/release-print-processing-a5/:code"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <ProcessingA5Print />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/export/order-detail/:id"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <ReleaseOrderDetailPage />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/transfer/detail/new"
                element={
                  <RequireRole roles={["create_warehouse_transfer"]}>
                    <WarehouseTransferDetailPage />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard/activity/transfer/detail/:code"
                element={
                  <RequireRole roles={["view_warehouse_transfer"]}>
                    <WarehouseTransferDetailPage />
                  </RequireRole>
                }
              />
              <Route
                path="/dashboard/activity/transfer/print/:code"
                element={
                  <RequireRole roles={["view_warehouse_transfer"]}>
                    <WarehouseTransferPrintPage />
                  </RequireRole>
                }
              />
            <Route
              path="/dashboard/activity/import/order/:id/transfer-request-print"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <TransferRequestPrintPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/activity/import/order/:id/receipt-print-no-vat"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <ImportReceiptPrintNoVatForm />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/activity/import/order/:id/receipt-print-vat"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <ImportReceiptPrintVatForm />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/activity/import/inspection/:id/print"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <InspectionPrintPage />
                </RequireRole>
              }
            />

            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;