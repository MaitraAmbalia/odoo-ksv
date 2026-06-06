import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import api from '../utils/api';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded?: () => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose, onVendorAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    orgName: '',
    email: '',
    phone: '',
    gstNumber: '',
    currentStatus: 'PENDING',
    equipmentType: 'electrical'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Register User (Role: VENDOR)
      const registerRes = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: 'Password123!', // default password for vendor
        role: 'VENDOR'
      });
      
      const userId = registerRes.data.data.user.id;
      
      // 2. Create Vendor Profile
      await api.post('/vendors', {
        userId,
        companyName: formData.orgName,
        category: formData.equipmentType,
        gstNumber: formData.gstNumber,
        contactPhone: formData.phone,
        status: formData.currentStatus,
        address: ''
      });
      
      if (onVendorAdded) onVendorAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="glass-card glow-border" 
        style={{ width: '100%', maxWidth: '500px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Add Vendor</h2>
        
        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ff4d4f', borderRadius: '4px', background: 'rgba(255, 77, 79, 0.1)' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem' }}>
          <div className="grid-2-cols">
            <Input 
              label="First Name" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange} 
              placeholder="John"
              required
            />
            <Input 
              label="Last Name" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange} 
              placeholder="Doe"
              required
            />
          </div>
          <Input 
            label="Organization/Company Name" 
            name="orgName" 
            value={formData.orgName} 
            onChange={handleChange} 
            placeholder="Tech Corp Inc."
            required
          />
          <div className="grid-2-cols">
            <Input 
              label="Email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="john@techcorp.com"
              required
            />
            <Input 
              label="Phone Number" 
              name="phone" 
              type="tel" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="+1 234 567 8900"
              required
            />
          </div>
          <div className="grid-2-cols">
            <Input 
              label="GST Number" 
              name="gstNumber" 
              value={formData.gstNumber} 
              onChange={handleChange} 
              placeholder="e.g. 27AABCS1429B1Z0"
              required
            />
            <Select 
              label="Initial Status" 
              name="currentStatus" 
              value={formData.currentStatus} 
              onChange={handleChange}
              options={[
                { label: 'Pending', value: 'PENDING' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Blocked', value: 'BLOCKED' }
              ]}
              required
            />
          </div>
          <Select 
            label="Category (Equipment Type)" 
            name="equipmentType" 
            value={formData.equipmentType} 
            onChange={handleChange}
            options={[
              { label: 'Electrical', value: 'Electrical' },
              { label: 'Mechanical', value: 'Mechanical' },
              { label: 'IT & Software', value: 'IT' },
              { label: 'Office Supplies', value: 'Office' },
              { label: 'Other', value: 'Other' }
            ]}
            required
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
