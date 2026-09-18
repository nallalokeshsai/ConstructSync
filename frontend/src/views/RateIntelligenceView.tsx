import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  Rate,
  Alert,
  message,
} from 'antd';
import {
  TrendingUp,
  Plus,
  Award,
  Clock,
  Sparkles,
  DollarSign,
  Building,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const RateIntelligenceView: React.FC = () => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [bestQuote, setBestQuote] = useState<any | null>(null);
  const [historicalRates, setHistoricalRates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [materialFilter, setMaterialFilter] = useState<string>('Steel');
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState<boolean>(false);
  const [vendors, setVendors] = useState<any[]>([]);

  const [form] = Form.useForm();

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rates/compare?category=${materialFilter}`);
      setQuotes(res.data.quotes);
      setBestQuote(res.data.bestQuote);
      setHistoricalRates(res.data.historicalRates);

      const vRes = await api.get('/vendors');
      setVendors(vRes.data.vendors);
    } catch (err) {
      console.error('Failed to load rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [materialFilter]);

  const handleAddQuoteSubmit = async (values: any) => {
    try {
      await api.post('/rates/quotes', values);
      message.success('Vendor quotation recorded in intelligence database!');
      setIsAddQuoteOpen(false);
      form.resetFields();
      fetchRates();
    } catch (err) {
      message.error('Failed to record quote');
    }
  };

  // Format historical trend data for line chart
  const trendData = historicalRates.map((h) => ({
    date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    rate: h.unitRate,
    vendor: h.vendor,
    po: h.poNumber,
  }));

  const columns = [
    {
      title: 'Vendor',
      key: 'vendor',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
            {r.vendor?.companyName}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.vendor?.city}</div>
        </div>
      ),
    },
    {
      title: 'Material & Spec',
      key: 'material',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.materialName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.notes || 'Standard BIS spec'}</div>
        </div>
      ),
    },
    {
      title: 'Quoted Rate',
      key: 'rate',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0284c7' }}>
            ₹{r.unitRate.toLocaleString()} / {r.unit}
          </div>
        </div>
      ),
    },
    {
      title: 'Lead Time & MOQ',
      key: 'leadTime',
      render: (_: any, r: any) => (
        <div style={{ fontSize: 12 }}>
          <div>Lead Time: <strong>{r.leadTimeDays ? `${r.leadTimeDays} days` : 'Immediate'}</strong></div>
          <div style={{ color: '#64748b' }}>MOQ: {r.minimumOrderQuantity || 'None'} {r.unit}</div>
        </div>
      ),
    },
    {
      title: 'Reliability Rating',
      key: 'rating',
      render: (_: any, r: any) => (
        <div>
          <Rate disabled allowHalf defaultValue={r.vendor?.performanceScore} style={{ fontSize: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 700 }}>
            {r.vendor?.performanceScore.toFixed(1)} / 5.0
          </div>
        </div>
      ),
    },
    {
      title: 'Recommendation',
      key: 'rec',
      render: (_: any, r: any) => {
        if (bestQuote && bestQuote.id === r.id) {
          return (
            <Tag color="success" icon={<Sparkles size={12} />} style={{ fontWeight: 700 }}>
              BEST VALUE PICK
            </Tag>
          );
        }
        return <Tag color="default">Alternate Quote</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Material Category Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>
            Procurement Rate Intelligence & Quote Comparison
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Side-by-side vendor pricing analysis with composite algorithm (60% Price + 40% Reliability Score)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Select
            value={materialFilter}
            onChange={(val) => setMaterialFilter(val)}
            style={{ width: 180 }}
            options={[
              { label: 'Steel (TMT / Rebar)', value: 'Steel' },
              { label: 'Cement (OPC / PPC)', value: 'Cement' },
              { label: 'Electrical & Cables', value: 'Electrical' },
              { label: 'Plumbing & Pipes', value: 'Plumbing' },
            ]}
          />

          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsAddQuoteOpen(true)}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            Log Vendor Quote
          </Button>
        </div>
      </div>

      {/* Best Recommendation Highlight Card */}
      {bestQuote && (
        <Alert
          type="success"
          showIcon
          icon={<Award size={24} />}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>
                Recommended Best Value Selection: {bestQuote.vendor?.companyName}
              </span>
              <Tag color="green" style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px' }}>
                ₹{bestQuote.unitRate.toLocaleString()} / {bestQuote.unit}
              </Tag>
            </div>
          }
          description={`Selected based on competitive unit pricing combined with high vendor compliance and a ${bestQuote.vendor?.performanceScore} reliability rating. Dispatch lead time: ${bestQuote.leadTimeDays || 3} days.`}
          style={{ borderRadius: 10, border: '1px solid #bbf7d0' }}
        />
      )}

      {/* Side-by-Side Quotes Comparison Table */}
      <Table dataSource={quotes} columns={columns} rowKey="id" loading={loading} pagination={false} />

      {/* Historical Price Trend Chart */}
      <Card
        title={
          <span style={{ fontWeight: 700 }}>Historical PO Unit Rate Trends ({materialFilter})</span>
        }
        extra={<Tag color="blue">Contract Rate History</Tag>}
      >
        <div style={{ height: 260 }}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="PO Unit Rate (₹)"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0284c7' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
              Insufficient PO transaction data for {materialFilter}
            </div>
          )}
        </div>
      </Card>

      {/* Log Quote Modal */}
      <Modal
        title="Record New Vendor Quotation"
        open={isAddQuoteOpen}
        onCancel={() => setIsAddQuoteOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddQuoteSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="vendorId" label="Vendor" rules={[{ required: true }]}>
              <Select
                placeholder="Select Vendor"
                options={vendors.map((v) => ({ label: v.companyName, value: v.id }))}
              />
            </Form.Item>

            <Form.Item name="materialCategory" label="Category" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'Steel', value: 'Steel' },
                  { label: 'Cement', value: 'Cement' },
                  { label: 'Electrical', value: 'Electrical' },
                  { label: 'Plumbing', value: 'Plumbing' },
                  { label: 'Sand', value: 'Sand' },
                  { label: 'Tiles', value: 'Tiles' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="materialName" label="Material Description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Fe550D TMT Rebar (16mm)" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="unitRate" label="Unit Rate (₹)" rules={[{ required: true }]}>
              <Input type="number" placeholder="62500" />
            </Form.Item>

            <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'MT', value: 'MT' },
                  { label: 'Bags', value: 'bags' },
                  { label: 'Meters', value: 'meter' },
                  { label: 'Pieces', value: 'pieces' },
                ]}
              />
            </Form.Item>

            <Form.Item name="leadTimeDays" label="Lead Time (Days)">
              <Input type="number" placeholder="3" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Quotation Specification / Terms">
            <Input placeholder="e.g. Primary producer, test certificate included, 15 days validity" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsAddQuoteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              Save Quotation
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
