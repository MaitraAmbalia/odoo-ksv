import React, { useState } from 'react';
import { Button } from '../components/Button';
import { AddVendorModal } from '../components/AddVendorModal';

export const Dashboard: React.FC = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Sidebar - Optional but requested in wireframe */}
      <aside className="sidebar">
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '2rem', fontSize: '1.25rem' }}>VendorBridge</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['Dashboard', 'Vendors', "RFQ's", 'Quotations', 'Approvals', 'Purchase Orders', 'Invoices', 'Reports', 'Activity'].map((item) => (
            <a 
              key={item} 
              href="#" 
              style={{ 
                color: item === 'Dashboard' ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: item === 'Dashboard' ? 600 : 400,
                textDecoration: 'none'
              }}
            >
              - {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Dashboard / Home Screen</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Welcome back, Procurement Officer - Today's Overview
          </p>
        </header>

        {/* Analytics Cards (Floating) */}
        <section className="metrics-grid">
          {[
            { value: '0', label: "Active RFQ's", delay: '' },
            { value: '0', label: 'Pending Approvals', delay: 'float-delayed-1' },
            { value: '$0.00', label: "PO's this month", delay: 'float-delayed-2' },
            { value: '0', label: 'Overdue Invoices', delay: '' },
          ].map((metric, index) => (
            <div key={index} className={`dashboard-card float-animation ${metric.delay}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{metric.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{metric.label}</div>
            </div>
          ))}
        </section>

        <div className="grid-2-cols">
          {/* Recent Purchase Orders & Active RFQs */}
          <section className="dashboard-card float-delayed-1" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Recent Purchase Orders</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>PO#</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>Vendor</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>Amount</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 400 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent purchase orders.
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Spend Overview / Analytics Card Placeholder */}
          <section className="dashboard-card float-delayed-2" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Spending Trends (Last 6 Months)</h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
               {/* Visual Placeholder for Charts */}
               <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to top right, transparent, rgba(0, 229, 155, 0.1))', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)' }}>
                 <p style={{ color: 'var(--text-muted)' }}>[ Floating Sphere Chart Placeholder ]</p>
               </div>
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>+ New RFQ</Button>
          <Button variant="primary" onClick={() => setIsAddVendorOpen(true)}>Add Vendor</Button>
          <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>View Invoices</Button>
        </section>
      </main>

      {/* Modals */}
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} />
    </div>
  );
};
