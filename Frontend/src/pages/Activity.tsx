import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Input } from '../components/Input';

export const Activity: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

  const entities = ['All', 'RFQ', 'Vendor', 'Quotation', 'Approval', 'PO', 'Invoice'];

  const activities: any[] = [];

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
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Date:</span>
          <input 
            type="date"
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
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            No recent activity found.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '1rem' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: '1.45rem', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {activities.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                  {/* Icon */}
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: log.bgColor || 'rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '4px solid var(--surface-color)',
                    marginLeft: '-0.5rem'
                  }}>
                    {log.icon || '•'}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                      {log.date} — {log.time}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{log.user}</strong> {log.actionText}
                      </div>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--brand-600)', cursor: 'pointer', fontSize: '0.9rem' }}>
                        View Detail →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};
