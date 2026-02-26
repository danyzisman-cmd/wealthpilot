import { Routes, Route } from 'react-router';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import AdvisorPage from './pages/AdvisorPage';
import AskAdvisorPage from './pages/AskAdvisorPage';
import TaxCalcPage from './pages/TaxCalcPage';
import BudgetPage from './pages/BudgetPage';
import PortfolioPage from './pages/PortfolioPage';
import RSUPage from './pages/RSUPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="advisor" element={<AdvisorPage />} />
        <Route path="ask" element={<AskAdvisorPage />} />
        <Route path="tax-calc" element={<TaxCalcPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="rsus" element={<RSUPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
