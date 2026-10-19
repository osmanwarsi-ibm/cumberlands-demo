/**
 * Main App component with routing configuration
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './state/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { StatementIntakePage } from './pages/StatementIntakePage';
import { BatchListPage } from './pages/BatchListPage';
import { BatchResultsPage } from './pages/BatchResultsPage';
import { CostQueuePage } from './pages/CostQueuePage';
import { QuantityQueuePage } from './pages/QuantityQueuePage';
import { CostCaseDetailPage } from './pages/CostCaseDetailPage';
import { QuantityCaseDetailPage } from './pages/QuantityCaseDetailPage';
import { ApQueuePage } from './pages/ApQueuePage';
import { AuditTracePage } from './pages/AuditTracePage';
import { VendorFollowUpPage } from './pages/VendorFollowUpPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/intake" element={<StatementIntakePage />} />
          <Route path="/batches" element={<BatchListPage />} />
          <Route path="/batches/:batchId" element={<BatchResultsPage />} />
          <Route path="/cost-queue" element={<CostQueuePage />} />
          <Route path="/quantity-queue" element={<QuantityQueuePage />} />
          <Route path="/cost-case/:caseId" element={<CostCaseDetailPage />} />
          <Route path="/quantity-case/:caseId" element={<QuantityCaseDetailPage />} />
          <Route path="/ap-queue" element={<ApQueuePage />} />
          <Route path="/audit/:aggregateType/:aggregateId" element={<AuditTracePage />} />
          <Route path="/audit/case/:caseId" element={<AuditTracePage />} />
          <Route path="/audit" element={<AuditTracePage />} />
          <Route path="/vendor-follow-up/:caseId" element={<VendorFollowUpPage />} />
          <Route path="/vendor-follow-up" element={<VendorFollowUpPage />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
