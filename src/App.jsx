import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PendingPage from "./pages/PendingPage";
import RejectedPage from "./pages/RejectedPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

import CustomerLayout from "./components/layouts/CustomerLayout";
import OrdersPage from "./pages/customer/OrdersPage";
import CatalogPage from "./pages/customer/CatalogPage";
import ReposicaoPage from "./pages/customer/ReposicaoPage";

import AdminLayout from "./components/layouts/AdminLayout";
import AprovacoesPage from "./pages/admin/AprovacoesPage";
import TrackingPage from "./pages/admin/TrackingPage";
import MotoristasPage from "./pages/admin/MotoristasPage";
import SalesReportsPage from "./pages/admin/SalesReportsPage";

import DriverLayout from "./components/layouts/DriverLayout";
import DeliveriesPage from "./pages/driver/DeliveriesPage";
import DeliveryDetailPage from "./pages/driver/DeliveryDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<SignupPage />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/rejected" element={<RejectedPage />} />
          <Route path="/nao-autorizado" element={<UnauthorizedPage />} />

          {/* Customer-only branch */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/pedidos" replace />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="catalogo" element={<CatalogPage />} />
            <Route path="reposicao" element={<ReposicaoPage />} />
          </Route>

          {/* Admin-only branch — completely separate route tree, own layout,
              own nav. A customer role never even matches these routes:
              ProtectedRoute bounces them to /nao-autorizado before anything
              here renders. */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/aprovacoes" replace />} />
            <Route path="aprovacoes" element={<AprovacoesPage />} />
            <Route path="pedidos" element={<TrackingPage />} />
            <Route path="motoristas" element={<MotoristasPage />} />
            <Route path="relatorios" element={<SalesReportsPage />} />
          </Route>

          {/* Driver-only branch */}
          <Route
            path="/entregas"
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DeliveriesPage />} />
            <Route path=":id" element={<DeliveryDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
