import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Invoices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const tabs = [
    { label: 'All', count: 0 },
    { label: 'Draft', count: 0 },
    { label: 'Sent', count: 0 },
    { label: 'Paid', count: 0 },
    { label: 'Overdue', count: 0 },
    { label: 'Cancelled', count: 0 }
  ];

  const invoices: any[] = [];

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Invoices</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Manage billing and payment statuses
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <section className="dashboard-card float-animation" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <Input 
          label=""
          placeholder="Search by Invoice Number, PO Number, or Vendor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
        />
      </section>

      {/* Tabs */}
      <section style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            style={{
              background: 'transparent',
              border: `1px solid ${activeTab === tab.label ? 'var(--text-main)' : 'var(--border-color)'}`,
              color: activeTab === tab.label ? 'var(--text-main)' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </section>

      {/* Invoices Table */}
      <section className="dashboard-card float-delayed-1" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Invoice #</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>PO #</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Vendor</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Amount</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Due Date</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1.5rem', fontWeight: 500, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)' }}>{row.invoiceNumber}</td>
                    <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)' }}>{row.poNumber}</td>
                    <td style={{ padding: '1.5rem' }}>{row.vendorName}</td>
                    <td style={{ padding: '1.5rem' }}>₹{row.amount}</td>
                    <td style={{ padding: '1.5rem' }}>{row.dueDate}</td>
                    <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="glow-point" style={{ backgroundColor: row.statusColor, boxShadow: `0 0 10px ${row.statusColor}` }} />
                      {row.status}
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                      <Button 
                        variant="secondary" 
                        style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        onClick={() => toggleActionMenu(row.id)}
                      >
                        Options
                      </Button>
                      
                      {openActionMenuId === row.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '1.5rem',
                          background: 'var(--surface-color)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: '150px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}>View Document</button>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}>Send via Email</button>
                          <button style={{ background: 'transparent', border: 'none', color: '#10B981', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}>Mark as Paid</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
};
