import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import api from '../utils/api';

export const CreateRFQ: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    deadline: '',
    description: '',
  });

  const [lineItems, setLineItems] = useState<{ id: number; item: string; qty: number; unit: string }[]>([]);
  const [assignedVendors, setAssignedVendors] = useState<{ id: string; name: string }[]>([]);
  
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [availableVendors, setAvailableVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Fetch vendors to use for assignment
    const fetchVendors = async () => {
      try {
        const res = await api.get('/vendors');
        const vendors = res.data.data.data || res.data.data || [];
        setAllVendors(vendors);
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      }
    };
    fetchVendors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'category') {
      // Filter vendors by selected category
      const filtered = allVendors.filter(v => v.category?.toLowerCase() === value.toLowerCase() && v.status === 'ACTIVE');
      setAvailableVendors(filtered);
      setAssignedVendors([]); // reset assigned on category change
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), item: '', qty: 0, unit: 'NOS' }]);
  };

  const removeVendor = (vendorIdToRemove: string) => {
    setAssignedVendors(assignedVendors.filter(v => v.id !== vendorIdToRemove));
  };
  
  const addVendor = (vendorId: string) => {
    if (!vendorId) return;
    const vendor = allVendors.find(v => v.id === vendorId);
    if (vendor && !assignedVendors.some(v => v.id === vendorId)) {
      setAssignedVendors([...assignedVendors, { id: vendor.id, name: vendor.companyName }]);
    }
  };

  const handleLineItemChange = (id: number, field: string, value: string | number) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (isDraft: boolean) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        deadline: formData.deadline,
        description: formData.description,
        status: isDraft ? 'DRAFT' : 'PUBLISHED',
        items: lineItems.map(li => ({
          itemName: li.item,
          quantity: Number(li.qty),
          unit: li.unit
        })),
        vendorIds: assignedVendors.map(v => v.id)
      };

      const res = await api.post('/rfqs', payload);
      
      // If it's not a draft and the backend requires explicitly publishing it (depends on how backend handles status in create)
      if (!isDraft && res.data.data.status === 'DRAFT') {
         await api.post(`/rfqs/${res.data.data.id}/publish`);
      }
      
      setSuccessMsg(isDraft ? 'RFQ Saved as Draft successfully!' : 'RFQ Published and sent to vendors successfully!');
      
      // Reset form on success
      setFormData({ title: '', category: '', deadline: '', description: '' });
      setLineItems([]);
      setAssignedVendors([]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Create RFQ's</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>new request for quotation</p>
      </header>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem', width: '100%', maxWidth: '800px' }}>
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--primary-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--primary-color)' }}></div>
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '1px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '1px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
      </div>
      
      {successMsg && (
        <div style={{ padding: '1rem', marginBottom: '2rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', color: '#10B981', borderRadius: '0.5rem' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '1rem', marginBottom: '2rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '0.5rem' }}>
          {errorMsg}
        </div>
      )}

      <div className="grid-2-cols" style={{ alignItems: 'start', gap: '4rem' }}>
        {/* Left Column */}
        <div className="flex-col" style={{ gap: '1.5rem' }}>
          <Input 
            label="RFQ's title*" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            style={{ background: 'transparent' }}
          />
          <Select 
            label="Category" 
            name="category" 
            value={formData.category} 
            onChange={handleChange}
            options={[
              { label: 'Select category...', value: '' },
              { label: 'Electrical', value: 'Electrical' },
              { label: 'Mechanical', value: 'Mechanical' },
              { label: 'IT & Software', value: 'IT' },
              { label: 'Office Supplies', value: 'Office' },
              { label: 'Other', value: 'Other' }
            ]}
          />
          <Input 
            label="Deadline*" 
            name="deadline" 
            type="date"
            value={formData.deadline} 
            onChange={handleChange} 
            style={{ background: 'transparent' }}
          />
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea 
              name="description"
              className="input-field" 
              rows={4}
              value={formData.description}
              onChange={handleChange}
              style={{ resize: 'vertical', background: 'transparent' }}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-col" style={{ gap: '2.5rem' }}>
          
          {/* Line Items */}
          <div>
            <label className="input-label">Line items</label>
            <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 400 }}>item</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 400 }}>qty</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 400 }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <input type="text" value={item.item} onChange={(e) => handleLineItemChange(item.id, 'item', e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none' }} placeholder="Item name" />
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <input type="number" value={item.qty} onChange={(e) => handleLineItemChange(item.id, 'qty', parseInt(e.target.value))} style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <input type="text" value={item.unit} onChange={(e) => handleLineItemChange(item.id, 'unit', e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="secondary" onClick={addLineItem} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.875rem', padding: '0.25rem 1rem' }}>+ add line item</Button>
          </div>

          {/* Assign Vendors */}
          <div>
            <label className="input-label" style={{ textTransform: 'uppercase' }}>ASSIGN VENDORS</label>
            <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
              {assignedVendors.map((vendor, i) => (
                <div key={vendor.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: i < assignedVendors.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span>{vendor.name}</span>
                  <button onClick={() => removeVendor(vendor.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              {assignedVendors.length === 0 && (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No vendors assigned</div>
              )}
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                <select 
                  onChange={(e) => { addVendor(e.target.value); e.target.value = ""; }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none', width: '100%' }}
                >
                  <option value="">+ add vendor...</option>
                  {availableVendors.map(v => (
                    <option key={v.id} value={v.id} style={{ background: 'var(--surface-color)' }}>{v.companyName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={loading} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            {loading ? 'Processing...' : 'Save & Send to Vendors'}
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={loading} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            Save as Draft
          </Button>
        </div>
        
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <label className="input-label">Attachments</label>
          <div style={{ 
            border: '1px dashed var(--border-color)', 
            borderRadius: '0.5rem', 
            padding: '2rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--text-muted)',
            background: 'transparent'
          }}>
            Drag & drop files or click to upload
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

