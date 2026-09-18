-- ConstructSync Production PostgreSQL Schema DDL
-- Domain: Construction Procurement Intelligence & Vendor Risk Management System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'site_engineer', -- admin, project_director, procurement_manager, site_engineer, finance_controller, vendor
    phone VARCHAR(20),
    designation VARCHAR(100),
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    gstin VARCHAR(15) UNIQUE,
    pan VARCHAR(10),
    bank_name VARCHAR(255),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(11),
    category VARCHAR(100) NOT NULL, -- Steel, Cement, RMC, Electrical, Plumbing, Sand, Tiles, Hardware
    city VARCHAR(100),
    state VARCHAR(100),
    compliance_status VARCHAR(50) DEFAULT 'compliant', -- compliant, expiring, non_compliant
    performance_score NUMERIC(3,2) DEFAULT 0.00,       -- 0.00 to 5.00
    status VARCHAR(50) DEFAULT 'active',               -- active, blacklisted, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255),
    total_budget NUMERIC(15,2) DEFAULT 0.00,
    procurement_budget NUMERIC(15,2) DEFAULT 0.00,
    start_date DATE,
    expected_end_date DATE,
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- planning, active, on_hold, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indents Table
CREATE TABLE IF NOT EXISTS indents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indent_number VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requested_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    required_date DATE,
    priority VARCHAR(20) DEFAULT 'normal', -- urgent, normal, low
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_comments TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indent Line Items
CREATE TABLE IF NOT EXISTS indent_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indent_id UUID NOT NULL REFERENCES indents(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_category VARCHAR(100),
    quantity NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL, -- MT, bags, cum, pieces, sqft, meters, kg
    estimated_rate NUMERIC(12,2),
    notes TEXT
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    indent_id UUID REFERENCES indents(id) ON DELETE SET NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    gst_amount NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) DEFAULT 0.00,
    delivery_date DATE,
    payment_terms VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, acknowledged, delivered, closed, cancelled
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_maverick BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PO Line Items
CREATE TABLE IF NOT EXISTS po_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    unit_rate NUMERIC(12,2) NOT NULL,
    gst_percentage NUMERIC(5,2) DEFAULT 18.00,
    total_amount NUMERIC(15,2) NOT NULL
);

-- Goods Receipt Notes (GRN) Table
CREATE TABLE IF NOT EXISTS grn (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    received_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    received_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_challan_no VARCHAR(100),
    vehicle_number VARCHAR(50),
    quality_status VARCHAR(50) DEFAULT 'accepted', -- accepted, partial, rejected
    rejection_reason TEXT,
    notes TEXT,
    photo_urls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GRN Line Items
CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES grn(id) ON DELETE CASCADE,
    po_item_id UUID REFERENCES po_items(id) ON DELETE SET NULL,
    material_name VARCHAR(255) NOT NULL,
    ordered_quantity NUMERIC(12,2) NOT NULL,
    received_quantity NUMERIC(12,2) NOT NULL,
    accepted_quantity NUMERIC(12,2) NOT NULL,
    rejected_quantity NUMERIC(12,2) DEFAULT 0.00,
    remarks TEXT
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    grn_id UUID REFERENCES grn(id) ON DELETE SET NULL,
    invoice_amount NUMERIC(15,2) DEFAULT 0.00,
    gst_amount NUMERIC(15,2) DEFAULT 0.00,
    tds_percentage NUMERIC(5,2) DEFAULT 2.00,
    tds_amount NUMERIC(15,2) DEFAULT 0.00,
    net_payable NUMERIC(15,2) DEFAULT 0.00,
    invoice_date DATE,
    due_date DATE,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, disputed
    three_way_match_status VARCHAR(50) DEFAULT 'pending', -- matched, mismatch, pending
    match_discrepancies JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Performance Reviews
CREATE TABLE IF NOT EXISTS vendor_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    delivery_timeliness_score NUMERIC(3,2) NOT NULL,
    quality_score NUMERIC(3,2) NOT NULL,
    pricing_competitiveness NUMERIC(3,2) NOT NULL,
    communication_score NUMERIC(3,2) NOT NULL,
    overall_score NUMERIC(3,2) NOT NULL,
    review_notes TEXT,
    reviewed_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Documents
CREATE TABLE IF NOT EXISTS compliance_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- gst_cert, pan_card, insurance, msme_cert, bank_proof
    title VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),
    file_url VARCHAR(500),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'valid', -- valid, expiring, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Rate Intelligence & Quotes
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_category VARCHAR(100),
    unit_rate NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    valid_till DATE,
    minimum_order_quantity NUMERIC(12,2),
    lead_time_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_vendors_gstin ON vendors(gstin);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_indents_project_id ON indents(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_grn_po_id ON grn(po_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_po_id ON invoices(po_id);
CREATE INDEX IF NOT EXISTS idx_vendor_perf_vendor_id ON vendor_performance(vendor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
