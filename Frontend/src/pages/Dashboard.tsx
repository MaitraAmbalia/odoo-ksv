import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { AddVendorModal } from '../components/AddVendorModal';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  FileSpreadsheet, 
  CheckSquare, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../utils/api';

interface POData {
  id: string;
  poNumber: string;
  status: string;
  issuedAt: string;
  vendor: {
    companyName: string;
  };
  quotation?: {
    grandTotal: number;
  };
}

interface TrendData {
  month: string;
  spend: number;
  paid: number;
}

export const Dashboard: React.FC = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [summary, setSummary] = useState({
    activeRFQs: 0,
    pendingApprovals: 0,
    posThisMonth: 0,
    overdueInvoices: 0,
    totalSpendThisMonth: 0
  });
  const [recentPOs, setRecentPOs] = useState<POData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isVendor = user?.role === 'VENDOR';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryRes, poRes, trendRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/recent-pos'),
          api.get('/reports/monthly-spend')
        ]);

        if (summaryRes.data?.success) {
          setSummary(summaryRes.data.data);
        }
        if (poRes.data?.success) {
          setRecentPOs(poRes.data.data);
        }
        if (trendRes.data?.success) {
          setTrendData(trendRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const metrics = [
    { value: summary.activeRFQs.toString(), label: isVendor ? "Open RFQ Invites" : "Active RFQ's", icon: FileSpreadsheet },
    { value: summary.pendingApprovals.toString(), label: isVendor ? "Pending Quotations" : "Pending Approvals", icon: CheckSquare },
    { 
      value: `₹${(summary.totalSpendThisMonth || 0).toLocaleString('en-IN')}`, 
      label: isVendor ? "Total Revenue" : "Spend this month", 
      icon: TrendingUp 
    },
    { value: summary.overdueInvoices.toString(), label: 'Overdue Invoices', icon: AlertCircle },
  ];

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {isVendor ? user?.firstName || 'Vendor' : user?.firstName || 'Procurement Officer'} - Today's Overview
        </p>
      </header>

      {/* Analytics Cards */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-card/40 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono tracking-tight">{loading ? '...' : metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Purchase Orders */}
        <Card className="bg-card/40 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO#</TableHead>
                  {!isVendor && <TableHead>Vendor</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isVendor ? 3 : 4} className="h-24 text-center text-muted-foreground">
                      Loading recent orders...
                    </TableCell>
                  </TableRow>
                ) : recentPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isVendor ? 3 : 4} className="h-24 text-center text-muted-foreground">
                      No recent purchase orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono">{po.poNumber}</TableCell>
                      {!isVendor && <TableCell>{po.vendor?.companyName}</TableCell>}
                      <TableCell className="font-mono">
                        ₹{(po.quotation?.grandTotal || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          po.status === 'ISSUED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {po.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Spend Overview */}
        <Card className="bg-card/40 backdrop-blur-sm border-border flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-medium">{isVendor ? "Revenue Trends" : "Spending Trends"} (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center min-h-[220px] pb-6">
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading trend chart...</div>
            ) : trendData.length === 0 ? (
              <div className="text-muted-foreground text-sm">No historical data available</div>
            ) : (
              <div className="w-full h-full min-h-[180px] relative">
                <SpendingTrendChart data={trendData} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {!isVendor && (
        <section className="mt-8 flex gap-4 border-t border-border pt-8">
          <Button variant="secondary" onClick={() => navigate('/rfqs')}>+ New RFQ</Button>
          <Button variant="primary" onClick={() => setIsAddVendorOpen(true)}>Add Vendor</Button>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>View Invoices</Button>
        </section>
      )}

      {/* Modals */}
      <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} />
    </DashboardLayout>
  );
};

// ─────────────────────────────────────────
// CUSTOM RESPONSIVE INTERACTIVE SVG CHART
// ─────────────────────────────────────────
interface SpendingTrendChartProps {
  data: TrendData[];
}

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data }) => {
  const height = 180;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const width = 500;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.spend, 10000)));
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingBottom - (d.spend / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
    : '';

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = height - paddingBottom - (tick / maxVal) * chartHeight;
        return (
          <g key={i}>
            <line 
              x1={paddingLeft} 
              y1={y} 
              x2={width - paddingRight} 
              y2={y} 
              stroke="rgba(255,255,255,0.06)" 
              strokeWidth={1} 
              strokeDasharray="4 4"
            />
            <text 
              x={paddingLeft - 10} 
              y={y + 4} 
              fill="var(--text-muted)" 
              fontSize={10} 
              fontFamily="monospace"
              textAnchor="end"
            >
              {formatCurrency(tick)}
            </text>
          </g>
        );
      })}

      {/* Area under the line */}
      {areaD && <path d={areaD} fill="url(#spendGrad)" />}

      {/* The main trend line */}
      {pathD && (
        <path 
          d={pathD} 
          fill="none" 
          stroke="var(--primary)" 
          strokeWidth={2.5} 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Data points and hover interaction */}
      {points.map((p, i) => (
        <g key={i} className="group cursor-pointer">
          <circle 
            cx={p.x} 
            cy={p.y} 
            r={4} 
            fill="var(--primary)" 
            stroke="var(--card)" 
            strokeWidth={1.5} 
            className="transition-all duration-200 group-hover:r-6"
          />
          {/* Invisible larger circle for easier hover */}
          <circle 
            cx={p.x} 
            cy={p.y} 
            r={12} 
            fill="transparent" 
          />
          {/* Tooltip on hover */}
          <g className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
            <rect 
              x={p.x - 55} 
              y={p.y - 32} 
              width={110} 
              height={22} 
              rx={4} 
              fill="rgba(15, 23, 42, 0.95)" 
              stroke="var(--primary)"
              strokeWidth={1}
            />
            <text 
              x={p.x} 
              y={p.y - 17} 
              fill="white" 
              fontSize={10} 
              fontWeight="bold"
              textAnchor="middle"
            >
              ₹{p.spend.toLocaleString('en-IN')}
            </text>
          </g>
          {/* X axis Label */}
          <text 
            x={p.x} 
            y={height - 8} 
            fill="var(--text-muted)" 
            fontSize={10} 
            textAnchor="middle"
          >
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  );
};
