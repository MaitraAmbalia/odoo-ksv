import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';

import api from '../utils/api';

export const Activity: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const entities = ['All', 'RFQ', 'VENDOR', 'QUOTATION', 'APPROVAL', 'PO', 'INVOICE', 'GRN'];

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (entityFilter !== 'All') params.entityType = entityFilter;
      const res = await api.get('/activity-logs', { params });
      setActivities(res.data.data.data || res.data.data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [entityFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('PUBLISHED') || action.includes('APPROVED') || action.includes('SUBMITTED')) return '#10B981';
    if (action.includes('REJECTED') || action.includes('CANCELLED') || action.includes('BLOCKED')) return '#EF4444';
    if (action.includes('CREATED') || action.includes('REGISTERED')) return '#3B82F6';
    if (action.includes('STATUS')) return '#F59E0B';
    return '#8B5CF6';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('PUBLISHED') || action.includes('APPROVED')) return '✓';
    if (action.includes('REJECTED') || action.includes('CANCELLED')) return '✕';
    if (action.includes('CREATED') || action.includes('REGISTERED')) return '+';
    if (action.includes('SUBMITTED')) return '↑';
    if (action.includes('STATUS')) return '⇄';
    return '•';
  };

  // Filter activities
  const filteredActivities = activities.filter(log => {
    const userName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.toLowerCase();
    const action = (log.action || '').toLowerCase();
    const matchesSearch = userName.includes(searchQuery.toLowerCase()) || action.includes(searchQuery.toLowerCase());

    const matchesDate = !dateFilter || log.createdAt?.startsWith(dateFilter);

    return matchesSearch && matchesDate;
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
      <section className="dashboard-card float-animation" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input 
            placeholder="Search action or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', color: 'var(--text-main)', fontSize: '0.9rem', padding: '0.5rem 0' }}
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
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
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
            Loading activity logs...
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
              {filteredActivities.map((log, idx) => {
                const actionColor = getActionColor(log.action);
                const date = new Date(log.createdAt);
                return (
                  <div key={log.id || idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    {/* Icon */}
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: `${actionColor}20`, 
                      color: actionColor,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '4px solid var(--surface-color)',
                      marginLeft: '-0.5rem',
                      fontWeight: 700,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {getActionIcon(log.action)}
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                        {date.toLocaleDateString()} — {date.toLocaleTimeString()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {log.user?.firstName} {log.user?.lastName}
                          </strong>{' '}
                          <span style={{ color: 'var(--text-muted)' }}>{log.action?.replace(/_/g, ' ').toLowerCase()}</span>
                          <span style={{ 
                            marginLeft: '0.5rem', 
                            fontSize: '0.75rem', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '2rem', 
                            background: `${actionColor}15`, 
                            color: actionColor,
                            border: `1px solid ${actionColor}30`
                          }}>
                            {log.entityType}
                          </span>
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
