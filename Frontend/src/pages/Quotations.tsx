import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';

import api from '../utils/api';

export const Quotations: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [detailsQuotation, setDetailsQuotation] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [compareRfq, setCompareRfq] = useState<{ id: string; title: string } | null>(null);
  const [compareData, setCompareData] = useState<any | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectLoading, setSelectLoading] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';
  const canSelect = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER' || user?.role === 'MANAGER';

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      if (isVendor) {
        const res = await api.get('/quotations/mine');
        setQuotations(res.data.data || []);
      } else {
        const res = await api.get('/quotations');
        setQuotations(res.data.data.data || res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
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
      case 'SUBMITTED': return 'var(--success-color)';
      case 'DRAFT': return 'var(--text-muted)';
      case 'ACCEPTED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      case 'WITHDRAWN': return '#F59E0B';
      case 'SUPERSEDED': return '#6366F1';
      default: return 'var(--text-muted)';
    }
  };

  // Filter quotations
  const filteredQuotations = quotations.filter(q => {
    const rfqTitle = q.rfq?.title || '';
    const vendorName = q.vendor?.companyName || '';
    const matchesSearch =
      rfqTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'All' ||
      q.status === activeTab.toUpperCase().replace('S', 'S');

    return matchesSearch && matchesTab;
  });

  const tabs = [
    { label: 'All', count: quotations.length },
    { label: 'DRAFT', count: quotations.filter(q => q.status === 'DRAFT').length },
    { label: 'SUBMITTED', count: quotations.filter(q => q.status === 'SUBMITTED').length },
    { label: 'ACCEPTED', count: quotations.filter(q => q.status === 'ACCEPTED').length },
    { label: 'REJECTED', count: quotations.filter(q => q.status === 'REJECTED').length }
  ];

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const handleViewDetails = async (quotationId: string) => {
    setOpenActionMenuId(null);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/quotations/${quotationId}`);
      setDetailsQuotation(res.data.data);
    } catch (err) {
      console.error('Failed to load quotation details:', err);
      alert('Failed to load quotation details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCompare = async (rfqId: string, rfqTitle: string) => {
    setOpenActionMenuId(null);
    if (!rfqId) {
      alert('RFQ information not available for comparison.');
      return;
    }
    setCompareRfq({ id: rfqId, title: rfqTitle });
    setCompareLoading(true);
    try {
      const res = await api.get(`/rfqs/${rfqId}/comparison`);
      setCompareData(res.data.data);
    } catch (err) {
      console.error('Failed to load quotation comparison:', err);
      alert('Failed to load quotation comparison.');
      setCompareRfq(null);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSelectQuotation = async (quotationId: string) => {
    if (!compareRfq) return;
    const isConfirmed = window.confirm('Are you sure you want to select this quotation and send it for manager approval? Other quotations for this RFQ will be rejected.');
    if (!isConfirmed) return;

    setSelectLoading(quotationId);
    try {
      await api.post(`/rfqs/${compareRfq.id}/comparison/select`, { quotationId });
      alert('Quotation selected successfully! Approval request has been generated.');
      setCompareRfq(null);
      fetchQuotations();
    } catch (err: any) {
      console.error('Failed to select quotation:', err);
      const msg = err.response?.data?.message || 'Failed to select quotation.';
      alert(msg);
    } finally {
      setSelectLoading(null);
    }
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

      {/* Search Bar */}
      <section className="dashboard-card float-animation" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
        <input 
          placeholder={isVendor ? "Search by RFQ title or amount..." : "Search by RFQ title, vendor name, or amount..."}
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
                    <td style={{ padding: '1.5rem' }}>{row.rfq?.title || 'N/A'}</td>
                    {!isVendor && <td style={{ padding: '1.5rem' }}>{row.vendor?.companyName || 'N/A'}</td>}
                    <td style={{ padding: '1.5rem' }}>₹{row.grandTotal?.toLocaleString('en-IN') || 0}</td>
                    <td style={{ padding: '1.5rem' }}>{row.deliveryDays}</td>
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
                        View
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
                            onClick={() => handleViewDetails(row.id)}
                          >View Details</button>
                          {!isVendor && <button 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleCompare(row.rfq?.id, row.rfq?.title || 'Unknown RFQ')}
                          >Compare</button>}
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

      {/* View Details Modal */}
      {detailsQuotation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setDetailsQuotation(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Quotation Details</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Submitted by {detailsQuotation.vendor?.companyName}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
                <div style={{ fontWeight: 600, color: getStatusColor(detailsQuotation.status) }}>{detailsQuotation.status}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivery Days</span>
                <div style={{ fontWeight: 600 }}>{detailsQuotation.deliveryDays} Days</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Terms</span>
                <div style={{ fontWeight: 600 }}>{detailsQuotation.paymentTerms || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tax Details</span>
                <div style={{ fontWeight: 600 }}>{detailsQuotation.taxType} ({detailsQuotation.gstRate}%)</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 500 }}>Quoted Items</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Item Name</th>
                  <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Quantity</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {detailsQuotation.items?.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0' }}>{item.rfqItem?.itemName || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>{item.rfqItem?.quantity || 0}</td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>₹{item.totalPrice?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>₹{detailsQuotation.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST Amount</span>
                <span>₹{detailsQuotation.gstAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                <span>Grand Total</span>
                <span>₹{detailsQuotation.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {detailsQuotation.notes && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Vendor Notes</span>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>"{detailsQuotation.notes}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotation Comparison Matrix Modal */}
      {compareRfq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => { setCompareRfq(null); setCompareData(null); }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Quotation Comparison Matrix</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Comparing bids for RFQ: {compareRfq.title}</p>

            {compareLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading comparison matrix...</div>
            ) : !compareData || compareData.quotations.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No submitted quotations available to compare.</div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem', fontWeight: 600, minWidth: '200px', borderRight: '1px solid var(--border-color)' }}>Metric / Item</th>
                      {compareData.quotations.map((q: any) => (
                        <th key={q.quotationId} style={{ padding: '1rem', fontWeight: 600, minWidth: '220px', borderRight: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{q.vendorName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Rating: {q.vendorRating ? '★'.repeat(Math.round(q.vendorRating)) : 'No rating'}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Items row-by-row */}
                    {compareData.rfq?.items?.map((rfqItem: any) => (
                      <tr key={rfqItem.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 500 }}>
                          {rfqItem.itemName} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Qty: {rfqItem.quantity})</span>
                        </td>
                        {compareData.quotations.map((q: any) => {
                          const quoteItem = q.items.find((item: any) => item.rfqItemId === rfqItem.id);
                          return (
                            <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                              {quoteItem ? (
                                <div>
                                  <div style={{ fontWeight: 500 }}>₹{quoteItem.totalPrice?.toLocaleString('en-IN')}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{quoteItem.unitPrice?.toLocaleString('en-IN')}/unit</div>
                                </div>
                              ) : (
                                <span style={{ color: 'red' }}>Not Quoted</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Subtotal */}
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 500, color: 'var(--text-muted)' }}>Subtotal</td>
                      {compareData.quotations.map((q: any) => (
                        <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                          ₹{q.subtotal?.toLocaleString('en-IN')}
                        </td>
                      ))}
                    </tr>

                    {/* Tax Type / GST */}
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 500, color: 'var(--text-muted)' }}>Tax (GST)</td>
                      {compareData.quotations.map((q: any) => (
                        <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                          {q.taxType} ({q.gstRate}%)
                        </td>
                      ))}
                    </tr>

                    {/* Grand Total */}
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 600 }}>Grand Total</td>
                      {compareData.quotations.map((q: any) => (
                        <td key={q.quotationId} style={{ 
                          padding: '1rem', 
                          borderRight: '1px solid var(--border-color)', 
                          fontWeight: 700,
                          color: q.isLowestPrice ? '#10B981' : 'var(--text-main)',
                          background: q.isLowestPrice ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                        }}>
                          ₹{q.grandTotal?.toLocaleString('en-IN')}
                          {q.isLowestPrice && <span style={{ display: 'block', fontSize: '0.75rem', color: '#10B981', fontWeight: 500, marginTop: '0.25rem' }}>🟢 Lowest Price</span>}
                        </td>
                      ))}
                    </tr>

                    {/* Delivery Days */}
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 500 }}>Delivery speed</td>
                      {compareData.quotations.map((q: any) => (
                        <td key={q.quotationId} style={{ 
                          padding: '1rem', 
                          borderRight: '1px solid var(--border-color)',
                          color: q.isFastestDelivery ? '#10B981' : 'var(--text-main)',
                          background: q.isFastestDelivery ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                        }}>
                          {q.deliveryDays} Days
                          {q.isFastestDelivery && <span style={{ display: 'block', fontSize: '0.75rem', color: '#10B981', fontWeight: 500, marginTop: '0.25rem' }}>🟢 Fastest</span>}
                        </td>
                      ))}
                    </tr>

                    {/* Payment Terms */}
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 500 }}>Payment Terms</td>
                      {compareData.quotations.map((q: any) => (
                        <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                          {q.paymentTerms || 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {/* Notes */}
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: 500 }}>Vendor Notes</td>
                      {compareData.quotations.map((q: any) => (
                        <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {q.notes ? `"${q.notes}"` : 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {/* Actions */}
                    {canSelect && (
                      <tr>
                        <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}></td>
                        {compareData.quotations.map((q: any) => (
                          <td key={q.quotationId} style={{ padding: '1.5rem 1rem', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <Button
                              onClick={() => handleSelectQuotation(q.quotationId)}
                              disabled={selectLoading === q.quotationId}
                              style={{
                                width: '100%',
                                background: '#10B981',
                                border: 'none',
                                color: 'white',
                                padding: '0.6rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}
                            >
                              {selectLoading === q.quotationId ? 'Selecting...' : 'Select & Approve'}
                            </Button>
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
