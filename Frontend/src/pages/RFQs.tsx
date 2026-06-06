import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import api from '../utils/api';

export const RFQs: React.FC = () => {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  
  // Quotation Submission Form State (for Vendors)
  const [isSubmitQuoteOpen, setIsSubmitQuoteOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [gstRate, setGstRate] = useState(18);
  const [taxType, setTaxType] = useState('GST_INTRA');
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Comparison State (for Admin/Officer/Manager)
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';
  const canCreate = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT_OFFICER';

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const endpoint = isVendor ? '/rfqs/invited' : '/rfqs';
      const res = await api.get(endpoint, {
        params: {
          search: searchQuery || undefined,
          status: activeTab === 'All' ? undefined : activeTab.toUpperCase()
        }
      });
      const data = res.data.data.data || res.data.data.rfqs || res.data.data || [];
      setRfqs(data);
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [activeTab, searchQuery]);

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/rfqs/${id}/publish`);
      fetchRFQs();
    } catch (err) {
      console.error('Failed to publish RFQ:', err);
      alert('Error publishing RFQ. Make sure at least one active vendor is assigned.');
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.post(`/rfqs/${id}/close`);
      fetchRFQs();
    } catch (err) {
      console.error('Failed to close RFQ:', err);
    }
  };

  // --- Quotation Submission Logic (Vendors) ---
  const openSubmitQuote = (rfq: any) => {
    setSelectedRfq(rfq);
    // Initialize items with 0 price
    setQuoteItems(rfq.items.map((item: any) => ({
      rfqItemId: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: 0
    })));
    setGstRate(18);
    setTaxType('GST_INTRA');
    setDeliveryDays(7);
    setPaymentTerms('Net 30');
    setNotes('');
    setIsSubmitQuoteOpen(true);
  };

  const handleUnitPriceChange = (rfqItemId: string, val: number) => {
    setQuoteItems(prev => prev.map(item => 
      item.rfqItemId === rfqItemId ? { ...item, unitPrice: val } : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const gstAmount = (subtotal * gstRate) / 100;
    const grandTotal = subtotal + gstAmount;
    return { subtotal, gstAmount, grandTotal };
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    setSubmittingQuote(true);

    try {
      const payload = {
        items: quoteItems.map(item => ({
          rfqItemId: item.rfqItemId,
          unitPrice: Number(item.unitPrice)
        })),
        gstRate,
        taxType,
        deliveryDays: Number(deliveryDays),
        paymentTerms,
        notes
      };

      // 1. Create/Save Quotation
      const res = await api.post(`/rfqs/${selectedRfq.id}/quotations`, payload);
      const quoteId = res.data.data.id;

      // 2. Submit Quotation
      await api.post(`/quotations/${quoteId}/submit`);

      alert('Quotation submitted successfully!');
      setIsSubmitQuoteOpen(false);
      fetchRFQs();
    } catch (err: any) {
      console.error('Error submitting quotation:', err);
      alert(err.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // --- Comparison Matrix Logic (Admin/Officer/Manager) ---
  const openComparison = async (rfq: any) => {
    setSelectedRfq(rfq);
    setLoadingComparison(true);
    setIsCompareOpen(true);
    try {
      const res = await api.get(`/rfqs/${rfq.id}/comparison`);
      setComparisonData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load comparison data:', err);
      alert(err.response?.data?.message || 'Error loading comparison matrix');
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleSelectQuotation = async (quotationId: string) => {
    if (!selectedRfq) return;
    if (!window.confirm('Are you sure you want to select this quotation? This will submit it for manager approval and reject all other quotations.')) return;
    
    try {
      await api.post(`/rfqs/${selectedRfq.id}/comparison/select`, { quotationId });
      alert('Quotation selected successfully and sent for approval.');
      setIsCompareOpen(false);
      fetchRFQs();
    } catch (err: any) {
      console.error('Failed to select quotation:', err);
      alert(err.response?.data?.message || 'Error selecting quotation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'var(--text-muted)';
      case 'PUBLISHED': return 'var(--primary-color)';
      case 'CLOSED': return '#f59e0b';
      case 'CANCELLED': return 'var(--error-color)';
      default: return 'var(--text-muted)';
    }
  };

  const tabs = isVendor ? ['All', 'Published', 'Closed', 'Cancelled'] : ['All', 'Draft', 'Published', 'Closed', 'Cancelled'];

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Request for Quotations (RFQs)</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isVendor ? 'View and submit quotations for active invitations' : 'Manage procurement requirements and select suppliers'}
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => navigate('/rfqs/new')}>
            + Create RFQ
          </Button>
        )}
      </header>

      {/* Filters */}
      <section style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <Input 
            label="" 
            placeholder="Search by RFQ title..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
                border: activeTab === tab ? 'none' : '1px solid var(--border-color)',
                color: activeTab === tab ? '#000' : 'var(--text-main)',
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* RFQ List */}
      <section className="dashboard-card" style={{ padding: '0', overflow: 'visible' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading RFQs...</div>
        ) : rfqs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No RFQs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1.5rem', fontWeight: 500 }}>Title</th>
                  <th style={{ padding: '1.5rem', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '1.5rem', fontWeight: 500 }}>Deadline</th>
                  <th style={{ padding: '1.5rem', fontWeight: 500 }}>Status</th>
                  {!isVendor && <th style={{ padding: '1.5rem', fontWeight: 500 }}>Submissions</th>}
                  <th style={{ padding: '1.5rem', fontWeight: 500, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map(rfq => {
                  const statusColor = getStatusColor(rfq.status);
                  const submissionsCount = rfq.quotations?.filter((q: any) => q.status === 'SUBMITTED' || q.status === 'ACCEPTED').length || 0;
                  
                  return (
                    <tr key={rfq.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1.5rem', fontWeight: 500 }}>{rfq.title}</td>
                      <td style={{ padding: '1.5rem' }}>{rfq.category}</td>
                      <td style={{ padding: '1.5rem' }}>{new Date(rfq.deadline).toLocaleDateString()}</td>
                      <td style={{ padding: '1.5rem' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          color: statusColor, 
                          fontWeight: 500,
                          fontSize: '0.875rem' 
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }} />
                          {rfq.status}
                        </span>
                      </td>
                      {!isVendor && (
                        <td style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                          {submissionsCount} received
                        </td>
                      )}
                      <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {isVendor ? (
                            rfq.status === 'PUBLISHED' && (
                              <Button variant="primary" onClick={() => openSubmitQuote(rfq)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                Submit Quotation
                              </Button>
                            )
                          ) : (
                            <>
                              {rfq.status === 'DRAFT' && (
                                <Button variant="primary" onClick={() => handlePublish(rfq.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                  Publish
                                </Button>
                              )}
                              {rfq.status === 'PUBLISHED' && (
                                <>
                                  <Button variant="secondary" onClick={() => openComparison(rfq)} disabled={submissionsCount < 2} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', border: '1px solid var(--border-color)', color: 'var(--text-main)', background: 'transparent' }}>
                                    Compare ({submissionsCount})
                                  </Button>
                                  <Button variant="secondary" onClick={() => handleClose(rfq.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', border: '1px solid var(--error-color)', color: 'var(--error-color)', background: 'transparent' }}>
                                    Close
                                  </Button>
                                </>
                              )}
                              {rfq.status === 'CLOSED' && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>RFQ Closed</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- VENDOR QUOTATION SUBMISSION MODAL --- */}
      {isSubmitQuoteOpen && selectedRfq && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsSubmitQuoteOpen(false)}>
          <div 
            className="glass-card glow-border" 
            style={{ width: '100%', maxWidth: '650px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Submit Quotation: {selectedRfq.title}</h2>
            <form onSubmit={handleQuoteSubmit} className="flex-col" style={{ gap: '1.5rem' }}>
              
              <div className="grid-2-cols">
                <Select 
                  label="Tax Type"
                  options={[
                    { label: 'Intra-State (CGST + SGST)', value: 'GST_INTRA' },
                    { label: 'Inter-State (IGST)', value: 'GST_INTER' }
                  ]}
                  value={taxType}
                  onChange={e => setTaxType(e.target.value)}
                />
                <Input 
                  label="GST Rate (%)"
                  type="number"
                  value={gstRate}
                  onChange={e => setGstRate(Number(e.target.value))}
                />
              </div>

              <div className="grid-2-cols">
                <Input 
                  label="Delivery Days"
                  type="number"
                  value={deliveryDays}
                  onChange={e => setDeliveryDays(Number(e.target.value))}
                />
                <Input 
                  label="Payment Terms"
                  placeholder="e.g. Net 30"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Items Pricing</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Item</th>
                        <th style={{ padding: '0.75rem', width: '100px' }}>Quantity</th>
                        <th style={{ padding: '0.75rem', width: '150px' }}>Unit Price (₹)</th>
                        <th style={{ padding: '0.75rem', width: '120px', textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map(item => (
                        <tr key={item.rfqItemId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem' }}>{item.itemName}</td>
                          <td style={{ padding: '0.75rem' }}>{item.quantity} {item.unit}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <input 
                              type="number" 
                              required
                              min="0"
                              step="0.01"
                              value={item.unitPrice} 
                              onChange={e => handleUnitPriceChange(item.rfqItemId, Number(e.target.value))}
                              style={{ 
                                width: '100%', 
                                background: 'var(--bg-color)', 
                                border: '1px solid var(--border-color)', 
                                color: 'var(--text-main)', 
                                padding: '0.35rem 0.5rem',
                                borderRadius: '0.25rem',
                                outline: 'none'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            ₹{(item.unitPrice * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Box */}
              <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-end', minWidth: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{calculateTotals().subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>GST ({gstRate}%):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{calculateTotals().gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>₹{calculateTotals().grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes / Special Instructions</label>
                <textarea 
                  className="input-field"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Payment preferences, delivery conditions, etc..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={() => setIsSubmitQuoteOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submittingQuote}>
                  {submittingQuote ? 'Submitting...' : 'Submit Quotation'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- COMPARISON MATRIX MODAL --- */}
      {isCompareOpen && selectedRfq && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsCompareOpen(false)}>
          <div 
            className="glass-card glow-border" 
            style={{ width: '95%', maxWidth: '1000px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1.5rem' }}>Comparison Matrix: {selectedRfq.title}</h2>
            
            {loadingComparison ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading comparison matrix...</div>
            ) : !comparisonData || comparisonData.quotations.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No quotations available to compare.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>Metrics / Items</th>
                        {comparisonData.quotations.map((q: any) => (
                          <th key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 600 }}>{q.vendorName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating: {q.vendorRating} ★</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Item unit prices comparison */}
                      {selectedRfq.items.map((rfqItem: any) => (
                        <tr key={rfqItem.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem', fontWeight: 500, borderRight: '1px solid var(--border-color)' }}>
                            {rfqItem.itemName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(x{rfqItem.quantity})</span>
                          </td>
                          {comparisonData.quotations.map((q: any) => {
                            const itemPrice = q.items.find((i: any) => i.rfqItemId === rfqItem.id);
                            return (
                              <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                                ₹{itemPrice ? itemPrice.unitPrice.toLocaleString() : '-'} / unit
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Subtotal */}
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500, borderRight: '1px solid var(--border-color)' }}>Subtotal</td>
                        {comparisonData.quotations.map((q: any) => (
                          <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                            ₹{q.subtotal.toLocaleString()}
                          </td>
                        ))}
                      </tr>

                      {/* Grand Total */}
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, borderRight: '1px solid var(--border-color)' }}>Grand Total</td>
                        {comparisonData.quotations.map((q: any) => (
                          <td key={q.quotationId} style={{ 
                            padding: '1rem', 
                            borderRight: '1px solid var(--border-color)', 
                            fontFamily: 'var(--font-mono)',
                            color: q.isLowestPrice ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: q.isLowestPrice ? 700 : 500
                          }}>
                            ₹{q.grandTotal.toLocaleString()} {q.isLowestPrice && '🟢 (Lowest)'}
                          </td>
                        ))}
                      </tr>

                      {/* Delivery Days */}
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500, borderRight: '1px solid var(--border-color)' }}>Delivery Days</td>
                        {comparisonData.quotations.map((q: any) => (
                          <td key={q.quotationId} style={{ 
                            padding: '1rem', 
                            borderRight: '1px solid var(--border-color)',
                            color: q.isFastestDelivery ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: q.isFastestDelivery ? 700 : 500
                          }}>
                            {q.deliveryDays} days {q.isFastestDelivery && '🟢 (Fastest)'}
                          </td>
                        ))}
                      </tr>

                      {/* Payment Terms */}
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500, borderRight: '1px solid var(--border-color)' }}>Payment Terms</td>
                        {comparisonData.quotations.map((q: any) => (
                          <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>
                            {q.paymentTerms || '-'}
                          </td>
                        ))}
                      </tr>

                      {/* Actions */}
                      <tr>
                        <td style={{ padding: '1rem', borderRight: '1px solid var(--border-color)' }}>Selection</td>
                        {comparisonData.quotations.map((q: any) => (
                          <td key={q.quotationId} style={{ padding: '1rem', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <Button variant="primary" onClick={() => handleSelectQuotation(q.quotationId)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                              Select Quote
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => setIsCompareOpen(false)}>Close Matrix</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
