import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  Popconfirm,
  Badge,
  Tooltip,
} from 'antd';
import {
  Plus,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  WifiOff,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveOfflineIndent } from '../utils/offlineSync';

interface IndentsViewProps {
  projectId?: string;
  onRefreshStats?: () => void;
  onConvertToPO?: (indent: any) => void;
}

export const IndentsView: React.FC<IndentsViewProps> = ({
  projectId,
  onRefreshStats,
  onConvertToPO,
}) => {
  const { user } = useAuth();
  const [indents, setIndents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; indent: any | null }>({
    open: false,
    indent: null,
  });
  const [approvalComments, setApprovalComments] = useState<string>('');

  const [form] = Form.useForm();

  const fetchIndents = async () => {
    setLoading(true);
    try {
      const url = projectId ? `/indents?projectId=${projectId}` : '/indents';
      const res = await api.get(url);
      setIndents(res.data.indents);

      const prjRes = await api.get('/projects');
      setProjects(prjRes.data.projects);
    } catch (err) {
      console.error('Failed to load indents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndents();
  }, [projectId]);

  const handleCreateSubmit = async (values: any) => {
    try {
      const indentData = {
        projectId: values.projectId,
        requiredDate: values.requiredDate,
        priority: values.priority || 'normal',
        notes: values.notes,
        items: values.items.map((it: any) => ({
          materialName: it.materialName,
          materialCategory: it.materialCategory || 'General',
          quantity: Number(it.quantity),
          unit: it.unit,
          estimatedRate: Number(it.estimatedRate) || 0,
          notes: it.notes,
        })),
      };

      if (isOfflineSimulated) {
        // Store in offline local storage queue
        saveOfflineIndent(indentData);
        message.warning('Saved to Offline Queue (Site Mode)! Indent will sync when online.');
        setIsCreateOpen(false);
        form.resetFields();
        if (onRefreshStats) onRefreshStats();
        return;
      }

      await api.post('/indents', indentData);
      message.success('Material indent submitted for multi-level approval!');
      setIsCreateOpen(false);
      form.resetFields();
      fetchIndents();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to submit indent');
    }
  };

  const handleApprove = async () => {
    if (!approvalModal.indent) return;
    const targetIndent = approvalModal.indent;

    // Check approval authorization threshold
    if (targetIndent.requiresDirectorApproval && user?.role === 'procurement_manager') {
      message.error(
        `Approval threshold breach: Requisition value of ₹${targetIndent.estimatedTotal.toLocaleString()} requires Project Director (Meena) or Admin.`
      );
      return;
    }

    try {
      await api.post(`/indents/${targetIndent.id}/approve`, {
        comments: approvalComments || 'Approved as requested',
      });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      message.success(`Indent ${targetIndent.indentNumber} approved successfully!`);
      setApprovalModal({ open: false, indent: null });
      setApprovalComments('');
      fetchIndents();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to approve indent');
    }
  };

  const handleReject = async () => {
    if (!approvalModal.indent) return;
    try {
      await api.post(`/indents/${approvalModal.indent.id}/reject`, {
        comments: approvalComments || 'Rejected by approver',
      });
      message.info(`Indent ${approvalModal.indent.indentNumber} rejected.`);
      setApprovalModal({ open: false, indent: null });
      setApprovalComments('');
      fetchIndents();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to reject indent');
    }
  };

  const columns = [
    {
      title: 'Indent # & Priority',
      key: 'indentNumber',
      render: (_: any, r: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, color: '#0284c7', fontSize: 13 }}>{r.indentNumber}</span>
            <Tag color={r.priority === 'urgent' ? 'volcano' : r.priority === 'normal' ? 'blue' : 'default'}>
              {r.priority.toUpperCase()}
            </Tag>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Raised by {r.requestedBy?.name} • {new Date(r.createdAt).toLocaleDateString()}
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
      title: 'Materials Requested',
      key: 'materials',
      render: (_: any, r: any) => (
        <div>
          {r.items.map((it: any, i: number) => (
            <div key={i} style={{ fontSize: 12 }}>
              <strong>{it.quantity} {it.unit}</strong> — {it.materialName}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Estimated Value',
      dataIndex: 'estimatedTotal',
      key: 'estimatedTotal',
      render: (val: number, r: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>₹{val.toLocaleString()}</div>
          {r.requiresDirectorApproval ? (
            <Tag color="purple" style={{ fontSize: 10 }}>Director Sign-off (&gt;₹1L)</Tag>
          ) : (
            <Tag color="cyan" style={{ fontSize: 10 }}>PM Sign-off (&lt;₹1L)</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Approval Status',
      key: 'status',
      render: (_: any, r: any) => {
        if (r.approvalStatus === 'approved') {
          return (
            <div>
              <Tag color="success" icon={<CheckCircle2 size={12} />}>APPROVED</Tag>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>By {r.approvedBy?.name}</div>
            </div>
          );
        }
        if (r.approvalStatus === 'rejected') {
          return <Tag color="error" icon={<XCircle size={12} />}>REJECTED</Tag>;
        }
        return (
          <div>
            <Tag color="warning" icon={<Clock size={12} />}>PENDING APPROVAL</Tag>
            {r.isEscalated && (
              <Tag color="red" icon={<Flame size={12} />} style={{ marginTop: 2 }}>
                AUTO-ESCALATED ({r.hoursPending}h)
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: any) => {
        if (r.approvalStatus === 'pending') {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setApprovalModal({ open: true, indent: r });
                setApprovalComments('');
              }}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
            >
              Review / Approve
            </Button>
          );
        }
        if (r.approvalStatus === 'approved') {
          return (
            <Button
              type="dashed"
              size="small"
              onClick={() => onConvertToPO && onConvertToPO(r)}
            >
              Generate PO
            </Button>
          );
        }
        return <span style={{ color: '#94a3b8', fontSize: 12 }}>Closed</span>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>
            Site Material Indents (Requisitions)
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Multi-level threshold approval (Site Eng → PM &lt; ₹1L → Director Meena &ge; ₹1L)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            Raise Material Indent
          </Button>
        </div>
      </div>

      {/* Indents Table */}
      <Table dataSource={indents} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />

      {/* Raise Indent Modal with Offline Mode Support */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={20} color="#0284c7" />
            <span>Digital Material Indent / Requisition</span>
          </div>
        }
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={720}
      >
        {/* Offline Simulator Switch */}
        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Simulate Poor Site Connectivity</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Test offline queueing and automatic sync when connection is restored</div>
          </div>
          <Button
            size="small"
            type={isOfflineSimulated ? 'primary' : 'default'}
            danger={isOfflineSimulated}
            icon={isOfflineSimulated ? <WifiOff size={14} /> : undefined}
            onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
          >
            {isOfflineSimulated ? 'Offline Site Mode ACTIVE' : 'Toggle Offline Mode'}
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{
            priority: 'normal',
            items: [{ materialName: '', quantity: 1, unit: 'MT', estimatedRate: 0 }],
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="projectId" label="Construction Project" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select project"
                options={projects.map((p) => ({ label: `${p.projectName} (${p.projectCode})`, value: p.id }))}
              />
            </Form.Item>

            <Form.Item name="priority" label="Priority">
              <Select
                options={[
                  { label: 'Normal Priority', value: 'normal' },
                  { label: 'Urgent (Slab / Critical Path)', value: 'urgent' },
                  { label: 'Low', value: 'low' },
                ]}
              />
            </Form.Item>

            <Form.Item name="requiredDate" label="Required Date">
              <Input type="date" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Site Purpose / Notes">
            <Input placeholder="e.g. Tower B 4th floor column casting" />
          </Form.Item>

          {/* Dynamic line items */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Material Line Items</div>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
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
                        rules={[{ required: true, message: 'Required' }]}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="Material name (e.g. Fe550D TMT 16mm)" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Qty' }]}
                        style={{ margin: 0 }}
                      >
                        <Input type="number" placeholder="Quantity" />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'unit']} style={{ margin: 0 }}>
                        <Select
                          options={[
                            { label: 'MT', value: 'MT' },
                            { label: 'Bags', value: 'bags' },
                            { label: 'cum', value: 'cum' },
                            { label: 'Meters', value: 'meters' },
                            { label: 'Pieces', value: 'pieces' },
                            { label: 'Sqft', value: 'sqft' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'estimatedRate']} style={{ margin: 0 }}>
                        <Input type="number" placeholder="Est. Rate (₹)" />
                      </Form.Item>

                      {fields.length > 1 && (
                        <Button type="text" danger onClick={() => remove(name)}>
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<Plus size={14} />}>
                    Add Another Material Item
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              {isOfflineSimulated ? 'Save to Offline Queue' : 'Submit for Multi-level Approval'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Multi-Level Review & Approval Modal */}
      <Modal
        title="Multi-Level Indent Review & Authorization"
        open={approvalModal.open}
        onCancel={() => setApprovalModal({ open: false, indent: null })}
        footer={null}
        width={580}
      >
        {approvalModal.indent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#0284c7' }}>
                  {approvalModal.indent.indentNumber}
                </span>
                <Tag color={approvalModal.indent.priority === 'urgent' ? 'volcano' : 'blue'}>
                  {approvalModal.indent.priority.toUpperCase()}
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Project: {approvalModal.indent.project?.projectName}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
                Total Estimated Value: ₹{approvalModal.indent.estimatedTotal.toLocaleString()}
              </div>
            </div>

            {/* Threshold check reminder */}
            {approvalModal.indent.requiresDirectorApproval ? (
              <Alert
                type="warning"
                showIcon
                message="Director Threshold Triggered (>= ₹1,00,000)"
                description="This high-value requisition requires Project Director Meena Iyer or System Admin authorization."
              />
            ) : (
              <Alert
                type="info"
                showIcon
                message="Standard Requisition (< ₹1,00,000)"
                description="Procurement Manager Rajesh Sharma or Project Director can authorize."
              />
            )}

            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Requisition Items:</div>
              {approvalModal.indent.items.map((it: any, idx: number) => (
                <div key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{it.materialName} ({it.quantity} {it.unit})</span>
                  <span style={{ fontWeight: 600 }}>₹{(it.quantity * (it.estimatedRate || 0)).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Approval / Rejection Comments:</div>
              <Input.TextArea
                rows={2}
                placeholder="Add authorization remarks..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button danger onClick={handleReject}>
                Reject Indent
              </Button>
              <Button
                type="primary"
                onClick={handleApprove}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Approve Requisition
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
