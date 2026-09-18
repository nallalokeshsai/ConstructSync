import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Drawer,
  Rate,
  Alert,
  Tabs,
  message,
  Space,
  Badge,
  Upload,
} from 'antd';
import {
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  FileText,
  UploadCloud,
  CheckCircle,
  ExternalLink,
  Award,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VendorsView: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [complianceFilter, setComplianceFilter] = useState<string>('');

  // Modals & Drawers
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendorDetails, setVendorDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Live GSTIN verification
  const [gstinInput, setGstinInput] = useState<string>('');
  const [gstinVerifyLoading, setGstinVerifyLoading] = useState<boolean>(false);
  const [gstinVerifyResult, setGstinVerifyResult] = useState<any>(null);

  // Forms
  const [onboardForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [docForm] = Form.useForm();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (complianceFilter) params.complianceStatus = complianceFilter;

      const res = await api.get('/vendors', { params });
      setVendors(res.data.vendors);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, categoryFilter, complianceFilter]);

  const openVendorDetails = async (id: string) => {
    setSelectedVendorId(id);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/vendors/${id}`);
      setVendorDetails(res.data);
    } catch (err) {
      message.error('Failed to load vendor profile');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleVerifyGstin = async () => {
    if (!gstinInput) return;
    setGstinVerifyLoading(true);
    try {
      const res = await api.post('/vendors/verify-gstin', { gstin: gstinInput });
      setGstinVerifyResult(res.data);
      onboardForm.setFieldsValue({
        gstin: res.data.gstin,
        pan: res.data.pan,
        state: res.data.state,
      });
      message.success('GSTIN verified with GST portal!');
    } catch (err: any) {
      setGstinVerifyResult({
        valid: false,
        message: err.response?.data?.message || 'Invalid GSTIN format',
      });
      message.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setGstinVerifyLoading(false);
    }
  };

  const handleOnboardSubmit = async (values: any) => {
    try {
      await api.post('/vendors', values);
      message.success('Vendor onboarded successfully!');
      setIsOnboardingOpen(false);
      onboardForm.resetFields();
      setGstinVerifyResult(null);
      fetchVendors();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to onboard vendor');
    }
  };

  const handleReviewSubmit = async (values: any) => {
    if (!selectedVendorId) return;
    try {
      await api.post(`/vendors/${selectedVendorId}/performance`, values);
      message.success('Performance review recorded and score updated!');
      reviewForm.resetFields();
      openVendorDetails(selectedVendorId);
      fetchVendors();
    } catch (err) {
      message.error('Failed to submit review');
    }
  };

  const handleDocUpload = async (values: any) => {
    if (!selectedVendorId) return;
    try {
      await api.post(`/vendors/${selectedVendorId}/documents`, values);
      message.success('Document uploaded and registered!');
      docForm.resetFields();
      openVendorDetails(selectedVendorId);
    } catch (err) {
      message.error('Failed to upload document');
    }
  };

  const columns = [
    {
      title: 'Company & Category',
      key: 'company',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{r.companyName}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            <Tag color="blue" style={{ marginTop: 2 }}>{r.category}</Tag>
            <span>{r.city ? `${r.city}, ${r.state}` : ''}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'GSTIN / PAN',
      key: 'tax',
      render: (_: any, r: any) => (
        <div>
          <code style={{ fontSize: 12, fontWeight: 600, color: '#0369a1' }}>{r.gstin || 'N/A'}</code>
          <div style={{ fontSize: 11, color: '#64748b' }}>PAN: {r.pan || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Compliance Status',
      dataIndex: 'complianceStatus',
      key: 'complianceStatus',
      render: (status: string) => {
        if (status === 'compliant') {
          return <Tag color="success" icon={<ShieldCheck size={12} />}>GST Compliant</Tag>;
        }
        if (status === 'expiring') {
          return <Tag color="warning" icon={<AlertTriangle size={12} />}>Filing Expiring (&lt;30d)</Tag>;
        }
        return <Tag color="error" icon={<ShieldAlert size={12} />}>Non-Compliant (Defaulted)</Tag>;
      },
    },
    {
      title: 'Performance Rating',
      dataIndex: 'performanceScore',
      key: 'performanceScore',
      render: (score: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Rate disabled allowHalf defaultValue={score} style={{ fontSize: 13, color: '#f59e0b' }} />
          <span style={{ fontWeight: 700, fontSize: 12 }}>{score.toFixed(1)}</span>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, r: any) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{r.contactPerson}</div>
          <div style={{ color: '#64748b' }}>{r.phone}</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: any) => (
        <Button size="small" type="link" onClick={() => openVendorDetails(r.id)}>
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header controls & Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Search vendor, GSTIN, city..."
            prefix={<Search size={16} color="#94a3b8" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
            allowClear
          />

          <Select
            placeholder="Filter Category"
            style={{ width: 160 }}
            value={categoryFilter || undefined}
            onChange={(v) => setCategoryFilter(v || '')}
            allowClear
            options={[
              { label: 'Steel', value: 'Steel' },
              { label: 'Cement', value: 'Cement' },
              { label: 'Electrical', value: 'Electrical' },
              { label: 'Plumbing', value: 'Plumbing' },
              { label: 'Sand', value: 'Sand' },
              { label: 'Tiles', value: 'Tiles' },
            ]}
          />

          <Select
            placeholder="Compliance Status"
            style={{ width: 180 }}
            value={complianceFilter || undefined}
            onChange={(v) => setComplianceFilter(v || '')}
            allowClear
            options={[
              { label: 'Compliant', value: 'compliant' },
              { label: 'Expiring (<30 Days)', value: 'expiring' },
              { label: 'Non-Compliant', value: 'non_compliant' },
            ]}
          />
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsOnboardingOpen(true)}
          style={{ background: '#0284c7', borderColor: '#0284c7' }}
        >
          Onboard New Vendor
        </Button>
      </div>

      {/* Vendors Data Table */}
      <Table
        dataSource={vendors}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      {/* Onboarding Modal with GSTIN Auto-Verifier */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={20} color="#0284c7" />
            <span>Onboard Construction Vendor</span>
          </div>
        }
        open={isOnboardingOpen}
        onCancel={() => setIsOnboardingOpen(false)}
        footer={null}
        width={650}
      >
        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Instant GST Portal Verification
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Enter 15-digit GSTIN (e.g. 29AAACT2727Q1ZB)"
              value={gstinInput}
              onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
            />
            <Button
              type="primary"
              loading={gstinVerifyLoading}
              onClick={handleVerifyGstin}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              Verify GSTIN
            </Button>
          </div>
          {gstinVerifyResult && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {gstinVerifyResult.valid ? (
                <Alert
                  type="success"
                  message={`Verified Active Taxpayer in ${gstinVerifyResult.state}. PAN: ${gstinVerifyResult.pan}`}
                  showIcon
                />
              ) : (
                <Alert type="error" message={gstinVerifyResult.message} showIcon />
              )}
            </div>
          )}
        </div>

        <Form form={onboardForm} layout="vertical" onFinish={handleOnboardSubmit}>
          <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Tata Tiscon Rebar Pvt Ltd" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="category" label="Material Category" rules={[{ required: true, message: 'Required' }]}>
              <Select
                options={[
                  { label: 'Steel', value: 'Steel' },
                  { label: 'Cement', value: 'Cement' },
                  { label: 'Electrical', value: 'Electrical' },
                  { label: 'Plumbing', value: 'Plumbing' },
                  { label: 'Sand & Aggregates', value: 'Sand' },
                  { label: 'Tiles & Stones', value: 'Tiles' },
                  { label: 'Paints & Chemicals', value: 'Paints' },
                ]}
              />
            </Form.Item>

            <Form.Item name="contactPerson" label="Contact Person">
              <Input placeholder="e.g. Sunil Nair" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="phone" label="Phone Number">
              <Input placeholder="+91 98450 12345" />
            </Form.Item>
            <Form.Item name="email" label="Email Address">
              <Input placeholder="orders@vendor.in" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="gstin" label="GSTIN">
              <Input placeholder="15-digit GSTIN" />
            </Form.Item>
            <Form.Item name="pan" label="PAN Number">
              <Input placeholder="10-digit PAN" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="bankName" label="Bank Name">
              <Input placeholder="HDFC Bank" />
            </Form.Item>
            <Form.Item name="bankAccount" label="Account Number">
              <Input placeholder="502000..." />
            </Form.Item>
            <Form.Item name="ifscCode" label="IFSC Code">
              <Input placeholder="HDFC0000123" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="city" label="City">
              <Input placeholder="Bengaluru" />
            </Form.Item>
            <Form.Item name="state" label="State">
              <Input placeholder="Karnataka" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsOnboardingOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
              Complete Onboarding
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Single Vendor Profile Drawer */}
      <Drawer
        title="Vendor Profile & Compliance Dossier"
        placement="right"
        width={680}
        open={Boolean(selectedVendorId)}
        onClose={() => {
          setSelectedVendorId(null);
          setVendorDetails(null);
        }}
      >
        {detailsLoading || !vendorDetails ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading vendor details...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header summary */}
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{vendorDetails.vendor.companyName}</h3>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <Tag color="blue">{vendorDetails.vendor.category}</Tag>
                    <Tag color={vendorDetails.vendor.complianceStatus === 'compliant' ? 'success' : 'error'}>
                      {vendorDetails.vendor.complianceStatus.toUpperCase()}
                    </Tag>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>
                    {vendorDetails.vendor.performanceScore.toFixed(1)} / 5.0
                  </div>
                  <Rate disabled allowHalf defaultValue={vendorDetails.vendor.performanceScore} style={{ fontSize: 13 }} />
                </div>
              </div>

              {vendorDetails.complianceAlerts.hasExpiringDocs && (
                <Alert
                  type="warning"
                  message="Compliance Alert: 1 or more documents expiring within 30 days!"
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </div>

            {/* Profile Tabs */}
            <Tabs
              defaultActiveKey="documents"
              items={[
                {
                  key: 'documents',
                  label: `Compliance Documents (${vendorDetails.vendor.documents.length})`,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {vendorDetails.vendor.documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.title}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Doc #: {doc.documentNumber || 'N/A'} • Expiry:{' '}
                                {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Permanent'}
                              </div>
                            </div>
                            <Tag color={doc.status === 'valid' ? 'success' : doc.status === 'expiring' ? 'warning' : 'error'}>
                              {doc.status.toUpperCase()}
                            </Tag>
                          </div>
                        ))}
                      </div>

                      {/* Upload Document Form */}
                      <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                          Upload New Compliance Document
                        </div>
                        <Form form={docForm} layout="vertical" onFinish={handleDocUpload}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <Form.Item name="title" label="Document Title" rules={[{ required: true }]}>
                              <Input placeholder="e.g. GST REG-06 Certificate" />
                            </Form.Item>
                            <Form.Item name="documentType" label="Type" rules={[{ required: true }]}>
                              <Select
                                options={[
                                  { label: 'GST Registration Cert', value: 'gst_cert' },
                                  { label: 'PAN Card Copy', value: 'pan_card' },
                                  { label: 'Transit Insurance', value: 'insurance' },
                                  { label: 'MSME / Udyam', value: 'msme_cert' },
                                  { label: 'Bank Proof / Cancelled Cheque', value: 'bank_proof' },
                                ]}
                              />
                            </Form.Item>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <Form.Item name="documentNumber" label="Document / Policy Number">
                              <Input placeholder="Reg or policy number" />
                            </Form.Item>
                            <Form.Item name="expiryDate" label="Expiry Date">
                              <Input type="date" />
                            </Form.Item>
                          </div>
                          <Button type="primary" htmlType="submit" size="small" style={{ background: '#0284c7' }}>
                            Save Document
                          </Button>
                        </Form>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'reviews',
                  label: 'Rate & Review',
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Form.Item name="deliveryTimelinessScore" label="Delivery Timeliness (0-5)" rules={[{ required: true }]}>
                            <Input type="number" step="0.1" min="1" max="5" placeholder="4.5" />
                          </Form.Item>
                          <Form.Item name="qualityScore" label="Quality Adherence (0-5)" rules={[{ required: true }]}>
                            <Input type="number" step="0.1" min="1" max="5" placeholder="5.0" />
                          </Form.Item>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Form.Item name="pricingCompetitiveness" label="Pricing Competitiveness (0-5)" rules={[{ required: true }]}>
                            <Input type="number" step="0.1" min="1" max="5" placeholder="4.2" />
                          </Form.Item>
                          <Form.Item name="communicationScore" label="Communication & Responsiveness (0-5)" rules={[{ required: true }]}>
                            <Input type="number" step="0.1" min="1" max="5" placeholder="4.8" />
                          </Form.Item>
                        </div>
                        <Form.Item name="reviewNotes" label="Review Notes & Observations">
                          <Input.TextArea rows={2} placeholder="Observations on mill test certificates, packing, or transit timeliness..." />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" style={{ background: '#0284c7' }}>
                          Submit Performance Evaluation
                        </Button>
                      </Form>

                      {/* Past reviews */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Past Evaluations</div>
                        {vendorDetails.vendor.performanceReviews.map((rev: any) => (
                          <div key={rev.id} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ fontWeight: 600 }}>Score: {rev.overallScore.toFixed(1)} / 5</span>
                              <span style={{ color: '#64748b' }}>By {rev.reviewedBy?.name}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{rev.reviewNotes}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'pos',
                  label: `Active POs (${vendorDetails.vendor.purchaseOrders.length})`,
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {vendorDetails.vendor.purchaseOrders.map((po: any) => (
                        <div key={po.id} style={{ padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0284c7' }}>{po.poNumber}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{po.project.projectName}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>₹{po.grandTotal.toLocaleString()}</div>
                            <Tag color="blue">{po.status.toUpperCase()}</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};
