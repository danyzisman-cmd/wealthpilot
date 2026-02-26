import { useLocation } from 'react-router';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/advisor': 'Financial Advisor',
  '/ask': 'Ask Your Advisor',
  '/tax-calc': 'NYC Take-Home Calculator',
  '/budget': 'Budget Tracker',
  '/portfolio': 'Portfolio Tracker',
  '/rsus': 'RSU Tracker',
  '/settings': 'Settings',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'WealthPilot';

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex items-center px-8">
      <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
    </header>
  );
}
