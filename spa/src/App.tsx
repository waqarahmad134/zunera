import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import RequireRole from "@/lib/RequireRole";

import LoginPage from "@/pages/LoginPage";

import DashboardPage from "@/pages/admin/DashboardPage";
import CustomersPage from "@/pages/admin/CustomersPage";
import CustomerNewPage from "@/pages/admin/CustomerNewPage";
import CustomerDetailPage from "@/pages/admin/CustomerDetailPage";
import EmployeesPage from "@/pages/admin/EmployeesPage";
import EmployeeNewPage from "@/pages/admin/EmployeeNewPage";
import ExpensesPage from "@/pages/admin/ExpensesPage";
import ExpenseNewPage from "@/pages/admin/ExpenseNewPage";
import OrdersPage from "@/pages/admin/OrdersPage";
import OrderNewPage from "@/pages/admin/OrderNewPage";
import SuppliersPage from "@/pages/admin/SuppliersPage";
import SupplierNewPage from "@/pages/admin/SupplierNewPage";
import ItemsPage from "@/pages/admin/ItemsPage";
import ItemNewPage from "@/pages/admin/ItemNewPage";
import PurchasesPage from "@/pages/admin/PurchasesPage";
import PurchaseNewPage from "@/pages/admin/PurchaseNewPage";
import PaymentsPage from "@/pages/admin/PaymentsPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import MapPage from "@/pages/admin/MapPage";

import StaffPage from "@/pages/staff/StaffPage";
import PortalPage from "@/pages/portal/PortalPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <ServiceWorkerRegistration />
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/customers" element={<CustomersPage />} />
              <Route path="/admin/customers/new" element={<CustomerNewPage />} />
              <Route path="/admin/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/admin/employees" element={<EmployeesPage />} />
              <Route path="/admin/employees/new" element={<EmployeeNewPage />} />
              <Route path="/admin/expenses" element={<ExpensesPage />} />
              <Route path="/admin/expenses/new" element={<ExpenseNewPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/orders/new" element={<OrderNewPage />} />
              <Route path="/admin/suppliers" element={<SuppliersPage />} />
              <Route path="/admin/suppliers/new" element={<SupplierNewPage />} />
              <Route path="/admin/items" element={<ItemsPage />} />
              <Route path="/admin/items/new" element={<ItemNewPage />} />
              <Route path="/admin/purchases" element={<PurchasesPage />} />
              <Route path="/admin/purchases/new" element={<PurchaseNewPage />} />
              <Route path="/admin/payments" element={<PaymentsPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/map" element={<MapPage />} />
            </Route>

            <Route element={<RequireRole role="employee" />}>
              <Route path="/staff" element={<StaffPage />} />
            </Route>

            <Route element={<RequireRole role="customer" />}>
              <Route path="/portal" element={<PortalPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
