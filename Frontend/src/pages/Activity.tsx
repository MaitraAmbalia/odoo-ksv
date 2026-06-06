import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Input } from '../components/Input';
import api from '../utils/api';

export const Activity: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const entities = ['All', 'RFQ', 'VENDOR', 'QUOTATION', 'APPROVAL', 'PO', 'INVOICE', 'GRN'];

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity-logs');
      setActivities(res.data.data.data || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getEntityStyle = (entityType: string) => {
    switch (entityType) {
      case 'RFQ': return { icon: '📝', bgColor: 'rgba(59, 130, 246, 0.15)' };
      case 'VENDOR': return { icon: '🏢', bgColor: 'rgba(16, 185, 129, 0.15)' };
      case 'QUOTATION': return { icon: '💰', bgColor: 'rgba(245, 158, 11, 0.15)' };
      case 'APPROVAL': return { icon: '⚖️', bgColor: 'rgba(139, 92, 246, 0.15)' };
      case 'PO': return { icon: '📦', bgColor: 'rgba(99, 102, 241, 0.15)' };
      case 'INVOICE': return { icon: '💳', bgColor: 'rgba(236, 72, 153, 0.15)' };
      case 'GRN': return { icon: '🚚', bgColor: 'rgba(20, 184, 166, 0.15)' };
      default: return { icon: '•', bgColor: 'rgba(255,255,255,0.05)' };
    }
  };

  const getActionText = (action: string, meta: any) => {
    const details = meta ? ` (${Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(', ')})` : '';
    switch (action) {
      case 'VENDOR_REGISTERED': return 'registered as a vendor' + details;
      case 'VENDOR_STATUS_CHANGED': return 'updated vendor profile status' + details;
      case 'VENDOR_DOC_UPLOADED': return 'uploaded vendor verification document';
      case 'RFQ_CREATED': return 'created RFQ draft' + details;
      case 'RFQ_PUBLISHED': return 'published RFQ' + details;
      case 'RFQ_AMENDED': return 'amended RFQ details';
      case 'RFQ_CLOSED': return 'closed RFQ';
      case 'RFQ_CANCELLED': return 'cancelled RFQ';
      case 'QUOTATION_SUBMITTED': return 'submitted pricing quotation';
      case 'QUOTATION_WITHDRAWN': return 'withdrew pricing quotation';
      case 'QUOTATION_SUPERSEDED': return 'updated quotation with newer pricing';
      case 'QUOTATION_SELECTED': return 'selected quotation for manager approval' + details;
      case 'APPROVAL_CREATED': return 'raised manager approval request';
      case 'APPROVAL_APPROVED': return 'approved quotation selection' + details;
      case 'APPROVAL_REJECTED': return 'rejected quotation selection' + details;
      case 'PO_ISSUED': return 'issued Purchase Order' + details;
      case 'PO_STATUS_CHANGED': return 'updated Purchase Order status' + details;
      case 'PO_CANCELLED': return 'cancelled Purchase Order';
      case 'GRN_SUBMITTED': return 'submitted Goods Receipt Note' + details;
      case 'GRN_VERIFIED': return 'verified Goods Receipt Note';
      case 'INVOICE_GENERATED': return 'generated Invoice' + details;
      case 'INVOICE_SENT': return 'sent Invoice via email';
      case 'INVOICE_PAID': return 'marked Invoice as PAID';
      case 'INVOICE_OVERDUE': return 'marked Invoice as OVERDUE';
      case 'INVOICE_CANCELLED': return 'cancelled Invoice';
      default: return `performed action ${action}`;
    }
  };

  const filteredActivities = activities.filter(log => {
    const matchesEntity = entityFilter === 'All' || log.entityType === entityFilter;
    const matchesDate = !dateFilter || new Date(log.createdAt).toISOString().split('T')[0] === dateFilter;
    
    const query = searchQuery.toLowerCase();
    const userFullName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.toLowerCase();
    const matchesSearch = 
      userFullName.includes(query) ||
      log.user?.email.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query);

    return matchesEntity && matchesDate && matchesSearch;
  });

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Activity Logs</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Audit trail of all system actions and events
          </p>
        </div>
      </header>

      {/* Filters Row */}
      <section className="dashboard-card float-animation" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <Input 
            label=""
            placeholder="Search action or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Entity:</span>
          <select 
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ 
              background: 'var(--surface-color)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              outline: 'none'
            }}
          >
            {entities.map(e => <option key={e} value={e}>{e === 'VENDOR' ? 'Vendor' : e}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Date:</span>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ 
              background: 'var(--surface-color)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              outline: 'none'
            }}
          />
        </div>
      </section>

      {/* Timeline List */}
      <section className="dashboard-card float-delayed-1" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            Loading audit trails...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            No recent activity found.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '1rem' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: '1.45rem', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {filteredActivities.map((log) => {
                const style = getEntityStyle(log.entityType);
                const dateObj = new Date(log.createdAt);
                return (
                  <div key={log.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    {/* Icon */}
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: style.bgColor, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '4px solid var(--surface-color)',
                      marginLeft: '-0.5rem',
                      fontSize: '1.1rem'
                    }}>
                      {style.icon}
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                        {dateObj.toLocaleDateString()} — {dateObj.toLocaleTimeString()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                          </strong>{' '}
                          {getActionText(log.action, log.meta)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};
