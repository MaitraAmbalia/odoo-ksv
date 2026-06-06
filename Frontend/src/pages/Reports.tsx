import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';

export const Reports: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState('This Month');

  const periods = ['This Week', 'This Month', 'This Quarter', 'Custom'];

  const summaryCards = [
    { label: 'Total Spend', value: '₹0.00', trend: '0%', isPositive: true },
    { label: 'POs Raised', value: '0', trend: '0%', isPositive: true },
    { label: 'Avg Approval Time', value: '0 days', trend: '0%', isPositive: true },
    { label: 'Overdue', value: '₹0.00', trend: '0%', isPositive: false },
  ];

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Insights on procurement spend, vendor performance, and workflows
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {periods.map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              style={{
                background: activePeriod === period ? 'var(--brand-600)' : 'transparent',
                border: activePeriod === period ? 'none' : '1px solid var(--border-color)',
                color: activePeriod === period ? '#fff' : 'var(--text-main)',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {period}
            </button>
          ))}
          <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', marginLeft: '1rem' }}>
            Download Report
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {summaryCards.map((card, idx) => (
          <div key={idx} className="dashboard-card float-animation" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{card.value}</div>
            <div style={{ fontSize: '0.85rem', color: card.isPositive ? '#10B981' : '#EF4444', marginTop: '0.5rem' }}>
              {card.trend} vs last period
            </div>
          </div>
        ))}
      </section>

      {/* Chart Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="dashboard-card float-delayed-1" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 500 }}>Monthly Procurement Spend</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>[Export]</span>
          </div>
          <div style={{ flex: 1, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [Line/Bar Chart Placeholder]
          </div>
        </div>

        <div className="dashboard-card float-delayed-1" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 500 }}>Procurement by Category</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>[Export]</span>
          </div>
          <div style={{ flex: 1, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [Donut Chart Placeholder]
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="dashboard-card float-delayed-2" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 500 }}>Vendor Performance</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>[Export]</span>
          </div>
          <div style={{ flex: 1, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [Horizontal Bar Chart Placeholder]
          </div>
        </div>

        <div className="dashboard-card float-delayed-2" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 500 }}>Invoice Aging</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>[Export]</span>
          </div>
          <div style={{ flex: 1, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            [Stacked Bar Chart Placeholder]
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};
