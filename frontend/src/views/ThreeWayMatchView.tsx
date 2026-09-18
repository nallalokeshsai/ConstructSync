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
  Alert,
  Space,
  message,
  Divider,
} from 'antd';
import {
  Scale,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ThreeWayMatchView: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isRecordOpen, setIsRecordOpen] = useState<boolean>(false);
  const [inspectorInvoice, setInspectorInvoice] = useState<any | null>(null);

  const [form] = Form.useForm();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices);

      const poRes = await api.get('/purchase-orders');
      setPos(poRes.data.purchaseOrders);

      const grnRes = await api.get('/grn');
      setGrns(grnRes.data.grns);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openInspector = async (id: string) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInspectorInvoice(res.data.invoice);
    } catch (err) {
      message.error('Failed to open 3-way match details');
    }
  };

  const handlePOSelect = (poId: string) => {
    const po = pos.find((p) => p.id === poId);
    if (po) {
      // Find matching GRN
      const matchingGrn = grns.find((g) => g.poId === poId);
      form.setFieldsValue({
        vendorId: po.vendorId,
        grnId: matchingGrn ? matchingGrn.id : undefined,
        invoiceAmount: po.totalAmount,
        gstAmount: po.gstAmount,
        tdsPercentage: 2.0,
      });
    }
  };

  const handleRecordSubmit = async (values: any) => {
    try {
      const res = await api.post('/invoices', values);
      if (res.data.invoice.threeWayMatchStatus === 'matched') {
        message.success('3-Way Match Passed! PO, GRN, and Invoice matched 100%.');
      } else {
        message.warning('3-Way Match Discrepancy Flagged! Check variance breakdown.');
      }
      setIsRecordOpen(false);
      form.resetFields();
      fetchInvoices();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to record invoice');
    }
  };

  const handleUpdatePaymentStatus = async (status: string) => {
    if (!inspectorInvoice) return;
    try {
      await api.patch(`/invoices/${inspectorInvoice.id}/payment-status`, {
        paymentStatus: status,
      });
      message.success(`Invoice status updated to ${status.toUpperCase()}`);
      openInspector(inspectorInvoice.id);
      fetchInvoices();
    } catch (err) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Invoice Number',
      key: 'invoiceNumber',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0284c7', fontSize: 13 }}>{r.invoiceNumber}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Vendor & Project',
      key: 'vendor',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.vendor?.companyName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.purchaseOrder?.project?.projectName} • PO: {r.purchaseOrder?.poNumber}
          </div>
        </div>
      ),
    },
    {
      title: '3-Way Match Verification',
      key: 'match',
      render: (_: any, r: any) => {
        if (r.threeWayMatchStatus === 'matched') {
          return (
            <Tag color="success" icon={<CheckCircle2 size={12} />} style={{ fontWeight: 700 }}>
              MATCHED (100%)
            </Tag>
          );
        }
        if (r.threeWayMatchStatus === 'mismatch') {
          return (
            <div>
              <Tag color="error" icon={<AlertTriangle size={12} />} style={{ fontWeight: 700 }}>
                MISMATCH DETECTED
              </Tag>
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                Variance flagged in audit
              </div>
            </div>
          );
        }
        return <Tag color="warning">PENDING RECONCILIATION</Tag>;
      },
    },
    {
      title: 'Net Payable Calculation',
      key: 'payable',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
            ₹{r.netPayable.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            Base: ₹{r.invoiceAmount.toLocaleString()} | GST: ₹{r.gstAmount.toLocaleString()} | TDS (2%): -₹{r.tdsAmount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          approved: 'success',
          paid: 'purple',
          disputed: 'error',
          pending: 'warning',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: any) => (
        <Button
          size="small"
          type="primary"
          onClick={() => openInspector(r.id)}
          style={{ background: '#0284c7', borderColor: '#0284c7' }}
        >
          Inspect 3-Way Match
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>
            Automated 3-Way Matching Engine (PO ↔ GRN ↔ Invoice)
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Eliminates overbilling, catches damaged material billing, and deducts statutory TDS (Sec 194C/194Q)
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            form.resetFields();
            setIsRecordOpen(true);
          }}
          style={{ background: '#0284c7', borderColor: '#0284c7' }}
        >
          Record Vendor Invoice
        </Button>
      </div>

      {/* Invoices Table */}
      <Table dataSource={invoices} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      {/* Record Invoice Modal */}
      <Modal
        title="Record Vendor Tax Invoice & Run 3-Way Matching"
        open={isRecordOpen}
        onCancel={() => setIsRecordOpen(false)}
        footer={null}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRecordSubmit}
          initialValues={{ tdsPercentage: 2.0 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="invoiceNumber" label="Vendor Invoice Number" rules={[{ required: true }]}>
              <Input placeholder="e.g. INV-UTC-2026-991" />
            </Form.Item>

            <Form.Item name="poId" label="Against Purchase Order" rules={[{ required: true }]}>
              <Select
                placeholder="Select PO"
                onChange={handlePOSelect}
                options={pos.map((p) => ({
                  label: `${p.poNumber} — ${p.vendor?.companyName} (₹${p.grandTotal.toLocaleString()})`,
                  value: p.id,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="grnId" label="Linked Site GRN Receipt">
              <Select
                placeholder="Select GRN"
                allowClear
                options={grns.map((g) => ({
                  label: `${g.grnNumber} — ${g.qualityStatus.toUpperCase()} (${g.purchaseOrder?.poNumber})`,
                  value: g.id,
                }))}
              />
            </Form.Item>

            <Form.Item name="vendorId" label="Vendor Entity" rules={[{ required: true }]}>
              <Select
                options={pos.map((p) => ({
                  label: p.vendor?.companyName,
                  value: p.vendorId,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="invoiceAmount" label="Invoiced Base Amount (₹)" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>

            <Form.Item name="gstAmount" label="Billed GST (₹)" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>

            <Form.Item name="tdsPercentage" label="TDS Rate (%)">
              <Select
                options={[
                  { label: '2% (Sec 194C Works Contract)', value: 2.0 },
                  { label: '1% (Sec 194Q Goods Procurement)', value: 1.0 },
                  { label: '0% (Exempt)', value: 0.0 },
                ]}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="invoiceDate" label="Invoice Date">
              <Input type="date" />
            </Form.Item>

            <Form.Item name="dueDate" label="Due Date">
              <Input type="date" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsRecordOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              Run 3-Way Match & Save
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Interactive 3-Way Match Diagnostic Inspector Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={20} color="#0284c7" />
            <span>3-Way Reconciliation Diagnostic Inspector</span>
          </div>
        }
        open={Boolean(inspectorInvoice)}
        onCancel={() => setInspectorInvoice(null)}
        footer={null}
        width={850}
      >
        {inspectorInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status Banner */}
            {inspectorInvoice.threeWayMatchStatus === 'matched' ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircle2 size={20} />}
                message={<span style={{ fontWeight: 800 }}>Clean 3-Way Match Passed (100% Verified)</span>}
                description="Purchase Order quantities & rates, site GRN physical acceptance, and vendor tax invoice align completely. Safe for disbursement."
              />
            ) : (
              <Alert
                type="error"
                showIcon
                icon={<AlertTriangle size={20} />}
                message={<span style={{ fontWeight: 800 }}>3-Way Reconciliation Discrepancy Flagged!</span>}
                description={
                  <div>
                    Payment release blocked. The system detected material variance between invoiced amounts and accepted goods at site.
                  </div>
                }
              />
            )}

            {/* 3 Pillars Visual Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {/* Pillar 1: PO */}
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                  1. PURCHASE ORDER
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>
                  {inspectorInvoice.purchaseOrder?.poNumber}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Agreed Base: ₹{inspectorInvoice.purchaseOrder?.totalAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Agreed GST: ₹{inspectorInvoice.purchaseOrder?.gstAmount.toLocaleString()}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                  {inspectorInvoice.purchaseOrder?.items?.map((it: any, idx: number) => (
                    <div key={idx}>
                      {it.quantity} {it.unit} @ ₹{it.unitRate}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pillar 2: GRN */}
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                  2. SITE GRN RECEIPT
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>
                  {inspectorInvoice.grn?.grnNumber || 'No GRN Logged'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Status:{' '}
                  <Tag color={inspectorInvoice.grn?.qualityStatus === 'accepted' ? 'success' : 'warning'}>
                    {inspectorInvoice.grn?.qualityStatus?.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                  {inspectorInvoice.grn?.items?.map((it: any, idx: number) => (
                    <div key={idx}>
                      <div>Accepted: <strong>{it.acceptedQuantity}</strong></div>
                      {it.rejectedQuantity > 0 && (
                        <div style={{ color: '#ef4444', fontWeight: 700 }}>
                          Rejected: {it.rejectedQuantity} ({it.remarks})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pillar 3: Invoice */}
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase' }}>
                  3. VENDOR INVOICE
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>
                  {inspectorInvoice.invoiceNumber}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Billed Base: ₹{inspectorInvoice.invoiceAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Billed GST: ₹{inspectorInvoice.gstAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                  Net Payable: ₹{inspectorInvoice.netPayable.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Discrepancy Diagnostics list */}
            {inspectorInvoice.matchDiscrepancies && (
              <div style={{ background: '#fef2f2', padding: 14, borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#991b1b', marginBottom: 6 }}>
                  Specific Variance Diagnostics:
                </div>
                {Array.isArray(inspectorInvoice.matchDiscrepancies) ? (
                  inspectorInvoice.matchDiscrepancies.map((d: any, idx: number) => (
                    <div key={idx} style={{ fontSize: 12, color: '#b91c1c', marginBottom: 4 }}>
                      • <strong>{d.type}:</strong> {d.message}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: '#b91c1c' }}>
                    {JSON.stringify(inspectorInvoice.matchDiscrepancies)}
                  </div>
                )}
              </div>
            )}

            {/* Resolution Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Current Payment Status: <strong>{inspectorInvoice.paymentStatus.toUpperCase()}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {inspectorInvoice.threeWayMatchStatus === 'mismatch' ? (
                  <>
                    <Button danger onClick={() => handleUpdatePaymentStatus('disputed')}>
                      Dispute & Request Credit Note
                    </Button>
                    <Button onClick={() => handleUpdatePaymentStatus('approved')}>
                      Override & Authorize Payment
                    </Button>
                  </>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => handleUpdatePaymentStatus('paid')}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Mark as Paid (Disbursed)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
