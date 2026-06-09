import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<DashboardLayout />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="stock-manager" element={<div>Trang quản lý kho</div>} />
          <Route path="stock-manager/stock-list" element={<StockListPage />} />

          <Route
            path="stock-manager/opening-stock"
            element={<OpeningStockPage />}
          />

          <Route path="stock-manager/goods-list" element={<GoodsListPage />} />

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
            element={<WarehouseImportCompanyChartPage />}
          />

          <Route path="activity/import" element={<ImportLayout />}>
            <Route index element={<Navigate to="order" replace />} />
            <Route path="order" element={<ImportOrderPage />} />
            <Route path="inspection" element={<InspectionPage />} />
          </Route>
        </Route>

        <Route
          path="/dashboard/activity/import/order-detail/new"
          element={<ImportOrderDetailPage />}
        />

        <Route
          path="/dashboard/activity/import/order-detail/:id"
          element={<ImportOrderDetailPage />}
        />

        <Route
          path="/dashboard/activity/import/inspection-detail/new"
          element={<InspectionDetailPage />}
        />

        <Route
          path="/dashboard/activity/import/inspection-detail/:id"
          element={<InspectionDetailPage />}
        />

        <Route
          path="/dashboard/activity/import/order/:id/transfer-request-print"
          element={<TransferRequestPrintPage />}
        />

        <Route
          path="/dashboard/activity/import/order/:id/receipt-print-no-vat"
          element={<ImportReceiptPrintNoVatForm />}
        />

        <Route
          path="/dashboard/activity/import/order/:id/receipt-print-vat"
          element={<ImportReceiptPrintVatForm />}
        />

        <Route path="/account" element={<AccountPage />} />



        <Route
          path="/dashboard/activity/import/inspection/:id/print"
          element={<InspectionPrintPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;