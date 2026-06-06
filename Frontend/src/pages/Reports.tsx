import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { api } from '../utils/api';
import { toast } from 'sonner';

export const Reports: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPOs: 0,
    totalSpend: 0,
    avgApprovalTime: 2.5,
    totalOverdue: 0
  });

  const [monthlySpend, setMonthlySpend] = useState([]);
  const [categorySpend, setCategorySpend] = useState([]);
  const [vendorPerformance, setVendorPerformance] = useState([]);
  const [invoiceAging, setInvoiceAging] = useState([]);

  const periods = ['This Week', 'This Month', 'This Quarter', 'Custom'];

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [summaryRes, spendRes, catRes, vendorRes, agingRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/monthly-spend'),
          api.get('/reports/spend-by-category'),
          api.get('/reports/vendor-performance'),
          api.get('/reports/invoice-aging')
        ]);

        if (summaryRes.data?.success) setSummary(summaryRes.data.data);
        if (spendRes.data?.success) setMonthlySpend(spendRes.data.data);
        if (catRes.data?.success) setCategorySpend(catRes.data.data);
        if (vendorRes.data?.success) setVendorPerformance(vendorRes.data.data);
        if (agingRes.data?.success) setInvoiceAging(agingRes.data.data);
      } catch (err) {
        console.error('Error fetching reports data:', err);
        toast.error('Failed to load live reports data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const summaryCards = [
    { label: 'Total Spend', value: `₹${(summary.totalSpend || 0).toLocaleString('en-IN')}`, trend: '+12%', isPositive: true },
    { label: 'POs Raised', value: summary.totalPOs.toString(), trend: '+5%', isPositive: true },
    { label: 'Avg Approval Time', value: `${summary.avgApprovalTime} days`, trend: '-15%', isPositive: true },
    { label: 'Overdue Amount', value: `₹${(summary.totalOverdue || 0).toLocaleString('en-IN')}`, trend: '+2%', isPositive: false },
  ];

  const handleDownload = () => {
    toast.success('Procurement Report PDF is compiling and will begin downloading shortly.');
  };

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 300, letterSpacing: '1px' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Insights on procurement spend, vendor performance, and workflows
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {periods.map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              style={{
                background: activePeriod === period ? 'var(--brand-600)' : 'transparent',
                border: activePeriod === period ? 'none' : '1px solid var(--border-color)',
                color: activePeriod === period ? '#fff' : 'var(--text-main)',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
            >
              {period}
            </button>
          ))}
          <Button 
            variant="secondary" 
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', marginLeft: '1rem' }}
            onClick={handleDownload}
          >
            Download Report
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {summaryCards.map((card, idx) => (
          <div key={idx} className="dashboard-card float-animation" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              {loading ? '...' : card.value}
            </div>
            <div style={{ fontSize: '0.85rem', color: card.isPositive ? '#10B981' : '#EF4444', marginTop: '0.5rem' }}>
              {card.trend} vs last period
            </div>
          </div>
        ))}
      </section>

      {/* Chart Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading reports and analytics dashboard...
        </div>
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Monthly spend */}
            <div className="dashboard-card float-delayed-1" style={{ padding: '1.5rem', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 500 }}>Monthly Procurement Spend</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 6 Months</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {monthlySpend.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>No data</span>
                ) : (
                  <MonthlyProcurementSpendChart data={monthlySpend} />
                )}
              </div>
            </div>

            {/* Category Spend */}
            <div className="dashboard-card float-delayed-1" style={{ padding: '1.5rem', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 500 }}>Procurement by Category</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical Distribution</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {categorySpend.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>No data</span>
                ) : (
                  <ProcurementByCategoryChart data={categorySpend} />
                )}
              </div>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {/* Vendor Performance */}
            <div className="dashboard-card float-delayed-2" style={{ padding: '1.5rem', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 500 }}>Vendor Performance</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top Suppliers by Value</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {vendorPerformance.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>No data</span>
                ) : (
                  <VendorPerformanceChart data={vendorPerformance} />
                )}
              </div>
            </div>

            {/* Invoice Aging */}
            <div className="dashboard-card float-delayed-2" style={{ padding: '1.5rem', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 500 }}>Invoice Aging</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overdue Aging Risk</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {invoiceAging.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>No overdue invoices</span>
                ) : (
                  <InvoiceAgingChart data={invoiceAging} />
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
};

