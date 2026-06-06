import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Label } from '../components/ui/label';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

export const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals');
      setApprovals(res.data.data.data || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const tabs = [
    { label: 'PENDING', count: approvals.filter(a => a.status === 'PENDING').length },
    { label: 'APPROVED', count: approvals.filter(a => a.status === 'APPROVED').length },
    { label: 'REJECTED', count: approvals.filter(a => a.status === 'REJECTED').length }
  ];

  const selectedApproval = approvals.find(a => a.id === selectedApprovalId);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedApprovalId) return;
    if (action === 'reject' && !remarks) {
      setErrorMsg('Remarks are required when rejecting.');
      return;
    }
    
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.post(`/approvals/${selectedApprovalId}/${action}`, { remarks });
      await fetchApprovals();
      setSelectedApprovalId(null);
      setRemarks('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || `Failed to ${action} approval`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and decide on pending quotation selections</p>
      </header>
      
      {errorMsg && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '0.5rem' }}>
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start min-h-[calc(100vh-220px)]">
        {/* Left Panel: Queue */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveTab(tab.label);
                  setSelectedApprovalId(null);
                  setRemarks('');
                  setErrorMsg('');
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  activeTab === tab.label
                    ? 'bg-primary/15 text-primary border-primary/35'
                    : 'bg-card/40 border-border text-muted-foreground hover:bg-card/65'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-border flex-1 max-h-[550px] overflow-y-auto">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approval Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Loading approvals...</div>
              ) : approvals.filter(a => a.status === activeTab).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                  No {activeTab.toLowerCase()} approvals
                </div>
              ) : (
                approvals.filter(a => a.status === activeTab).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setSelectedApprovalId(item.id); setRemarks(''); setErrorMsg(''); }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedApprovalId === item.id 
                        ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/5' 
                        : 'border-border bg-background/40 hover:bg-background/60'
                    }`}
                  >
                    <div className="font-semibold text-sm text-foreground flex items-center justify-between gap-2">
                      <span className="truncate">{item.rfq?.title || 'Unknown RFQ'}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Vendor: {item.quotation?.vendor?.companyName || 'Unknown Vendor'}</div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span>Amount: ₹{item.quotation?.grandTotal?.toLocaleString('en-IN') || 0}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Detail */}
        <div className="w-full lg:w-[60%] h-full">
          <Card className="bg-card/40 backdrop-blur-sm border-border min-h-[500px]">
            {!selectedApproval ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground text-sm gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                Select an approval request to view details
              </div>
            ) : (
              <div>
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl font-semibold">{selectedApproval.rfq?.title || 'Unknown RFQ'}</CardTitle>
                      <CardDescription className="mt-1">Submitted on {new Date(selectedApproval.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${
                      selectedApproval.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' :
                      selectedApproval.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' :
                      'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                    }`}>
                      {selectedApproval.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Summary Grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Selected Vendor</div>
                      <div className="text-base font-bold text-foreground mt-1">{selectedApproval.quotation?.vendor?.companyName || 'N/A'}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Grand Total</div>
                      <div className="text-base font-bold text-primary mt-1">₹{selectedApproval.quotation?.grandTotal?.toLocaleString('en-IN') || 0}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Delivery Estimate</div>
                      <div className="text-base font-bold text-foreground mt-1">{selectedApproval.quotation?.deliveryDays} Days</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Payment Terms</div>
                      <div className="text-base font-bold text-foreground mt-1">{selectedApproval.quotation?.paymentTerms || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Comparisons */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Quotation Metrics</h3>
                    <div className="rounded-md border border-border bg-background/30 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>{selectedApproval.quotation?.vendor?.companyName || 'Vendor'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Price Comparison</TableCell>
                            <TableCell className="text-emerald-500 font-semibold">₹{selectedApproval.quotation?.grandTotal?.toLocaleString('en-IN') || 0}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Delivery Speed</TableCell>
                            <TableCell>{selectedApproval.quotation?.deliveryDays} days</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Tax Details</TableCell>
                            <TableCell>{selectedApproval.quotation?.taxType || 'GST'} ({selectedApproval.quotation?.gstRate || 0}%)</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Remarks show for approved/rejected */}
                  {selectedApproval.remarks && selectedApproval.status !== 'PENDING' && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">Decision Remarks</div>
                      <div className="p-4 bg-background/60 border border-border rounded-lg text-sm text-muted-foreground italic">
                        "{selectedApproval.remarks}"
                      </div>
                    </div>
                  )}

                  {/* Action Section */}
                  {selectedApproval.status === 'PENDING' && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="remarks" className="text-sm font-medium text-muted-foreground">Decision Remarks (Required for Rejection)</Label>
                        <textarea 
                          id="remarks"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Optional comments for approval or rejection..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button 
                          variant="secondary" 
                          onClick={() => handleAction('reject')}
                          disabled={actionLoading}
                          className="text-destructive border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 gap-1"
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                        <Button 
                          variant="primary" 
                          onClick={() => handleAction('approve')}
                          disabled={actionLoading}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" /> Approve Selection
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
