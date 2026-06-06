import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { AddVendorModal } from '../components/AddVendorModal';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../utils/api';

export const Dashboard: React.FC = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [summary, setSummary] = useState({
    activeRFQs: 0,
    pendingApprovals: 0,
    posThisMonth: 0,
    overdueInvoices: 0,
    totalSpendThisMonth: 0
  });
  const [recentPOs, setRecentPOs] = useState<any[]>([]);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, posRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/recent-pos')
        ]);
        
        setSummary(summaryRes.data.data);
        setRecentPOs(posRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Dashboard / Home Screen</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Welcome back, {isVendor ? user?.firstName || 'Vendor' : 'Procurement Officer'} - Today's Overview
          </p>
        </header>

        {/* Analytics Cards (Floating) */}
        <section className="metrics-grid">
          {[
            { value: summary.activeRFQs.toString(), label: "Active RFQ's", delay: '' },
            { value: summary.pendingApprovals.toString(), label: isVendor ? 'Pending Quotations' : 'Pending Approvals', delay: 'float-delayed-1' },
            { value: `$${summary.totalSpendThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2})}`, label: isVendor ? "Total Business" : "Spend this month", delay: 'float-delayed-2' },
            { value: summary.overdueInvoices.toString(), label: 'Overdue Invoices', delay: '' },
          ].map((metric, index) => (
            <div key={index} className={`dashboard-card float-animation ${metric.delay}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{metric.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{metric.label}</div>
            </div>
          ))}
        </section>

        <div className="grid-2-cols">
          {/* Recent Purchase Orders */}
          <section className="dashboard-card float-delayed-1" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Recent Purchase Orders</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>PO#</th>
                    {!isVendor && <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>Vendor</th>}
                    <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>Amount</th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPOs.length === 0 ? (
                    <tr>
                      <td colSpan={isVendor ? 3 : 4} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No recent purchase orders.
                      </td>
                    </tr>
                  ) : (
                    recentPOs.map(po => (
                      <tr key={po.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem 0' }}>{po.poNumber}</td>
                        {!isVendor && <td style={{ padding: '1rem 0' }}>{po.vendor?.companyName}</td>}
                        <td style={{ padding: '1rem 0' }}>${po.quotation?.grandTotal?.toLocaleString() || '0'}</td>
                        <td style={{ padding: '1rem 0' }}>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '1rem', 
                            fontSize: '0.875rem',
                            background: po.status === 'ISSUED' ? 'rgba(0, 229, 155, 0.1)' : 'rgba(255,255,255,0.1)',
                            color: po.status === 'ISSUED' ? 'var(--success-color)' : 'var(--text-main)'
                          }}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Spend Overview / Analytics Card Placeholder */}
          <section className="dashboard-card float-delayed-2" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{isVendor ? "Revenue Trends" : "Spending Trends"} (Last 6 Months)</h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
               <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to top right, transparent, rgba(0, 229, 155, 0.1))', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)' }}>
                 <p style={{ color: 'var(--text-muted)' }}>[ Floating Sphere Chart Placeholder ]</p>
               </div>
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        {!isVendor && (
          <section style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
            <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>+ New RFQ</Button>
            <Button variant="primary" onClick={() => setIsAddVendorOpen(true)}>Add Vendor</Button>
            <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>View Invoices</Button>
          </section>
        )}

      {/* Modals */}
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} />
    </DashboardLayout>
  );
};

