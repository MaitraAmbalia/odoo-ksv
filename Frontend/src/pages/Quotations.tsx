import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../utils/api';

export const Quotations: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tabs = [
    { label: 'All' },
    { label: 'Drafts' },
    { label: 'Submitted' },
    { label: 'Accepted' },
    { label: 'Rejected' }
  ];

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const endpoint = isVendor ? '/quotations/mine' : '/quotations';
      const res = await api.get(endpoint);
      setQuotations(res.data.data.data || res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch quotations:', err);
      setErrorMsg('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'var(--text-muted)';
      case 'SUBMITTED': return '#3B82F6';
      case 'ACCEPTED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      case 'WITHDRAWN': return 'rgba(255,255,255,0.2)';
      default: return 'var(--text-muted)';
    }
  };

  const handleSubmitQuotation = async (id: string) => {
    setOpenActionMenuId(null);
    try {
      await api.post(`/quotations/${id}/submit`);
      alert('Quotation submitted successfully!');
      await fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit quotation');
    }
  };

  const handleWithdrawQuotation = async (id: string) => {
    setOpenActionMenuId(null);
    try {
      await api.post(`/quotations/${id}/withdraw`);
      alert('Quotation withdrawn successfully!');
      await fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to withdraw quotation');
    }
  };

  const statusMap: Record<string, string> = {
    'Drafts': 'DRAFT',
    'Submitted': 'SUBMITTED',
    'Accepted': 'ACCEPTED',
    'Rejected': 'REJECTED'
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesTab = activeTab === 'All' || q.status === statusMap[activeTab];
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (q.rfq?.title && q.rfq.title.toLowerCase().includes(query)) ||
      (q.vendor?.companyName && q.vendor.companyName.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  const getTabCount = (label: string) => {
    if (label === 'All') return quotations.length;
    return quotations.filter(q => q.status === statusMap[label]).length;
  };

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>{isVendor ? 'My Quotations' : 'Quotations'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isVendor ? 'Manage and review your submitted quotations' : 'Manage and review supplier pricing submissions'}
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
          placeholder={isVendor ? "Search by RFQ title or amount..." : "Search by RFQ title, vendor name, or amount..."}
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

      {/* Quotations Table */}
      <section className="dashboard-card float-delayed-1" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>RFQ Title</th>
                {!isVendor && <th style={{ padding: '1.5rem', fontWeight: 500 }}>Vendor</th>}
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Amount</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Delivery Days</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1.5rem', fontWeight: 500, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isVendor ? 5 : 6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading quotations...
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={isVendor ? 5 : 6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1.5rem' }}>{row.rfq?.title || 'Unknown RFQ'}</td>
                    {!isVendor && <td style={{ padding: '1.5rem' }}>{row.vendor?.companyName}</td>}
                    <td style={{ padding: '1.5rem' }}>₹{row.grandTotal?.toLocaleString() || 0}</td>
                    <td style={{ padding: '1.5rem' }}>{row.deliveryDays} days</td>
                    <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="glow-point" style={{ backgroundColor: getStatusColor(row.status), boxShadow: `0 0 10px ${getStatusColor(row.status)}` }} />
                      {row.status}
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                      {isVendor && (row.status === 'DRAFT' || row.status === 'SUBMITTED') ? (
                        <>
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
                              {row.status === 'DRAFT' && (
                                <button 
                                  onClick={() => handleSubmitQuotation(row.id)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                                >
                                  Submit Quotation
                                </button>
                              )}
                              {row.status === 'SUBMITTED' && (
                                <button 
                                  onClick={() => handleWithdrawQuotation(row.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                                >
                                  Withdraw Quotation
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No actions</span>
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
