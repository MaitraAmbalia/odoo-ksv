import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { api } from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

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
    equipmentType: 'Electrical'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        role: 'VENDOR',
        country: 'India',
        phone: formData.phone
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-md border border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Add Vendor</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the details of the new vendor to add them to the system.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          
          <DialogFooter className="pt-4 border-t border-border -mx-4 -mb-4 px-4 bg-muted/30">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
