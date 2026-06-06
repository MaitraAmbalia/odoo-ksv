import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardList, 
  CheckSquare, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  Activity 
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Vendors', path: '/vendors', icon: Users, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] },
    { label: "RFQ's", path: '/rfqs', icon: FileText, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Quotations', path: '/quotations', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Invoices', path: '/invoices', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR'] },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    { label: 'Activity', path: '/activity', icon: Activity, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] }
  ];

  const navItems = allNavItems.filter(item => {
    if (!user) return true; // Fallback if no role is found
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-md px-4 py-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary mb-8 px-3">VendorBridge</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link 
                  key={item.label} 
                  to={item.path} 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-3 pt-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground font-mono">VB-LOCAL v1.0.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-background/50">
        {children}
      </main>
    </div>
  );
};
