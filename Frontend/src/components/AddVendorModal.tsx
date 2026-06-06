import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    orgName: '',
    email: '',
    phone: '',
    equipmentType: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Vendor Added:', formData);
    onClose();
    // Here you would typically make an API call
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="glass-card glow-border" 
        style={{ width: '100%', maxWidth: '500px', margin: '2rem' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Add Vendor</h2>
        
        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1rem' }}>
          <Input 
            label="Vendor Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="John Doe"
            required
          />
          <Input 
            label="Organization Name" 
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
          <Select 
            label="Equipment Type" 
            name="equipmentType" 
            value={formData.equipmentType} 
            onChange={handleChange}
            options={[
              { label: 'Electrical', value: 'electrical' },
              { label: 'Mechanical', value: 'mechanical' },
              { label: 'IT & Software', value: 'it' },
              { label: 'Office Supplies', value: 'office' },
              { label: 'Other', value: 'other' }
            ]}
            required
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Add Vendor</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
