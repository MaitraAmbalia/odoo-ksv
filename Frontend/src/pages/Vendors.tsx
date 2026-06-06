import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { AddVendorModal } from '../components/AddVendorModal';
import api from '../utils/api';

export const Vendors: React.FC = () => {
  const navigate = useNavigate();
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Profile modal state
  const [profileVendor, setProfileVendor] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Status change loading
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const canChangeStatus = user?.role === 'ADMIN' || user?.role === 'MANAGER';

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

  // Close action menu on outside click
  useEffect(() => {
    const handleClick = () => setOpenActionMenuId(null);
    if (openActionMenuId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openActionMenuId]);

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

  // === ACTION HANDLERS ===

  const handleViewProfile = async (vendorId: string) => {
    setOpenActionMenuId(null);
    setProfileLoading(true);
    try {
      const res = await api.get(`/vendors/${vendorId}`);
      setProfileVendor(res.data.data);
    } catch (err) {
      console.error('Failed to load vendor profile:', err);
      alert('Failed to load vendor profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Custom Confirm Modal state
  const [confirmStatusVendor, setConfirmStatusVendor] = useState<any | null>(null);

  const handleChangeStatusClick = (vendor: any) => {
    setOpenActionMenuId(null);
    setConfirmStatusVendor(vendor);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmStatusVendor) return;
    const vendor = confirmStatusVendor;
    const newStatus = vendor.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    setConfirmStatusVendor(null);
    setStatusLoading(vendor.id);
    try {
      await api.patch(`/vendors/${vendor.id}/status`, { status: newStatus });
      await fetchVendors();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to change status';
      alert(msg);
    } finally {
      setStatusLoading(null);
    }
  };

  const handleRequestQuotation = (vendor: any) => {
    setOpenActionMenuId(null);
    navigate('/rfqs', { state: { preselectedVendor: vendor } });
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
      <section className="dashboard-card float-animation" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
        <input 
          placeholder="Search by name, GST number, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', color: 'var(--text-main)', fontSize: '0.9rem', padding: '0.5rem 0' }}
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
                      {statusLoading === row.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>updating...</span>}
                    </td>
                    <td style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                      <Button 
                        variant="secondary" 
                        style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        onClick={(e) => { e.stopPropagation(); toggleActionMenu(row.id); }}
                      >
                        Action ▾
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
                          }}
                        >
                          <button 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleViewProfile(row.id)}
                          >
                            👤 View Profile
                          </button>
                          {canChangeStatus && (
                            <button 
                              style={{ background: 'transparent', border: 'none', color: row.status === 'ACTIVE' ? '#ff4d4f' : '#10B981', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              onClick={() => handleChangeStatusClick(row)}
                            >
                              {row.status === 'ACTIVE' ? '🚫 Block Vendor' : '✅ Activate Vendor'}
                            </button>
                          )}
                          <button 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', width: '100%', borderRadius: '0.25rem' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleRequestQuotation(row)}
                          >
                            📋 Request Quotation
                          </button>
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

      {/* View Profile Modal */}
      {(profileVendor || profileLoading) && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}
          onClick={() => setProfileVendor(null)}
        >
          <div 
            style={{
              background: 'var(--surface-color)', border: '1px solid var(--border-color)',
              borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '500px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {profileLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading profile...</div>
            ) : profileVendor ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{profileVendor.companyName}</h2>
                  <button 
                    onClick={() => setProfileVendor(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                  >✕</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Category', value: profileVendor.category },
                    { label: 'GST Number', value: profileVendor.gstNumber },
                    { label: 'Phone', value: profileVendor.contactPhone },
                    { label: 'Status', value: profileVendor.status },
                    { label: 'Rating', value: profileVendor.rating ? `${profileVendor.rating}/5` : 'Not rated' },
                    { label: 'Email', value: profileVendor.user?.email || 'N/A' },
                    { label: 'Contact Person', value: profileVendor.user ? `${profileVendor.user.firstName} ${profileVendor.user.lastName}` : 'N/A' },
                    { label: 'Registered', value: new Date(profileVendor.createdAt).toLocaleDateString() },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {profileVendor.address && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Address</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{profileVendor.address}</div>
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={() => setProfileVendor(null)}>
                    Close
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Custom Confirm Status Change Modal */}
      {confirmStatusVendor && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}
          onClick={() => setConfirmStatusVendor(null)}
        >
          <div 
            style={{
              background: 'var(--surface-color)', border: '1px solid var(--border-color)',
              borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Confirm Status Change</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Are you sure you want to change the status of <strong>{confirmStatusVendor.companyName}</strong> to{' '}
              <span style={{ color: confirmStatusVendor.status === 'ACTIVE' ? '#ff4d4f' : '#10B981', fontWeight: 600 }}>
                {confirmStatusVendor.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'}
              </span>?
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button 
                variant="secondary" 
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.5rem 1.5rem' }} 
                onClick={() => setConfirmStatusVendor(null)}
              >
                Cancel
              </Button>
              <Button 
                style={{ 
                  background: confirmStatusVendor.status === 'ACTIVE' ? '#ff4d4f' : '#10B981', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '0.5rem 1.5rem',
                  boxShadow: `0 0 15px ${confirmStatusVendor.status === 'ACTIVE' ? 'rgba(255,77,79,0.3)' : 'rgba(16,185,129,0.3)'}` 
                }} 
                onClick={handleConfirmStatusChange}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} onVendorAdded={fetchVendors} />
    </DashboardLayout>
  );
};
