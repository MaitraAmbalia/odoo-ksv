import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AddVendorModal } from '../components/AddVendorModal';
import api from '../utils/api';

export const Vendors: React.FC = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors');
      setVendors(res.data.data.data || res.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const toggleActionMenu = (id: string) => {
    setOpenActionMenuId(openActionMenuId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'var(--success-color)';
      case 'PENDING': return 'var(--warning-color)';
      case 'BLOCKED': return '#ff4d4f';
      default: return 'var(--text-muted)';
    }
  };

  // Filter vendors based on active tab and search query
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = 
      v.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTab = 
      activeTab === 'All' || 
      v.status === activeTab.toUpperCase();
      
    return matchesSearch && matchesTab;
  });

  const tabs = [
    { label: 'All', count: vendors.length },
    { label: 'Active', count: vendors.filter(v => v.status === 'ACTIVE').length },
    { label: 'Pending', count: vendors.filter(v => v.status === 'PENDING').length },
    { label: 'Blocked', count: vendors.filter(v => v.status === 'BLOCKED').length }
  ];

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Vendors</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Manage supplier profiles and registrations
          </p>
        </div>
        <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={() => setIsAddVendorOpen(true)}>
          + Add Vendor
        </Button>
      </header>

      {/* Search Bar */}
      <section className="dashboard-card float-animation" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <Input 
          label=""
          placeholder="Search bar ...... search by name, gst number, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none' }}
        />
      </section>

      {/* Tabs */}
      <section style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
              fontWeight: 500
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </section>

      {/* Vendors Table */}
      <section className="dashboard-card float-delayed-1" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Vendor Name</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>GST no.</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Contact no.</th>
                <th style={{ padding: '1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '1.5rem', fontWeight: 500, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading vendors...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1.5rem' }}>{row.companyName}</td>
                    <td style={{ padding: '1.5rem' }}>{row.category}</td>
                    <td style={{ padding: '1.5rem' }}>{row.gstNumber}</td>
                    <td style={{ padding: '1.5rem' }}>{row.contactPhone}</td>
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
                        View
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
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}>View Profile</button>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}>Change Status</button>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%' }}>Request Quotation</button>
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

      {/* Modals */}
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} onVendorAdded={fetchVendors} />
    </DashboardLayout>
  );
};
