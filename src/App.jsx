import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage        from './pages/Landing/LandingPage';
import LoginPage          from './pages/Auth/LoginPage';
import SignupPage         from './pages/Auth/SignupPage';
import AuthCallback       from './pages/Auth/AuthCallback';
import OnboardingPage     from './pages/Auth/OnboardingPage';
import Dashboard          from './pages/Dashboard';
import CategorySelection  from './pages/features/CategorySelection';
import AnalysisForm       from './pages/AnalysisForm';
import TaxHealth          from './pages/features/TaxHealth';
import TaxLeakage         from './pages/features/TaxLeakage';
import Recommendations    from './pages/features/Recommendations';
import RegimeComparison   from './pages/features/RegimeComparison';
import SalaryAnalysis     from './pages/features/SalaryAnalysis';
import LoopholesPage      from './pages/features/Loopholes';
import DocumentsPage      from './pages/features/DocumentsPage';
import WhatIfSimulator    from './pages/features/WhatIfSimulator';
import DeductionsExplorer from './pages/features/DeductionsExplorer';
import DeadlineReminders  from './pages/features/DeadlineReminders';
import InvestmentGuide    from './pages/features/InvestmentGuide';
import BenefitsExplorer   from './pages/features/BenefitsExplorer';
import TaxReport          from './pages/features/TaxReport';

const PR = ({ children, noOnboarding = false }) => (
  <ProtectedRoute requireOnboarding={!noOnboarding}>{children}</ProtectedRoute>
);

const App = () => (
  <Router>
    <ScrollToTop />
    <Routes>
      {/* Public */}
      <Route path="/"               element={<LandingPage />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/signup"         element={<SignupPage />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />

      {/* Onboarding — needs login, no onboarding required */}
      <Route path="/onboarding"     element={<PR noOnboarding><OnboardingPage /></PR>} />

      {/* Protected */}
      <Route path="/dashboard"          element={<PR><Dashboard /></PR>} />
      <Route path="/category-selection" element={<PR><CategorySelection /></PR>} />
      <Route path="/analysis"           element={<PR><AnalysisForm /></PR>} />

      <Route path="/feature/tax-health"        element={<PR><TaxHealth /></PR>} />
      <Route path="/feature/tax-leakage"       element={<PR><TaxLeakage /></PR>} />
      <Route path="/feature/recommendations"   element={<PR><Recommendations /></PR>} />
      <Route path="/feature/regime-comparison" element={<PR><RegimeComparison /></PR>} />
      <Route path="/feature/salary-analysis"   element={<PR><SalaryAnalysis /></PR>} />
      <Route path="/feature/loopholes"         element={<PR><LoopholesPage /></PR>} />
      <Route path="/feature/documents"         element={<PR><DocumentsPage /></PR>} />
      <Route path="/feature/what-if"           element={<PR><WhatIfSimulator /></PR>} />
      <Route path="/feature/deductions"        element={<PR><DeductionsExplorer /></PR>} />
      <Route path="/feature/deadlines"         element={<PR><DeadlineReminders /></PR>} />
      <Route path="/feature/investment-guide"  element={<PR><InvestmentGuide /></PR>} />
      <Route path="/feature/benefits"          element={<PR><BenefitsExplorer /></PR>} />
      <Route path="/feature/report"            element={<PR><TaxReport /></PR>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

export default App;
