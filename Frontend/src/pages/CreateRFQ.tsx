import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';

// Mock vendor database
const MOCK_VENDORS = {
  'IT': ['Tech Core LTD', 'Global Tech Solutions', 'CyberNetworks Inc'],
  'Furniture': ['Infra Supplies Pvt ltd', 'Techcore LTD (Furniture Div)'],
  'Logistics': ['FastLog Transport', 'Global Shipping Co'],
};

export const CreateRFQ: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    deadline: '',
    description: '',
  });

  const [lineItems, setLineItems] = useState<{ id: number; item: string; qty: number; unit: string }[]>([]);

  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'category') {
      const categoryVendors = MOCK_VENDORS[value as keyof typeof MOCK_VENDORS] || [];
      setAssignedVendors(categoryVendors);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), item: '', qty: 0, unit: 'NOS' }]);
  };

  const removeVendor = (vendorToRemove: string) => {
    setAssignedVendors(assignedVendors.filter(v => v !== vendorToRemove));
  };

  const handleLineItemChange = (id: number, field: string, value: string | number) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
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
              { label: 'IT', value: 'IT' },
              { label: 'Furniture', value: 'Furniture' },
              { label: 'Logistics', value: 'Logistics' },
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
                <div key={vendor} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: i < assignedVendors.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span>{vendor}</span>
                  <button onClick={() => removeVendor(vendor)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              {assignedVendors.length === 0 && (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No vendors assigned</div>
              )}
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>+ add vendor</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Save & Send to Vendors</Button>
          <Button variant="secondary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Save as Draft</Button>
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
