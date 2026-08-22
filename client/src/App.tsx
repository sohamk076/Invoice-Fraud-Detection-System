import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailsPage } from './pages/InvoiceDetailsPage';
import { UploadInvoicePage } from './pages/UploadInvoicePage';
import { CreateManualInvoicePage } from './pages/CreateManualInvoicePage';
import { VendorsPage } from './pages/VendorsPage';
import { VendorDetailsPage } from './pages/VendorDetailsPage';
import { FraudAlertsPage } from './pages/FraudAlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/upload" element={<UploadInvoicePage />} />
                  <Route path="/invoices/create" element={<CreateManualInvoicePage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
                  <Route path="/vendors" element={<VendorsPage />} />
                  <Route path="/vendors/:id" element={<VendorDetailsPage />} />
                  <Route path="/alerts" element={<FraudAlertsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Auditor & Admin Only Routes */}
                  <Route element={<ProtectedRoute roles={['ADMIN', 'AUDITOR']} />}>
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
