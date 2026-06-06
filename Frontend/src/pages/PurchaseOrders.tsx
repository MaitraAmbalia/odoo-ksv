import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../utils/api';

export const PurchaseOrders: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    taxType: 'GST_INTRA',
    gstRate: '18',
    notes: ''
  });

  const tabs = [
    { label: 'All' },
    { label: 'Issued' },
    { label: 'Partially Received' },
    { label: 'Received' },
    { label: 'Cancelled' }
  ];

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setPos(res.data.data.data || res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch POs:', err);
      setErrorMsg('Error loading purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ISSUED': return '#3B82F6';
      case 'PARTIALLY_RECEIVED': return '#F59E0B';
      case 'RECEIVED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return 'var(--text-muted)';
    }
  };

  const handleCancelPO = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this Purchase Order?')) return;
    try {
      await api.patch(`/purchase-orders/${id}/cancel`);
      setOpenActionMenuId(null);
      await fetchPOs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel Purchase Order');
    }
  };

  const openGenerateInvoiceModal = (po: any) => {
    setSelectedPo(po);
    setIsInvoiceModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleGenerateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      await api.post('/invoices', {
        poId: selectedPo.id,
        dueDate: invoiceForm.dueDate,
        taxType: invoiceForm.taxType,
        gstRate: parseFloat(invoiceForm.gstRate),
        notes: invoiceForm.notes
      });
      alert('Invoice generated successfully!');
      setIsInvoiceModalOpen(false);
      await fetchPOs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const statusMap: Record<string, string> = {
    'Issued': 'ISSUED',
    'Partially Received': 'PARTIALLY_RECEIVED',
    'Received': 'RECEIVED',
    'Cancelled': 'CANCELLED'
  };

  const filteredPOs = pos.filter(po => {
    const matchesTab = activeTab === 'All' || po.status === statusMap[activeTab];
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(query) ||
      (po.quotation?.rfq?.title && po.quotation.rfq.title.toLowerCase().includes(query)) ||
      (po.vendor?.companyName && po.vendor.companyName.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  const getTabCount = (label: string) => {
    if (label === 'All') return pos.length;
    return pos.filter(po => po.status === statusMap[label]).length;
  };

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>{isVendor ? 'My Purchase Orders' : 'Purchase Orders'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isVendor ? 'Track and fulfill your purchase orders' : 'Track and manage official purchase orders'}
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
          placeholder={isVendor ? "Search by PO Number or RFQ Title..." : "Search by PO Number, Vendor, or RFQ Title..."}
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

      {/* PO Table */}
      <section className="dashboard-card float-delayed-1" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>PO Number</th>
                {!isVendor && <th style={{ padding: '1.5rem', fontWeight: 500 }}>Vendor</th>}
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>RFQ Title</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Grand Total</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Issued Date</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1.5rem', fontWeight: 500, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isVendor ? 6 : 7} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={isVendor ? 6 : 7} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)' }}>{row.poNumber}</td>
                    {!isVendor && <td style={{ padding: '1.5rem' }}>{row.vendor?.companyName}</td>}
                    <td style={{ padding: '1.5rem' }}>{row.quotation?.rfq?.title || 'Unknown RFQ'}</td>
                    <td style={{ padding: '1.5rem' }}>₹{row.quotation?.grandTotal?.toLocaleString() || 0}</td>
                    <td style={{ padding: '1.5rem' }}>{new Date(row.issuedAt).toLocaleDateString()}</td>
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
                          {isVendor && row.status !== 'CANCELLED' && (
                            <button 
                              onClick={() => openGenerateInvoiceModal(row)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                            >
                              Generate Invoice
                            </button>
                          )}
                          {!isVendor && row.status !== 'CANCELLED' && (
                            <>
                              <button 
                                onClick={() => openGenerateInvoiceModal(row)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                              >
                                Generate Invoice
                              </button>
                              <button 
                                onClick={() => handleCancelPO(row.id)}
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                              >
                                Cancel PO
                              </button>
                            </>
                          )}
                          {row.status === 'CANCELLED' && (
                            <span style={{ color: 'var(--text-muted)', padding: '0.5rem', fontSize: '0.85rem' }}>No actions available</span>
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

      {/* Generate Invoice Modal */}
      {isInvoiceModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleGenerateInvoiceSubmit} className="dashboard-card" style={{ width: '450px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 300 }}>Generate Invoice for PO: {selectedPo?.poNumber}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
                <input 
                  type="date" 
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '0.25rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Tax Type</label>
                <select 
                  value={invoiceForm.taxType}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, taxType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '0.25rem',
                    outline: 'none'
                  }}
                >
                  <option value="GST_INTRA">Intra-State GST (CGST + SGST)</option>
                  <option value="GST_INTER">Inter-State GST (IGST)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>GST Rate (%)</label>
                <select 
                  value={invoiceForm.gstRate}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, gstRate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '0.25rem',
                    outline: 'none'
                  }}
                >
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Notes</label>
                <textarea 
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Billing terms, account details, etc."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '0.25rem',
                    outline: 'none',
                    minHeight: '80px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Generate</Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};
