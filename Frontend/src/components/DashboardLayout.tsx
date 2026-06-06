import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Vendors', path: '/vendors' },
    { label: "RFQ's", path: '/rfqs' },
    { label: 'Quotations', path: '/quotations' },
    { label: 'Approvals', path: '/approvals' },
    { label: 'Purchase Orders', path: '/purchase-orders' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Reports', path: '/reports' },
    { label: 'Activity', path: '/activity' }
  ];

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '2rem', fontSize: '1.25rem' }}>VendorBridge</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.label} 
                to={item.path} 
                style={{ 
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  padding: isActive ? '0.25rem 0' : '0'
                }}
              >
                - {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
