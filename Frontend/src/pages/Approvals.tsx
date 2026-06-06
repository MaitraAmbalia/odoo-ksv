import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import api from '../utils/api';

export const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals');
      setApprovals(res.data.data.data || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const tabs = [
    { label: 'PENDING', count: approvals.filter(a => a.status === 'PENDING').length },
    { label: 'APPROVED', count: approvals.filter(a => a.status === 'APPROVED').length },
    { label: 'REJECTED', count: approvals.filter(a => a.status === 'REJECTED').length }
  ];

  const selectedApproval = approvals.find(a => a.id === selectedApprovalId);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedApprovalId) return;
    if (action === 'reject' && !remarks) {
      setErrorMsg('Remarks are required when rejecting.');
      return;
    }
    
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.post(`/approvals/${selectedApprovalId}/${action}`, { remarks });
      await fetchApprovals();
      setSelectedApprovalId(null);
      setRemarks('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || `Failed to ${action} approval`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Approvals</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Review and decide on pending quotation selections
          </p>
        </div>
      </header>
      
      {errorMsg && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '0.5rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
        {/* Left Panel: Queue */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => { setActiveTab(tab.label); setSelectedApprovalId(null); setRemarks(''); setErrorMsg(''); }}
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

          <section className="dashboard-card float-animation" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : approvals.filter(a => a.status === activeTab).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No {activeTab.toLowerCase()} approvals.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {approvals.filter(a => a.status === activeTab).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setSelectedApprovalId(item.id); setRemarks(''); setErrorMsg(''); }}
                    style={{ 
                      padding: '1rem', 
                      border: `1px solid ${selectedApprovalId === item.id ? 'var(--text-main)' : 'var(--border-color)'}`, 
                      borderRadius: '0.5rem', 
                      cursor: 'pointer',
                      background: selectedApprovalId === item.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>[{item.status}] {item.rfq?.title || 'Unknown RFQ'}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vendor: {item.quotation?.vendor?.companyName || 'Unknown Vendor'}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount: ₹{item.quotation?.grandTotal || 0} • {new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Panel: Detail */}
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
          <section className="dashboard-card float-delayed-1" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
            {!selectedApproval ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select an approval request to view details
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '1rem' }}>Approval for: {selectedApproval.rfq?.title}</h2>
                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selected Vendor</div>
                    <div style={{ fontWeight: 500 }}>{selectedApproval.quotation?.vendor?.companyName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Grand Total</div>
                    <div style={{ fontWeight: 500 }}>₹{selectedApproval.quotation?.grandTotal}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Delivery</div>
                    <div style={{ fontWeight: 500 }}>{selectedApproval.quotation?.deliveryDays} days</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Payment Terms</div>
                    <div style={{ fontWeight: 500 }}>{selectedApproval.quotation?.paymentTerms || 'N/A'}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Quotation Summary</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <th style={{ padding: '0.75rem', fontWeight: 500 }}>Metric</th>
                      <th style={{ padding: '0.75rem', fontWeight: 500 }}>{selectedApproval.quotation?.vendor?.companyName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>Price</td>
                      <td style={{ padding: '0.75rem', color: '#10B981' }}>₹{selectedApproval.quotation?.grandTotal}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>Delivery</td>
                      <td style={{ padding: '0.75rem' }}>{selectedApproval.quotation?.deliveryDays} days</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>Tax Type</td>
                      <td style={{ padding: '0.75rem' }}>{selectedApproval.quotation?.taxType} ({selectedApproval.quotation?.gstRate}%)</td>
                    </tr>
                  </tbody>
                </table>

                {selectedApproval.remarks && activeTab !== 'PENDING' && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Remarks:</div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', fontStyle: 'italic' }}>
                      {selectedApproval.remarks}
                    </div>
                  </div>
                )}

                {activeTab === 'PENDING' && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Approval Remarks (Required for Rejection):</div>
                    <textarea 
                      placeholder="Add your remarks..." 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '1rem', 
                        background: 'transparent', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '0.5rem',
                        color: 'var(--text-main)',
                        minHeight: '100px',
                        outline: 'none',
                        marginBottom: '1rem'
                      }} 
                    />
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => handleAction('reject')} disabled={actionLoading} style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444' }}>
                        {actionLoading ? '...' : '✗ Reject'}
                      </Button>
                      <Button variant="primary" onClick={() => handleAction('approve')} disabled={actionLoading} style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }}>
                        {actionLoading ? '...' : '✓ Approve →'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};
