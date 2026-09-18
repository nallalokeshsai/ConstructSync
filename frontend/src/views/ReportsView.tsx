import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Table,
  Button,
  Tag,
  Tabs,
  Card,
  Row,
  Col,
  Input,
  message,
} from 'antd';
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('compliance');
  const [complianceData, setComplianceData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [auditSearch, setAuditSearch] = useState<string>('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const compRes = await api.get('/analytics/compliance-report');
      setComplianceData(compRes.data);

      const auditRes = await api.get('/audit?limit=50');
      setAuditLogs(auditRes.data.auditLogs);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportComplianceCSV = () => {
    if (!complianceData || !complianceData.invoices) return;

    const headers = ['Invoice Number', 'Invoice Date', 'Vendor', 'GSTIN', 'PAN', 'Project', 'Base Amount', 'GST Amount', 'TDS Amount', 'Net Payable', '3-Way Match Status'];
    const rows = complianceData.invoices.map((inv: any) => [
      inv.invoiceNumber,
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
      `"${inv.vendor}"`,
      inv.gstin,
      inv.pan,
      `"${inv.project}"`,
      inv.invoiceAmount,
      inv.gstAmount,
      inv.tdsAmount,
      inv.netPayable,
      inv.matchStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ConstructSync_GST_TDS_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Compliance CSV report exported successfully!');
  };

  const exportAuditCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;

    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Details'];
    const rows = auditLogs.map((l: any) => [
      new Date(l.createdAt).toLocaleString(),
      `"${l.user?.name || 'System'}"`,
      l.action,
      l.entity,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ConstructSync_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Audit Trail CSV exported successfully!');
  };

  const filteredLogs = auditLogs.filter((l) => {
    if (!auditSearch) return true;
    const term = auditSearch.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.entity.toLowerCase().includes(term) ||
      (l.user?.name && l.user.name.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>
            Reports, Tax Reconciliation & System Audit Trail
          </h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            GST input credit verification, Section 194C/194Q TDS ledger, and immutable event logs
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'compliance' ? (
            <Button
              type="primary"
              icon={<Download size={14} />}
              onClick={exportComplianceCSV}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              Export GST/TDS CSV
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<Download size={14} />}
              onClick={exportAuditCSV}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
            >
              Export Audit Trail CSV
            </Button>
          )}
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k)}
        items={[
          {
            key: 'compliance',
            label: 'GST Reconciliation & TDS Ledger',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Metrics Summary */}
                {complianceData && (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <div className="stat-card success">
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                          ELIGIBLE INPUT GST CREDITS
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                          ₹{complianceData.summary.totalGstClaimed.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                          Across {complianceData.summary.totalInvoicesCount} verified invoices
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="stat-card primary">
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                          TOTAL STATUTORY TDS DEDUCTED
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                          ₹{complianceData.summary.totalTdsDeducted.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                          Sec 194C / 194Q compliance
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} sm={8}>
                      <div className="stat-card danger">
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                          DISPUTED / QUARANTINED GST
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                          ₹{complianceData.summary.disputedGst.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>
                          Blocked by 3-Way Match discrepancy
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Compliance Table */}
                <Table
                  dataSource={complianceData?.invoices || []}
                  rowKey="invoiceNumber"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: 'Invoice / Date',
                      key: 'inv',
                      render: (_: any, r: any) => (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0284c7' }}>{r.invoiceNumber}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Vendor / GSTIN',
                      key: 'vendor',
                      render: (_: any, r: any) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.vendor}</div>
                          <code style={{ fontSize: 11, color: '#0369a1' }}>{r.gstin || 'N/A'}</code>
                        </div>
                      ),
                    },
                    {
                      title: 'Project',
                      dataIndex: 'project',
                      key: 'project',
                    },
                    {
                      title: 'Base Amount',
                      dataIndex: 'invoiceAmount',
                      key: 'invoiceAmount',
                      render: (v: number) => `₹${v.toLocaleString()}`,
                    },
                    {
                      title: 'Input GST',
                      dataIndex: 'gstAmount',
                      key: 'gstAmount',
                      render: (v: number) => `₹${v.toLocaleString()}`,
                    },
                    {
                      title: 'TDS (2%)',
                      dataIndex: 'tdsAmount',
                      key: 'tdsAmount',
                      render: (v: number) => `-₹${v.toLocaleString()}`,
                    },
                    {
                      title: 'Net Payable',
                      dataIndex: 'netPayable',
                      key: 'netPayable',
                      render: (v: number) => (
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>
                          ₹{v.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      title: 'Reconciliation',
                      dataIndex: 'matchStatus',
                      key: 'matchStatus',
                      render: (status: string) => (
                        <Tag color={status === 'matched' ? 'success' : 'error'}>
                          {status.toUpperCase()}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'audit',
            label: 'Immutable Audit Trail',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Input
                    placeholder="Search audit action, entity, actor..."
                    prefix={<Search size={14} color="#94a3b8" />}
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    style={{ width: 300, borderRadius: 8 }}
                    allowClear
                  />
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Showing latest {filteredLogs.length} logged system events
                  </div>
                </div>

                <Table
                  dataSource={filteredLogs}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: 'Timestamp',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      render: (d: string) => (
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {new Date(d).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      title: 'Actor (User)',
                      key: 'user',
                      render: (_: any, r: any) => (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.user?.name || 'System Auto-Agent'}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{r.user?.role || 'SYSTEM'}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'Action Code',
                      dataIndex: 'action',
                      key: 'action',
                      render: (act: string) => {
                        let color = 'blue';
                        if (act.includes('APPROVED') || act.includes('VERIFIED')) color = 'green';
                        if (act.includes('DISCREPANCY') || act.includes('REJECTED')) color = 'volcano';
                        return <Tag color={color} style={{ fontWeight: 600 }}>{act}</Tag>;
                      },
                    },
                    {
                      title: 'Entity & Record ID',
                      key: 'entity',
                      render: (_: any, r: any) => (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 600 }}>{r.entity}</span>
                          <span style={{ color: '#94a3b8', marginLeft: 4 }}>({r.entityId ? r.entityId.slice(0, 13) : 'N/A'})</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Event Metadata & Details',
                      key: 'details',
                      render: (_: any, r: any) => (
                        <code style={{ fontSize: 11, color: '#334155' }}>
                          {r.details ? JSON.stringify(r.details) : '—'}
                        </code>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
