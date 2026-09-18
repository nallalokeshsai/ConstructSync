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
  Image,
  message,
  Space,
  Alert,
} from 'antd';
import {
  PackageCheck,
  Plus,
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Truck,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GRNViewProps {
  prefillPO?: any;
  onClearPrefill?: () => void;
  onNavigateToMatch?: (grn: any) => void;
}

export const GRNView: React.FC<GRNViewProps> = ({
  prefillPO,
  onClearPrefill,
  onNavigateToMatch,
}) => {
  const { user } = useAuth();
  const [grns, setGrns] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecordOpen, setIsRecordOpen] = useState<boolean>(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);

  const [form] = Form.useForm();

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grn');
      setGrns(res.data.grns);

      const poRes = await api.get('/purchase-orders');
      setPos(poRes.data.purchaseOrders.filter((po: any) => po.status !== 'cancelled'));
    } catch (err) {
      console.error('Failed to load GRNs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNs();
  }, []);

  // Handle prefill if directed from PO view
  useEffect(() => {
    if (prefillPO) {
      setIsRecordOpen(true);
      setSelectedPO(prefillPO);
      form.setFieldsValue({
        poId: prefillPO.id,
        deliveryChallanNo: `DC-${Math.round(Math.random() * 89999 + 10000)}`,
        vehicleNumber: 'KA-01-MJ-4412',
        qualityStatus: 'accepted',
        items: prefillPO.items?.map((it: any) => ({
          poItemId: it.id,
          materialName: it.materialName,
          orderedQuantity: it.quantity,
          receivedQuantity: it.quantity,
          acceptedQuantity: it.quantity,
          rejectedQuantity: 0,
          remarks: 'Verified at weighbridge',
        })),
      });
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillPO]);

  const handlePOSelect = (poId: string) => {
    const found = pos.find((p) => p.id === poId);
    setSelectedPO(found);
    if (found && found.items) {
      form.setFieldsValue({
        items: found.items.map((it: any) => ({
          poItemId: it.id,
          materialName: it.materialName,
          orderedQuantity: it.quantity,
          receivedQuantity: it.quantity,
          acceptedQuantity: it.quantity,
          rejectedQuantity: 0,
          remarks: '',
        })),
      });
    }
  };

  const handleRecordSubmit = async (values: any) => {
    try {
      const payload = {
        poId: values.poId,
        deliveryChallanNo: values.deliveryChallanNo,
        vehicleNumber: values.vehicleNumber,
        qualityStatus: values.qualityStatus || 'accepted',
        rejectionReason: values.rejectionReason,
        notes: values.notes,
        itemsJson: JSON.stringify(values.items),
        photoUrls: values.photoUrl ? [values.photoUrl] : [
          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
        ],
      };

      await api.post('/grn', payload);
      message.success('Goods Receipt Note (GRN) recorded successfully!');
      setIsRecordOpen(false);
      form.resetFields();
      setSelectedPO(null);
      fetchGRNs();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to record GRN');
    }
  };

  const columns = [
    {
      title: 'GRN Number',
      key: 'grnNumber',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0284c7', fontSize: 13 }}>{r.grnNumber}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {new Date(r.receivedDate).toLocaleDateString()}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Challan: {r.deliveryChallanNo || 'N/A'} • {r.vehicleNumber}
          </div>
        </div>
      ),
    },
    {
      title: 'Purchase Order',
      key: 'po',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.purchaseOrder?.poNumber}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.purchaseOrder?.vendor?.companyName}
          </div>
          <div style={{ fontSize: 11, color: '#0284c7' }}>
            {r.purchaseOrder?.project?.projectName}
          </div>
        </div>
      ),
    },
    {
      title: 'Inspection Quantities',
      key: 'quantities',
      render: (_: any, r: any) => (
        <div>
          {r.items?.map((it: any, idx: number) => (
            <div key={idx} style={{ fontSize: 12, marginBottom: 2 }}>
              <span>{it.materialName}: </span>
              <strong style={{ color: '#10b981' }}>{it.acceptedQuantity} Acc</strong>
              {it.rejectedQuantity > 0 && (
                <strong style={{ color: '#ef4444', marginLeft: 6 }}>
                  ({it.rejectedQuantity} Rej)
                </strong>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Quality Status',
      key: 'quality',
      render: (_: any, r: any) => {
        if (r.qualityStatus === 'accepted') {
          return <Tag color="success" icon={<CheckCircle size={12} />}>ACCEPTED (100%)</Tag>;
        }
        if (r.qualityStatus === 'partial') {
          return (
            <div>
              <Tag color="warning" icon={<AlertTriangle size={12} />}>PARTIAL REJECTION</Tag>
              {r.rejectionReason && (
                <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2, maxWidth: 200 }}>
                  {r.rejectionReason}
                </div>
              )}
            </div>
          );
        }
        return <Tag color="error" icon={<XCircle size={12} />}>REJECTED</Tag>;
      },
    },
    {
      title: 'Site Photos',
      key: 'photos',
      render: (_: any, r: any) => {
        let urls: string[] = [];
        try {
          urls = r.photoUrls ? JSON.parse(r.photoUrls) : [];
        } catch (e) {
          urls = [];
        }
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {urls.slice(0, 2).map((url, i) => (
              <Image
                key={i}
                src={url}
                width={38}
                height={38}
                style={{ borderRadius: 6, objectFit: 'cover' }}
              />
            ))}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: any) => (
        <Button
          size="small"
          type="dashed"
          onClick={() => onNavigateToMatch && onNavigateToMatch(r)}
        >
          View in 3-Way Match
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
            Site Goods Receipt Notes (GRN)
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Site weighbridge verification, physical damage checks, and rejection quarantine logs
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
          Record Site Delivery (GRN)
        </Button>
      </div>

      {/* GRN Table */}
      <Table dataSource={grns} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      {/* Record GRN Modal */}
      <Modal
        title="Record Site Goods Receipt Note (GRN)"
        open={isRecordOpen}
        onCancel={() => setIsRecordOpen(false)}
        footer={null}
        width={750}
      >
        <Form form={form} layout="vertical" onFinish={handleRecordSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
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

            <Form.Item name="qualityStatus" label="Overall Quality Status">
              <Select
                options={[
                  { label: 'Full Acceptance', value: 'accepted' },
                  { label: 'Partial Rejection (Damaged/Shortage)', value: 'partial' },
                  { label: 'Complete Rejection', value: 'rejected' },
                ]}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="deliveryChallanNo" label="Vendor Challan #">
              <Input placeholder="e.g. DC-TATA-99120" />
            </Form.Item>

            <Form.Item name="vehicleNumber" label="Delivery Vehicle #">
              <Input placeholder="e.g. KA-01-AB-1234" />
            </Form.Item>

            <Form.Item name="photoUrl" label="Sample Photo URL (Optional)">
              <Input placeholder="https://..." />
            </Form.Item>
          </div>

          <Form.Item name="rejectionReason" label="Rejection Reason / Quarantine Notes (If applicable)">
            <Input placeholder="e.g. 60 bags water damaged in transit, or rust on 16mm rebar bundles" />
          </Form.Item>

          {/* Line items verification */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              Material Quantity Inspection & Acceptance
            </div>
            <Form.List name="items">
              {(fields) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
                        gap: 8,
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Form.Item {...restField} name={[name, 'materialName']} style={{ margin: 0 }}>
                        <Input readOnly style={{ background: '#f1f5f9' }} />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'receivedQuantity']} label="Received" style={{ margin: 0 }}>
                        <Input type="number" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'acceptedQuantity']} label="Accepted" style={{ margin: 0 }}>
                        <Input type="number" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'rejectedQuantity']} label="Rejected" style={{ margin: 0 }}>
                        <Input type="number" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'remarks']} label="Remarks" style={{ margin: 0 }}>
                        <Input placeholder="Remarks" />
                      </Form.Item>
                    </div>
                  ))}
                </div>
              )}
            </Form.List>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setIsRecordOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              Confirm Site GRN Receipt
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
