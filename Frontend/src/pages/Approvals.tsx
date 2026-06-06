import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const tabs = [
    { label: 'Pending', count: 0 },
    { label: 'Approved', count: 0 },
    { label: 'Rejected', count: 0 }
  ];

  const approvals: any[] = [];
  const selectedApproval = approvals.find(a => a.id === selectedApprovalId);

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

      <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
        {/* Left Panel: Queue */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
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

          <section className="dashboard-card float-animation" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            {approvals.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No {activeTab.toLowerCase()} approvals.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {approvals.filter(a => a.status === activeTab).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedApprovalId(item.id)}
                    style={{ 
                      padding: '1rem', 
                      border: `1px solid ${selectedApprovalId === item.id ? 'var(--text-main)' : 'var(--border-color)'}`, 
                      borderRadius: '0.5rem', 
                      cursor: 'pointer',
                      background: selectedApprovalId === item.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>[{item.status.toUpperCase()}] {item.rfqTitle}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vendor: {item.vendorName}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount: ₹{item.amount} • {item.timeAgo}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Submitted by: {item.submittedBy}</div>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '1rem' }}>Approval for: {selectedApproval.rfqTitle}</h2>
                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selected Vendor</div>
                    <div style={{ fontWeight: 500 }}>{selectedApproval.vendorName} ★★★</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Grand Total</div>
                    <div style={{ fontWeight: 500 }}>₹{selectedApproval.amount}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Delivery</div>
                    <div style={{ fontWeight: 500 }}>{selectedApproval.deliveryDays} days</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Payment Terms</div>
                    <div style={{ fontWeight: 500 }}>{selectedApproval.paymentTerms}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Quotation Summary (vs alternatives)</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <th style={{ padding: '0.75rem', fontWeight: 500 }}>Metric</th>
                      <th style={{ padding: '0.75rem', fontWeight: 500 }}>{selectedApproval.vendorName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>Price</td>
                      <td style={{ padding: '0.75rem', color: '#10B981' }}>₹{selectedApproval.amount} 🟢 Lowest</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>Delivery</td>
                      <td style={{ padding: '0.75rem' }}>{selectedApproval.deliveryDays} days</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>Rating</td>
                      <td style={{ padding: '0.75rem' }}>★★★</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Why this was selected:</div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', fontStyle: 'italic' }}>
                    {selectedApproval.officerNote || 'No notes provided by the procurement officer.'}
                  </div>
                </div>

                {activeTab === 'Pending' && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Approval Remarks:</div>
                    <textarea 
                      placeholder="Add your remarks..." 
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
                      <Button variant="secondary" style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444' }}>
                        ✗ Reject
                      </Button>
                      <Button variant="primary" style={{ background: 'var(--brand-600)', color: '#fff', border: 'none' }}>
                        ✓ Approve →
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
