import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from "react-router-dom";
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
import InspectionPage from "./pages/activity/import/InspectionPage";
import InspectionDetailPage from "./pages/activity/import/InspectionDetailPage";
import InspectionPrintPage from "./pages/activity/import/InspectionPrintPage";
import WarehouseImportCompanyReportPage from "./pages/report/WarehouseImportCompanyReportPage";
import WarehouseImportCompanyChartPage from "./pages/report/WarehouseImportCompanyChartPage";
import NoPermissionPage from "./pages/NoPermissionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import RequireRole from "./components/RequireRole";
import { AuthProvider } from "./contexts/AuthContext";
import WarehouseReleasePage from "./pages/activity/release/WarehouseReleasePage";
import WarehouseTransferPage from "./pages/activity/transfer/WarehouseTransferPage";
import WarehouseTransferDetailPage from "./pages/activity/transfer/WarehouseTransferDetailPage";
import ReleasePrintPageA4 from "./pages/activity/release/ReleasePrintPageA4";
import ReleasePrintPageA5 from "./pages/activity/release/ReleasePrintPageA5";
import WarehouseOrderRelease from "./pages/activity/release/WarehouseOrderRelease";
import WarehouseTransferPrintPage from "./pages/activity/transfer/WarehouseTransferPrintPage";
import GoodsUnitPage from "./pages/good_unit/GoodsUnitPage";
import "./styles/auth.css";

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthEventBridge />
        <Routes>
          <Route path="/" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/no-permission" element={<NoPermissionPage />} />

          {/* All authenticated areas live behind ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
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
                path="stock-manager/company-list"
                element={<CompanyListPage />}
              />
              <Route
                path="report/import-company"
                element={<WarehouseImportCompanyReportPage />}
              />
              <Route
                path="report/warehouse-import-company-chart"
                element={
                  <RequireRole roles={["view_report"]}>
                    <WarehouseImportCompanyChartPage />
                  </RequireRole>
                }
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
                <Route
                  path="inspection"
                  element={
                    <RequireRole roles={["view_warehouse_receipt"]}>
                      <InspectionPage />
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
                      <RequireRole roles={["update_actual_released_quantity"]}>
                        <WarehouseReleasePage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="release/edit/:id"
                    element={
                      <RequireRole roles={["update_actual_released_quantity"]}>
                        <WarehouseOrderRelease />
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
                path="/dashboard/activity/export/release-print/:code"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <ReleasePrintPageA4 />
                  </RequireRole>
               }
              />

              <Route
                path="/dashboard/activity/export/release-print-a5/:code"
                element={
                  <RequireRole roles={["view_warehouse_release"]}>
                    <ReleasePrintPageA5 />
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
              path="/dashboard/activity/import/inspection-detail/new"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <InspectionDetailPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/activity/import/inspection-detail/:id"
              element={
                <RequireRole roles={["view_warehouse_receipt"]}>
                  <InspectionDetailPage />
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
