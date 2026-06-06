import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';

import api from '../utils/api';

export const PurchaseOrders: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setPurchaseOrders(res.data.data.data || res.data.data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
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
      case 'ISSUED': return '#3B82F6';
      case 'PARTIALLY_RECEIVED': return '#F59E0B';
      case 'RECEIVED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return 'var(--text-muted)';
    }
  };

  // Filter purchase orders
  const filteredPOs = purchaseOrders.filter(po => {
    const vendorName = po.vendor?.companyName || '';
    const poNumber = po.poNumber || '';
    const rfqTitle = po.quotation?.rfq?.title || po.approval?.rfq?.title || '';
    const matchesSearch =
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfqTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'All' ||
      po.status === activeTab.toUpperCase().replace(/ /g, '_');

    return matchesSearch && matchesTab;
  });

  const tabs = [
    { label: 'All', count: purchaseOrders.length },
    { label: 'ISSUED', count: purchaseOrders.filter(po => po.status === 'ISSUED').length },
    { label: 'PARTIALLY_RECEIVED', count: purchaseOrders.filter(po => po.status === 'PARTIALLY_RECEIVED').length },
    { label: 'RECEIVED', count: purchaseOrders.filter(po => po.status === 'RECEIVED').length },
    { label: 'CANCELLED', count: purchaseOrders.filter(po => po.status === 'CANCELLED').length }
  ];

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const handleCancelPO = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this purchase order?')) {
      try {
        await api.patch(`/purchase-orders/${id}/cancel`);
        fetchPOs();
      } catch (e) {
        alert('Failed to cancel PO');
      }
    }
    setOpenActionMenuId(null);
  };

  const handleGenerateInvoice = async (poId: string) => {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await api.post(`/invoices`, { 
        poId, 
        dueDate: dueDate.toISOString(),
        taxType: 'GST_INTRA',
        gstRate: 18,
        notes: 'Generated from PO'
      });
      alert('Invoice generated successfully');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to generate invoice');
    }
    setOpenActionMenuId(null);
  };

  const handleViewDocument = (poNumber: string) => {
    alert(`Document viewer for ${poNumber} is under construction.`);
    setOpenActionMenuId(null);
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

      {/* Search Bar */}
      <section className="dashboard-card float-animation" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
        <input 
          placeholder={isVendor ? "Search by PO Number or RFQ Title..." : "Search by PO Number, Vendor, or RFQ Title..."}
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
            {tab.label.replace(/_/g, ' ')} ({tab.count})
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
                    {!isVendor && <td style={{ padding: '1.5rem' }}>{row.vendor?.companyName || 'N/A'}</td>}
                    <td style={{ padding: '1.5rem' }}>{row.quotation?.rfq?.title || row.approval?.rfq?.title || 'N/A'}</td>
                    <td style={{ padding: '1.5rem' }}>₹{row.quotation?.grandTotal?.toLocaleString('en-IN') || 0}</td>
                    <td style={{ padding: '1.5rem' }}>{new Date(row.issuedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="glow-point" style={{ backgroundColor: getStatusColor(row.status), boxShadow: `0 0 10px ${getStatusColor(row.status)}` }} />
                      {row.status?.replace(/_/g, ' ')}
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
                            onClick={() => handleViewDocument(row.poNumber)}
                          >View Document</button>
                          {isVendor && <button 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleGenerateInvoice(row.id)}
                          >Generate Invoice</button>}
                          {!isVendor && row.status === 'ISSUED' && <button 
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleCancelPO(row.id)}
                          >Cancel PO</button>}
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
