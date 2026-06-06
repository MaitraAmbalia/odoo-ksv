import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';

import api from '../utils/api';

export const Invoices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.data.data || res.data.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Close action menu on outside click
  useEffect(() => {
    const handleClick = () => setOpenActionMenuId(null);
    if (openActionMenuId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openActionMenuId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'var(--text-muted)';
      case 'SENT': return '#3B82F6';
      case 'PAID': return '#10B981';
      case 'OVERDUE': return '#EF4444';
      case 'CANCELLED': return '#6B7280';
      default: return 'var(--text-muted)';
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const vendorName = inv.vendor?.companyName || '';
    const invoiceNum = inv.invoiceNumber || '';
    const matchesSearch =
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceNum.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'All' ||
      inv.status === activeTab.toUpperCase();

    return matchesSearch && matchesTab;
  });

  const tabs = [
    { label: 'All', count: invoices.length },
    { label: 'DRAFT', count: invoices.filter(i => i.status === 'DRAFT').length },
    { label: 'SENT', count: invoices.filter(i => i.status === 'SENT').length },
    { label: 'PAID', count: invoices.filter(i => i.status === 'PAID').length },
    { label: 'OVERDUE', count: invoices.filter(i => i.status === 'OVERDUE').length },
    { label: 'CANCELLED', count: invoices.filter(i => i.status === 'CANCELLED').length }
  ];

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/send`);
      fetchInvoices();
    } catch (e) {
      alert('Failed to send invoice');
    }
    setOpenActionMenuId(null);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/mark-paid`);
      fetchInvoices();
    } catch (e) {
      alert('Failed to mark as paid');
    }
    setOpenActionMenuId(null);
  };

  const handleViewDocument = async (id: string) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (e) {
      alert('Failed to load document');
    }
    setOpenActionMenuId(null);
  };

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>{isVendor ? 'My Invoices' : 'Invoices'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isVendor ? 'Manage your billing and payments' : 'Manage billing and payment statuses'}
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <section className="dashboard-card float-animation" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
        <input 
          placeholder={isVendor ? "Search by Invoice Number or PO Number..." : "Search by Invoice Number, PO Number, or Vendor..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', color: 'var(--text-main)', fontSize: '0.9rem', padding: '0.5rem 0' }}
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
                {!isVendor && <th style={{ padding: '1.5rem', fontWeight: 500 }}>Vendor</th>}
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Amount</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Due Date</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1.5rem', fontWeight: 500, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isVendor ? 6 : 7} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={isVendor ? 6 : 7} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)' }}>{row.invoiceNumber}</td>
                    <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)' }}>{row.po?.poNumber || 'N/A'}</td>
                    {!isVendor && <td style={{ padding: '1.5rem' }}>{row.vendor?.companyName || 'N/A'}</td>}
                    <td style={{ padding: '1.5rem' }}>₹{row.grandTotal?.toLocaleString('en-IN') || 0}</td>
                    <td style={{ padding: '1.5rem' }}>{new Date(row.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="glow-point" style={{ backgroundColor: getStatusColor(row.status), boxShadow: `0 0 10px ${getStatusColor(row.status)}` }} />
                      {row.status}
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                      <Button 
                        variant="secondary" 
                        style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        onClick={(e) => { e.stopPropagation(); toggleActionMenu(row.id); }}
                      >
                        Options
                      </Button>
                      
                      {openActionMenuId === row.id && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{
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
                          <button 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleViewDocument(row.id)}
                          >View Document</button>
                          {!isVendor && row.status === 'DRAFT' && <button 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleSendInvoice(row.id)}
                          >Send via Email</button>}
                          {!isVendor && row.status === 'SENT' && <button 
                            style={{ background: 'transparent', border: 'none', color: '#10B981', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleMarkPaid(row.id)}
                          >Mark as Paid</button>}
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
