import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Vendors', path: '/vendors', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] },
    { label: "RFQ's", path: '/rfqs', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Quotations', path: '/quotations', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Approvals', path: '/approvals', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] },
    { label: 'Purchase Orders', path: '/purchase-orders', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Invoices', path: '/invoices', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Reports', path: '/reports', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Activity', path: '/activity', roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] }
  ];

  const navItems = allNavItems.filter(item => {
    if (!user) return true; // Fallback if no role is found
    return item.roles.includes(user.role);
  });

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
