import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2, Plus, UploadCloud, X } from 'lucide-react';

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
      const filtered = allVendors.filter(v => v.category?.toLowerCase() === value.toLowerCase() && v.status === 'ACTIVE');
      setAvailableVendors(filtered);
      setAssignedVendors([]); 
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), item: '', qty: 1, unit: 'NOS' }]);
  };

  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter(item => item.id !== id));
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
      
      if (!isDraft && res.data.data.status === 'DRAFT') {
         await api.post(`/rfqs/${res.data.data.id}/publish`);
      }
      
      setSuccessMsg(isDraft ? 'RFQ Saved as Draft successfully!' : 'RFQ Published and sent to vendors successfully!');
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
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Create RFQ</h1>
        <p className="text-muted-foreground mt-1">Submit a new Request for Quotation to vendors</p>
      </header>

      {/* Stepper */}
      <div className="flex items-center mb-10 w-full max-w-[800px] gap-2">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
        <div className="flex-1 h-0.5 bg-primary"></div>
        <div className="w-8 h-8 rounded-full border border-border bg-card text-muted-foreground flex items-center justify-center font-bold text-sm">2</div>
        <div className="flex-1 h-0.5 bg-border"></div>
        <div className="w-8 h-8 rounded-full border border-border bg-card text-muted-foreground flex items-center justify-center font-bold text-sm">3</div>
      </div>
      
      {successMsg && (
        <div className="p-4 mb-6 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-center">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-md text-center">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Left Column - Details */}
        <Card className="bg-card/40 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">RFQ Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              label="RFQ Title *" 
              name="title" 
              placeholder="e.g. Office Laptops Procurement"
              value={formData.title} 
              onChange={handleChange} 
              required
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
              required
            />

            <Input 
              label="Deadline *" 
              name="deadline" 
              type="date"
              value={formData.deadline} 
              onChange={handleChange} 
              required
            />

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description</Label>
              <textarea 
                id="description"
                name="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
                placeholder="Provide details about specs, shipping, terms..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Items and Vendors */}
        <div className="space-y-8">
          {/* Line Items Card */}
          <Card className="bg-card/40 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">Line Items</CardTitle>
              <Button variant="secondary" onClick={addLineItem} className="h-8 px-3 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border bg-background/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Unit</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input 
                            type="text" 
                            value={item.item} 
                            onChange={(e) => handleLineItemChange(item.id, 'item', e.target.value)} 
                            className="bg-transparent border-0 focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground w-full outline-none" 
                            placeholder="Item name" 
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="number" 
                            value={item.qty} 
                            onChange={(e) => handleLineItemChange(item.id, 'qty', parseInt(e.target.value) || 0)} 
                            className="bg-transparent border-0 focus:ring-0 text-sm text-foreground w-full outline-none" 
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="text" 
                            value={item.unit} 
                            onChange={(e) => handleLineItemChange(item.id, 'unit', e.target.value)} 
                            className="bg-transparent border-0 focus:ring-0 text-sm text-foreground w-full outline-none" 
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="secondary" 
                            onClick={() => removeLineItem(item.id)} 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 bg-transparent hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lineItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No line items added yet. Click "+ Add Item".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Vendors Card */}
          <Card className="bg-card/40 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">Assigned Vendors</CardTitle>
              {availableVendors.length > 0 && (
                <select 
                  onChange={(e) => { addVendor(e.target.value); e.target.value = ""; }}
                  className="bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground outline-none cursor-pointer max-w-[180px]"
                >
                  <option value="">+ Add Vendor...</option>
                  {availableVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName}</option>
                  ))}
                </select>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assignedVendors.map((vendor) => (
                  <div key={vendor.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/50 text-sm">
                    <span className="font-medium">{vendor.name}</span>
                    <Button 
                      variant="secondary" 
                      onClick={() => removeVendor(vendor.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground bg-transparent hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {assignedVendors.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {formData.category ? 'No vendors assigned. Choose from "+ Add Vendor" dropdown.' : 'Select a category to view and assign vendors.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attachments & Action Buttons */}
      <div className="mt-8 pt-8 border-t border-border grid gap-8 md:grid-cols-2">
        {/* Attachments */}
        <Card className="bg-card/40 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-primary/5 transition-colors cursor-pointer group">
              <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
              <p className="text-sm text-muted-foreground">
                Drag & drop files or <span className="text-primary font-semibold">click to upload</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, Excel, Doc up to 10MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col justify-end gap-3 max-w-[320px] ml-auto w-full">
          <Button variant="primary" className="w-full" onClick={() => handleSubmit(false)} disabled={loading}>
            {loading ? 'Processing...' : 'Save & Send to Vendors'}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => handleSubmit(true)} disabled={loading}>
            Save as Draft
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