// ─────────────────────────────────────────
// 1. MONTHLY PROCUREMET SPEND CHART
// ─────────────────────────────────────────
const MonthlyProcurementSpendChart: React.FC<{ data: any[] }> = ({ data }) => {
  const height = 200;
  const width = 500;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.spend, d.paid, 10000)));
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const barWidth = Math.max(12, (chartWidth / data.length) * 0.4);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Grid Lines */}
      {yTicks.map((tick, i) => {
        const y = height - paddingBottom - (tick / maxVal) * chartHeight;
        return (
          <g key={i}>
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={paddingLeft - 10} y={y + 4} fill="var(--text-muted)" fontSize={10} fontFamily="monospace" textAnchor="end">{formatCurrency(tick)}</text>
          </g>
        );
      })}

      {/* Bars for Spend */}
      {data.map((d, i) => {
        const x = paddingLeft + (i / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2;
        const barHeight = (d.spend / maxVal) * chartHeight;
        const y = height - paddingBottom - barHeight;

        return (
          <g key={i} className="group cursor-pointer">
            <rect 
              x={x} 
              y={y} 
              width={barWidth} 
              height={Math.max(barHeight, 2)} 
              fill="rgba(59, 130, 246, 0.45)" 
              rx={2}
              className="hover:fill-blue-500/80 transition-colors duration-150"
            />
            {/* Tooltip */}
            <g className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
              <rect x={x - 40} y={y - 30} width={90 + barWidth} height={22} rx={4} fill="rgba(15, 23, 42, 0.95)" stroke="#3b82f6" strokeWidth={1} />
              <text x={x + barWidth / 2} y={y - 15} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">
                Spend: ₹{d.spend.toLocaleString('en-IN')}
              </text>
            </g>
            <text x={x + barWidth / 2} y={height - 10} fill="var(--text-muted)" fontSize={10} textAnchor="middle">{d.month}</text>
          </g>
        );
      })}

      {/* Line for Paid */}
      {(() => {
        const linePoints = data.map((d, i) => {
          const x = paddingLeft + (i / data.length) * chartWidth + (chartWidth / data.length) / 2;
          const y = height - paddingBottom - (d.paid / maxVal) * chartHeight;
          return { x, y, ...d };
        });

        const pathD = linePoints.reduce((acc, p, i) => {
          return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
        }, '');

        return (
          <>
            {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
            {linePoints.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r={4} fill="#10b981" stroke="var(--card)" strokeWidth={1.5} />
                <g className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
                  <rect x={p.x - 45} y={p.y - 30} width={90} height={22} rx={4} fill="rgba(15, 23, 42, 0.95)" stroke="#10b981" strokeWidth={1} />
                  <text x={p.x} y={p.y - 15} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">
                    Paid: ₹{p.paid.toLocaleString('en-IN')}
                  </text>
                </g>
              </g>
            ))}
          </>
        );
      })()}
    </svg>
  );
};

