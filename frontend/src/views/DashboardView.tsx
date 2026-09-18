import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Row, Col, Card, Alert, Tag, Table, Progress, Spin, Button } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Building,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface DashboardProps {
  projectId?: string;
  onNavigate?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ projectId, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const url = projectId ? `/analytics/dashboard?projectId=${projectId}` : '/analytics/dashboard';
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [projectId]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="Loading Procurement Intelligence..." />
      </div>
    );
  }

  const { kpis, spendByCategory, spendByVendor, budgetVsActual, vendorRadarData, cycleTimeData, maverickSpendSummary } = data;

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Real-time Alerts Banner */}
      {kpis.nonCompliantVendorsCount > 0 && (
        <Alert
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <strong>Vendor Compliance Action Required:</strong> {kpis.nonCompliantVendorsCount} vendor(s) have expired GST registrations or licenses due for renewal. Avoid ₹10-50L penalty risk.
              </span>
              <Button size="small" type="primary" danger onClick={() => onNavigate && onNavigate('vendors')}>
                Inspect Vendors
              </Button>
            </div>
          }
          type="error"
          showIcon
          icon={<AlertTriangle size={18} />}
          style={{ borderRadius: 10, border: '1px solid #fecaca' }}
        />
      )}

      {/* Top 5 KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={5}>
          <div className="stat-card primary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>TOTAL COMMITTED SPEND</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>
                  {formatCurrency(kpis.totalSpend)}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <IndianRupee size={20} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpRight size={14} /> Active PO commitments
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <div className="stat-card warning">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>PENDING APPROVALS</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>
                  {kpis.pendingApprovalsCount}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Clock size={20} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 10 }}>
              {kpis.pendingApprovalsCount > 0 ? 'Urgent indents awaiting signoff' : 'All indents cleared'}
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <div className="stat-card success">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>PORTFOLIO BUDGET BURN</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>
                  {kpis.overallBudgetUtilization}%
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Progress percent={kpis.overallBudgetUtilization} size="small" status={kpis.overallBudgetUtilization > 85 ? 'exception' : 'active'} />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <div className="stat-card danger">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>MAVERICK SPEND LEAKAGE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 6 }}>
                  {formatCurrency(kpis.maverickSpendTotal)}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <TrendingDown size={20} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 10 }}>
              {kpis.maverickPct}% of total spend (Target &lt; 5%)
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={4}>
          <div className="stat-card primary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>COMPLIANCE SCORE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', marginTop: 6 }}>
                  99.2%
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <ShieldCheck size={20} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 10 }}>
              GST & TDS Automated
            </div>
          </div>
        </Col>
      </Row>

      {/* Row 2: Charts - Spend by Category & Budget vs Actual */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={<span style={{ fontWeight: 700 }}>Procurement Spend by Material Category</span>} extra={<Tag color="blue">Donut Analysis</Tag>}>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {spendByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Project Budget vs. Actual Procurement Spend</span>}
            extra={<Tag color="warning">80% Threshold Alert</Tag>}
          >
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActual} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="projectCode" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 10000000).toFixed(1)}Cr`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="actualSpend" name="Committed Spend (₹)" stackId="a" fill="#0284c7" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="remainingBudget" name="Remaining Budget (₹)" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Vendor Scorecard Radar & Procurement Funnel Cycle Times */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Composite Vendor Performance Radar</span>}
            extra={<Tag color="purple">5-Dimension Matrix</Tag>}
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={vendorRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#475569' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar name="Portfolio Average" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Procurement Cycle Times & Bottleneck Tracker</span>}
            extra={<Tag color="cyan">PO-to-Delivery Pipeline</Tag>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cycleTimeData.map((stage: any, idx: number) => {
                const isBottleneck = stage.status === 'bottleneck';
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: isBottleneck ? '#fef2f2' : '#f8fafc',
                      border: isBottleneck ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isBottleneck ? '#991b1b' : '#1e293b' }}>
                        {stage.stage}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Target SLA: {stage.targetDays} day(s)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isBottleneck ? '#ef4444' : '#0284c7' }}>
                          {stage.averageDays} days
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>Current Average</div>
                      </div>
                      <Tag color={isBottleneck ? 'error' : stage.status === 'warning' ? 'warning' : 'success'}>
                        {isBottleneck ? 'BOTTLENECK' : stage.status === 'warning' ? 'SLIGHT LAG' : 'ON TRACK'}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Maverick Spend Exception Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={18} color="#ef4444" />
            <span style={{ fontWeight: 700 }}>Maverick Spending Exception Log (Off-Contract Purchases)</span>
          </div>
        }
        extra={
          <Tag color="red" style={{ fontWeight: 700 }}>
            Total Leakage: {formatCurrency(maverickSpendSummary.totalAmount)}
          </Tag>
        }
      >
        <Table
          dataSource={maverickSpendSummary.orders || []}
          rowKey="poNumber"
          pagination={false}
          columns={[
            {
              title: 'PO Number',
              dataIndex: 'poNumber',
              key: 'poNumber',
              render: (t: string) => <strong style={{ color: '#0284c7' }}>{t}</strong>,
            },
            {
              title: 'Vendor',
              dataIndex: 'vendor',
              key: 'vendor',
            },
            {
              title: 'Leakage Amount',
              dataIndex: 'amount',
              key: 'amount',
              render: (v: number) => (
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{formatCurrency(v)}</span>
              ),
            },
            {
              title: 'Exception Reason / Notes',
              dataIndex: 'notes',
              key: 'notes',
              render: (txt: string) => <span style={{ color: '#64748b', fontSize: 12 }}>{txt || 'Off-contract bypass'}</span>,
            },
            {
              title: 'Audit Action',
              key: 'action',
              render: () => (
                <Tag color="volcano">Audit Flagged</Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
