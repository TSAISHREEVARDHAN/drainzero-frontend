import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ScrollToTop    from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PageWrapper    from './components/PageWrapper';

import LandingPage        from './pages/Landing/LandingPage';
import LoginPage          from './pages/Auth/LoginPage';
import SignupPage         from './pages/Auth/SignupPage';
import AuthCallback       from './pages/Auth/AuthCallback';
import OnboardingPage     from './pages/Auth/OnboardingPage';
import Dashboard          from './pages/Dashboard';
import ProfilePage        from './pages/ProfilePage';
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

const PR  = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;
const PRN = ({ children }) => <ProtectedRoute requireOnboarding={false}>{children}</ProtectedRoute>;
const W   = (node) => <PageWrapper>{node}</PageWrapper>;

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"               element={W(<LandingPage />)} />
        <Route path="/login"          element={W(<LoginPage />)} />
        <Route path="/signup"         element={W(<SignupPage />)} />
        <Route path="/auth/callback"  element={W(<AuthCallback />)} />
        <Route path="/onboarding"     element={<PRN>{W(<OnboardingPage />)}</PRN>} />

        <Route path="/dashboard"           element={<PR>{W(<Dashboard />)}</PR>} />
        <Route path="/profile"             element={<PR>{W(<ProfilePage />)}</PR>} />
        <Route path="/category-selection"  element={<PR>{W(<CategorySelection />)}</PR>} />
        <Route path="/analysis"            element={<PR>{W(<AnalysisForm />)}</PR>} />

        <Route path="/feature/tax-health"        element={<PR>{W(<TaxHealth />)}</PR>} />
        <Route path="/feature/tax-leakage"       element={<PR>{W(<TaxLeakage />)}</PR>} />
        <Route path="/feature/recommendations"   element={<PR>{W(<Recommendations />)}</PR>} />
        <Route path="/feature/regime-comparison" element={<PR>{W(<RegimeComparison />)}</PR>} />
        <Route path="/feature/salary-analysis"   element={<PR>{W(<SalaryAnalysis />)}</PR>} />
        <Route path="/feature/loopholes"         element={<PR>{W(<LoopholesPage />)}</PR>} />
        <Route path="/feature/documents"         element={<PR>{W(<DocumentsPage />)}</PR>} />
        <Route path="/feature/what-if"           element={<PR>{W(<WhatIfSimulator />)}</PR>} />
        <Route path="/feature/deductions"        element={<PR>{W(<DeductionsExplorer />)}</PR>} />
        <Route path="/feature/deadlines"         element={<PR>{W(<DeadlineReminders />)}</PR>} />
        <Route path="/feature/investment-guide"  element={<PR>{W(<InvestmentGuide />)}</PR>} />
        <Route path="/feature/benefits"          element={<PR>{W(<BenefitsExplorer />)}</PR>} />
        <Route path="/feature/report"            element={<PR>{W(<TaxReport />)}</PR>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <Router>
    <ScrollToTop />
    <AnimatedRoutes />
  </Router>
);

export default App;