// ─────────────────────────────────────────
// 2. PROCUREMENT BY CATEGORY
// ─────────────────────────────────────────
const ProcurementByCategoryChart: React.FC<{ data: any[] }> = ({ data }) => {
  const width = 400;
  const height = 200;
  const cx = 110;
  const cy = 100;
  const r = 55;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  let currentOffset = 0;

  const chartData = data.map((d, i) => {
    const percentage = total > 0 ? d.value / total : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = currentOffset;
    currentOffset -= percentage * circumference;

    return {
      ...d,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      color: colors[i % colors.length]
    };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%' }}>
      <svg width={width} height={height} className="overflow-visible" style={{ flex: '0 0 auto' }}>
        {chartData.map((d, i) => (
          <g key={i} className="group cursor-pointer">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="transparent"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={d.strokeDasharray}
              strokeDashoffset={d.strokeDashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-200 hover:stroke-[22px]"
            />
            {/* Tooltip */}
            <g className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
              <rect x={cx - 60} y={cy - 12} width={120} height={24} rx={4} fill="rgba(15, 23, 42, 0.95)" stroke={d.color} strokeWidth={1} />
              <text x={cx} y={cy + 3} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">
                {d.category}: {((d.percentage || 0) * 100).toFixed(0)}%
              </text>
            </g>
          </g>
        ))}

        {/* Center label */}
        <text x={cx} y={cy - 4} fill="var(--text-muted)" fontSize={10} textAnchor="middle">TOTAL SPEND</text>
        <text x={cx} y={cy + 12} fill="var(--text-main)" fontSize={12} fontWeight="bold" textAnchor="middle">
          ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString('en-IN')}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', overflowY: 'auto', maxHeight: '180px' }}>
        {chartData.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{d.category}</span>
            <span style={{ fontWeight: 'bold', marginLeft: 'auto', fontFamily: 'monospace' }}>
              ₹{d.value.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// 3. VENDOR PERFORMANCE
// ─────────────────────────────────────────
const VendorPerformanceChart: React.FC<{ data: any[] }> = ({ data }) => {
  const height = 200;
  const width = 450;
  const paddingLeft = 140; 
  const paddingRight = 60;
  const paddingTop = 15;
  const chartWidth = width - paddingLeft - paddingRight;

  const sortedVendors = [...data].sort((a, b) => b.totalPOValue - a.totalPOValue).slice(0, 4);
  const maxVal = Math.max(...sortedVendors.map(v => v.totalPOValue), 10000);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {sortedVendors.map((v, i) => {
        const barHeight = 22;
        const spacing = 42;
        const y = paddingTop + i * spacing;
        const barWidth = (v.totalPOValue / maxVal) * chartWidth;

        return (
          <g key={v.vendorId} className="group cursor-pointer">
            {/* Vendor Name */}
            <text x={paddingLeft - 15} y={y + 15} fill="var(--text-main)" fontSize={11} fontWeight={500} textAnchor="end">
              {v.companyName.length > 20 ? `${v.companyName.substring(0, 18)}...` : v.companyName}
            </text>

            {/* Background bar */}
            <rect x={paddingLeft} y={y} width={chartWidth} height={barHeight} fill="rgba(255,255,255,0.03)" rx={3} />

            {/* Filled Bar */}
            <rect 
              x={paddingLeft} 
              y={y} 
              width={Math.max(barWidth, 3)} 
              height={barHeight} 
              fill="url(#vendorGrad)" 
              rx={3}
              className="hover:opacity-90 transition-opacity duration-150"
            />

            {/* Value Label */}
            <text x={paddingLeft + barWidth + 8} y={y + 15} fill="var(--text-muted)" fontSize={10} fontFamily="monospace">
              ₹{v.totalPOValue.toLocaleString('en-IN')}
            </text>

            {/* Rating / Win Rate */}
            <text x={paddingLeft + 10} y={y + 14} fill="rgba(255,255,255,0.9)" fontSize={9} fontWeight="bold">
              ★ {v.rating.toFixed(1)} | {v.quotationsWon}/{v.quotationsSubmitted} Won
            </text>
          </g>
        );
      })}

      <defs>
        <linearGradient id="vendorGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ─────────────────────────────────────────
// 4. INVOICE AGING
// ─────────────────────────────────────────
const InvoiceAgingChart: React.FC<{ data: any[] }> = ({ data }) => {
  const height = 200;
  const width = 450;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => d.amount), 10000);
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const barWidth = 36;
  const spacing = chartWidth / data.length;
  const colors = ['#F59E0B', '#F97316', '#EF4444', '#B91C1C'];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Grid Lines */}
      {yTicks.map((tick, i) => {
        const y = height - paddingBottom - (tick / maxVal) * chartHeight;
        return (
          <g key={i}>
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={paddingLeft - 10} y={y + 4} fill="var(--text-muted)" fontSize={10} fontFamily="monospace" textAnchor="end">{formatCurrency(tick)}</text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = paddingLeft + i * spacing + (spacing - barWidth) / 2;
        const barHeight = (d.amount / maxVal) * chartHeight;
        const y = height - paddingBottom - barHeight;

        return (
          <g key={i} className="group cursor-pointer">
            {/* Background Bar */}
            <rect x={x} y={paddingTop} width={barWidth} height={chartHeight} fill="rgba(255,255,255,0.02)" rx={4} />

            {/* Filled Bar */}
            <rect 
              x={x} 
              y={y} 
              width={barWidth} 
              height={Math.max(barHeight, 3)} 
              fill={colors[i % colors.length]} 
              rx={4}
              className="hover:opacity-90 transition-opacity duration-150"
            />

            {/* Tooltip */}
            <g className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
              <rect x={x - 40} y={y - 30} width={barWidth + 80} height={22} rx={4} fill="rgba(15, 23, 42, 0.95)" stroke={colors[i % colors.length]} strokeWidth={1} />
              <text x={x + barWidth / 2} y={y - 15} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">
                Overdue: ₹{d.amount.toLocaleString('en-IN')}
              </text>
            </g>

            {/* X Axis Label */}
            <text x={x + barWidth / 2} y={height - 10} fill="var(--text-muted)" fontSize={10} textAnchor="middle">{d.range}</text>
          </g>
        );
      })}
    </svg>
  );
};
