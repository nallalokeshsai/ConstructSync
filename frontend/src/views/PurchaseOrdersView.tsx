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
  Space,
  message,
  Divider,
} from 'antd';
import {
  FileCheck2,
  Plus,
  Printer,
  FileText,
  Flame,
  CheckCircle,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface POViewProps {
  projectId?: string;
  prefillIndent?: any;
  onClearPrefill?: () => void;
  onNavigateToGRN?: (po: any) => void;
}

export const PurchaseOrdersView: React.FC<POViewProps> = ({
  projectId,
  prefillIndent,
  onClearPrefill,
  onNavigateToGRN,
}) => {
  const { user } = useAuth();
  const [pos, setPos] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);
  const [printablePO, setPrintablePO] = useState<any | null>(null);

  const [form] = Form.useForm();

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const url = projectId ? `/purchase-orders?projectId=${projectId}` : '/purchase-orders';
      const res = await api.get(url);
      setPos(res.data.purchaseOrders);

      const vRes = await api.get('/vendors');
      setVendors(vRes.data.vendors);

      const pRes = await api.get('/projects');
      setProjects(pRes.data.projects);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [projectId]);

  // Handle prefill if triggered from approved indent
  useEffect(() => {
    if (prefillIndent) {
      setIsGenerateOpen(true);
      form.setFieldsValue({
        indentId: prefillIndent.id,
        projectId: prefillIndent.projectId,
        paymentTerms: '30 Days Net from GRN Date',
        items: prefillIndent.items.map((it: any) => ({
          materialName: it.materialName,
          quantity: it.quantity,
          unit: it.unit,
          unitRate: it.estimatedRate || 0,
          gstPercentage: 18,
        })),
      });
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillIndent]);

  const handleGenerateSubmit = async (values: any) => {
    try {
      await api.post('/purchase-orders', values);
      message.success('Purchase Order generated successfully!');
      setIsGenerateOpen(false);
      form.resetFields();
      fetchPOs();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to create PO');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: 'PO Number',
      key: 'poNumber',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0284c7', fontSize: 13 }}>{r.poNumber}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {new Date(r.createdAt).toLocaleDateString()}
          </div>
          {r.isMaverick && (
            <Tag color="error" icon={<Flame size={11} />} style={{ fontSize: 10, marginTop: 2 }}>
              MAVERICK SPEND
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Vendor',
      key: 'vendor',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.vendor?.companyName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.vendor?.category} • GST: {r.vendor?.gstin || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Project',
      dataIndex: ['project', 'projectName'],
      key: 'project',
      render: (name: string, r: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.project?.projectCode}</div>
        </div>
      ),
    },
    {
      title: 'Grand Total (incl. GST)',
      key: 'total',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
            ₹{r.grandTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            Base: ₹{r.totalAmount.toLocaleString()} + GST: ₹{r.gstAmount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          draft: 'default',
          sent: 'blue',
          acknowledged: 'cyan',
          delivered: 'green',
          closed: 'purple',
          cancelled: 'error',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Printer size={13} />}
            onClick={() => setPrintablePO(r)}
          >
            Print / PDF
          </Button>
          {r.status !== 'delivered' && r.status !== 'closed' && (
            <Button
              size="small"
              type="primary"
              onClick={() => onNavigateToGRN && onNavigateToGRN(r)}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              Record GRN
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>
            Purchase Orders (POs) Management
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Itemized rate controls, automated GST taxation, and formal PDF generation
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            form.resetFields();
            setIsGenerateOpen(true);
          }}
          style={{ background: '#0284c7', borderColor: '#0284c7' }}
        >
          Create Purchase Order
        </Button>
      </div>

      {/* PO Table */}
      <Table dataSource={pos} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      {/* Create / Generate PO Modal */}
      <Modal
        title="Generate Purchase Order"
        open={isGenerateOpen}
        onCancel={() => setIsGenerateOpen(false)}
        footer={null}
        width={750}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateSubmit}
          initialValues={{
            paymentTerms: '30 Days Net from GRN Date',
            items: [{ materialName: '', quantity: 1, unit: 'MT', unitRate: 0, gstPercentage: 18 }],
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="vendorId" label="Empaneled Vendor" rules={[{ required: true }]}>
              <Select
                placeholder="Select Vendor"
                options={vendors.map((v) => ({
                  label: `${v.companyName} (${v.category}) - ${v.complianceStatus}`,
                  value: v.id,
                }))}
              />
            </Form.Item>

            <Form.Item name="projectId" label="Construction Project" rules={[{ required: true }]}>
              <Select
                placeholder="Select Project"
                options={projects.map((p) => ({
                  label: `${p.projectName} (${p.projectCode})`,
                  value: p.id,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="deliveryDate" label="Target Delivery Date">
              <Input type="date" />
            </Form.Item>

            <Form.Item name="paymentTerms" label="Payment Terms">
              <Select
                options={[
                  { label: '30 Days Net from GRN Date', value: '30 Days Net from GRN Date' },
                  { label: '15 Days Net', value: '15 Days Net' },
                  { label: '50% Advance, 50% on Delivery', value: '50% Advance, 50% on Delivery' },
                  { label: 'Immediate Cheque on Delivery', value: 'Immediate Cheque on Delivery' },
                ]}
              />
            </Form.Item>

            <Form.Item name="indentId" label="Requisition Indent ID (Optional)">
              <Input placeholder="Leave blank for Direct PO" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Special Delivery Instructions / Unloading Gate">
            <Input placeholder="e.g. Unload at Gate 2 tower crane zone; test certificate required" />
          </Form.Item>

          {/* Line items */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PO Line Items</div>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                        gap: 8,
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'materialName']}
                        rules={[{ required: true }]}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="Item description" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true }]} style={{ margin: 0 }}>
                        <Input type="number" placeholder="Qty" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'unit']} style={{ margin: 0 }}>
                        <Select
                          options={[
                            { label: 'MT', value: 'MT' },
                            { label: 'Bags', value: 'bags' },
                            { label: 'cum', value: 'cum' },
                            { label: 'Meters', value: 'meters' },
                            { label: 'Pieces', value: 'pieces' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'unitRate']} rules={[{ required: true }]} style={{ margin: 0 }}>
                        <Input type="number" placeholder="Rate (₹)" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'gstPercentage']} style={{ margin: 0 }}>
                        <Select
                          options={[
                            { label: '18% GST', value: 18 },
                            { label: '28% GST', value: 28 },
                            { label: '12% GST', value: 12 },
                            { label: '5% GST', value: 5 },
                          ]}
                        />
                      </Form.Item>

                      {fields.length > 1 && (
                        <Button type="text" danger onClick={() => remove(name)}>
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<Plus size={14} />}>
                    Add PO Line Item
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              Release Purchase Order
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Branded Printable PO Modal */}
      <Modal
        open={Boolean(printablePO)}
        onCancel={() => setPrintablePO(null)}
        footer={[
          <Button key="close" onClick={() => setPrintablePO(null)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<Printer size={14} />}
            onClick={handlePrint}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            Print Purchase Order (PDF)
          </Button>,
        ]}
        width={780}
      >
        {printablePO && (
          <div
            id="printable-po"
            style={{
              padding: 24,
              background: '#ffffff',
              color: '#0f172a',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {/* Branded Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #0284c7',
                paddingBottom: 16,
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                  NIST INFRA DEVELOPERS PVT LTD
                </h1>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Corporate Office: Level 9, Tower C, Prestige Tech Cloud, Bengaluru 560066
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  GSTIN: 29AAACN8899K1ZT • CIN: U45200KA2018PTC112233
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0284c7' }}>PURCHASE ORDER</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{printablePO.poNumber}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Date: {new Date(printablePO.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Vendor & Project Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '20px 0' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                  VENDOR DETAILS
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 4 }}>
                  {printablePO.vendor?.companyName}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  GSTIN: {printablePO.vendor?.gstin || 'N/A'} • PAN: {printablePO.vendor?.pan || 'N/A'}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Contact: {printablePO.vendor?.contactPerson} ({printablePO.vendor?.phone})
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                  DELIVERY DESTINATION
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 4 }}>
                  {printablePO.project?.projectName} ({printablePO.project?.projectCode})
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Site Delivery Location: {printablePO.project?.location || 'Project Site Yard'}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Payment Terms: {printablePO.paymentTerms || '30 Days Net from GRN'}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12 }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12 }}>Material Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12 }}>Unit</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>Unit Rate</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>GST %</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {printablePO.items?.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600 }}>{item.materialName}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.unit}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>₹{item.unitRate.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{item.gstPercentage}%</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', fontWeight: 700 }}>
                      ₹{item.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <div style={{ width: 280, border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>₹{printablePO.totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span>Total GST:</span>
                  <span style={{ fontWeight: 600 }}>₹{printablePO.gstAmount.toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 15,
                    fontWeight: 800,
                    borderTop: '2px solid #0284c7',
                    paddingTop: 6,
                    color: '#0284c7',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>₹{printablePO.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Standard terms & Signatures */}
            <div style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <div><strong>Statutory Terms:</strong> 1. Goods subject to physical inspection & test certificate verification at site. 2. 3-Way matching (PO ↔ GRN ↔ Invoice) strictly enforced before payment release. 3. TDS deductible under Section 194C/194Q.</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 20 }}>
              <div style={{ textAlign: 'center', width: 200, borderTop: '1px dashed #94a3b8', fontSize: 12 }}>
                Site Incharge (Receipt)
              </div>
              <div style={{ textAlign: 'center', width: 200, borderTop: '1px dashed #94a3b8', fontSize: 12 }}>
                Rajesh Sharma (Procurement Mgr)
              </div>
              <div style={{ textAlign: 'center', width: 200, borderTop: '1px dashed #94a3b8', fontSize: 12 }}>
                Meena Iyer (Project Director)
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
