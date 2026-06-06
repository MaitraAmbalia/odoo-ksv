import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../utils/api';

export const Invoices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tabs = [
    { label: 'All' },
    { label: 'Draft' },
    { label: 'Sent' },
    { label: 'Paid' },
    { label: 'Overdue' },
    { label: 'Cancelled' }
  ];

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data.data.data || res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      setErrorMsg('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'var(--text-muted)';
      case 'SENT': return '#3B82F6';
      case 'PAID': return '#10B981';
      case 'OVERDUE': return '#F59E0B';
      case 'CANCELLED': return '#EF4444';
      default: return 'var(--text-muted)';
    }
  };

  const handleViewPDF = async (id: string) => {
    setOpenActionMenuId(null);
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to view invoice PDF');
    }
  };

  const handleSendInvoice = async (id: string) => {
    setOpenActionMenuId(null);
    try {
      await api.post(`/invoices/${id}/send`);
      alert('Invoice sent successfully via email!');
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send invoice');
    }
  };

  const handleMarkPaid = async (id: string) => {
    setOpenActionMenuId(null);
    try {
      await api.post(`/invoices/${id}/mark-paid`);
      alert('Invoice marked as paid!');
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark invoice as paid');
    }
  };

  const handleCancelInvoice = async (id: string) => {
    setOpenActionMenuId(null);
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.post(`/invoices/${id}/cancel`);
      alert('Invoice cancelled!');
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel invoice');
    }
  };

  const statusMap: Record<string, string> = {
    'Draft': 'DRAFT',
    'Sent': 'SENT',
    'Paid': 'PAID',
    'Overdue': 'OVERDUE',
    'Cancelled': 'CANCELLED'
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesTab = activeTab === 'All' || inv.status === statusMap[activeTab];
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.po?.poNumber.toLowerCase().includes(query) ||
      (inv.vendor?.companyName && inv.vendor.companyName.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  const getTabCount = (label: string) => {
    if (label === 'All') return invoices.length;
    return invoices.filter(inv => inv.status === statusMap[label]).length;
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

      {errorMsg && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '0.5rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Search Bar */}
      <section className="dashboard-card float-animation" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <Input 
          label=""
          placeholder={isVendor ? "Search by Invoice Number or PO Number..." : "Search by Invoice Number, PO Number, or Vendor..."}
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
            {tab.label} ({getTabCount(tab.label)})
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
                    {!isVendor && <td style={{ padding: '1.5rem' }}>{row.vendor?.companyName}</td>}
                    <td style={{ padding: '1.5rem' }}>₹{row.grandTotal?.toLocaleString() || 0}</td>
                    <td style={{ padding: '1.5rem' }}>{new Date(row.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="glow-point" style={{ backgroundColor: getStatusColor(row.status), boxShadow: `0 0 10px ${getStatusColor(row.status)}` }} />
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
                          <button 
                            onClick={() => handleViewPDF(row.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                          >
                            View Document
                          </button>
                          {!isVendor && (
                            <>
                              {['DRAFT', 'OVERDUE'].includes(row.status) && (
                                <button 
                                  onClick={() => handleSendInvoice(row.id)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                                >
                                  Send via Email
                                </button>
                              )}
                              {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
                                <button 
                                  onClick={() => handleMarkPaid(row.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#10B981', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                                >
                                  Mark as Paid
                                </button>
                              )}
                              {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
                                <button 
                                  onClick={() => handleCancelInvoice(row.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                                >
                                  Cancel Invoice
                                </button>
                              )}
                            </>
                          )}
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
