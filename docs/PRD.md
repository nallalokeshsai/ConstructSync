# Product Requirements Document (PRD): ConstructSync

## 1. Document Overview & Executive Summary
ConstructSync is a specialized ConTech (Construction Technology) procurement intelligence and vendor risk management system built for Indian mid-to-large construction developers and EPC contractors managing projects valued between ₹50M and ₹250M+.

It replaces fragmented WhatsApp, spreadsheet, and paper-based purchase orders/GRNs with a real-time, unified workflow engine featuring automated 3-way reconciliation (PO ↔ GRN ↔ Invoice), multi-level authorization thresholds, live GST compliance tracking, and material rate intelligence.

---

## 2. Key Problem Statements & Business Impacts

| Current Fragmented Practice | Failure Mode | Business Impact |
| :--- | :--- | :--- |
| WhatsApp Indent Requests | Verbal approvals, unrecorded specifications, lost paper chits | 3-5 days requisition delay, untracked delivery commitments |
| Excel Budget Trackers | Manual reconciliation done once a month | 10-15% cost overrun discovered too late to mitigate |
| Paper GRNs / Site Receipts | Damaged/rejected materials signed without deduction on bills | Invoices overpaid by ₹25,000 - ₹50,000 per shipment |
| Manual GST/TDS Verifications | Expired GSTIN registrations, missing Section 194C/194Q TDS | ₹10-50L penalty exposure & loss of input tax credit (ITC) |
| Maverick / Off-contract Buying | Urgent purchases made at non-contract retail prices | 15-20% margin leakage across concrete, sand, and steel |

---

## 3. User Personas & Permissions (RBAC)

### Persona 1: Rajesh Sharma — Senior Procurement Manager
- **Role**: `procurement_manager`
- **Core Needs**: Generate official Purchase Orders, compare side-by-side vendor quotes, monitor delivery dates, enforce empaneled vendor rates.
- **Approval Limit**: Authorized to approve indents valued `< ₹1,00,000`.

### Persona 2: Meena Iyer — Project Director (Portfolio Head)
- **Role**: `project_director`
- **Core Needs**: High-level cross-project budget vs actual burn analytics, executive approval on high-value commitments (`>= ₹1,00,000`), vendor risk monitoring.
- **Approval Limit**: Portfolio-wide authority for all capital allocations.

### Persona 3: Ankit Verma — Lead Site Engineer
- **Role**: `site_engineer`
- **Core Needs**: Raise material requisitions directly from mobile/tablet at the construction yard, track expected delivery dates, inspect deliveries at weighbridge, log Goods Receipt Notes (GRN) with photo proof of damaged items.
- **Offline Capability**: Queue indents in local storage when site Wi-Fi/cellular signal drops, auto-sync when connection restores.

### Persona 4: Pooja Agarwal — Chief Financial Controller
- **Role**: `finance_controller`
- **Core Needs**: Automated 3-way matching (PO ↔ GRN ↔ Invoice), statutory TDS deductions (2% u/s 194C, 1% u/s 194Q), GST input credit reconciliation, dispute management for overbilled quantities.

---

## 4. Functional Specifications

### 4.1 Vendor Management & Compliance
- **Onboarding Form**: Captures Company name, category (Steel, Cement, Electrical, Plumbing, Sand, Tiles), GSTIN, PAN, bank details, and contact details.
- **Live GSTIN Verification**: Regex format validation combined with GST Portal simulation, identifying registered State code and active taxpayer status.
- **Compliance Dossier**: Document storage for GST REG-06, transit insurance, and trade licenses with automatic alerts for documents expiring within 30 days.
- **Vendor Scoring**: Weighted multi-factor evaluation algorithm:
  $$\text{Score} = (0.35 \times \text{Timeliness}) + (0.35 \times \text{Quality}) + (0.20 \times \text{Pricing}) + (0.10 \times \text{Communication})$$

### 4.2 Digital Indent & Multi-Level Authorization Workflow
- **Requisition Fields**: Project, priority (`urgent`, `normal`, `low`), required delivery date, line items with quantity, unit, and estimated unit rate.
- **Threshold Rule**: Requisitions with estimated total value `>= ₹1,00,000` automatically require Project Director (Meena) or Admin authorization; requisitions `< ₹1,00,000` can be authorized directly by Procurement Manager (Rajesh).
- **Auto-Escalation**: Indents pending for `> 24 hours` are flagged with high-visibility escalation badges.

### 4.3 Purchase Order Generation & Branding
- Converts approved indents into formal POs with contract rates, payment terms, and delivery destination.
- Official printable/PDF Purchase Order formatted with NIST Infra Developers corporate headers, GSTIN, statutory contract clauses, and signature blocks.

### 4.4 Site Goods Receipt Notes (GRN) & Quality Inspection
- Captures delivery challan number, carrier vehicle number, ordered quantity, received quantity, accepted quantity, and rejected quantity.
- Rejection reason logging (water damage, rust, off-gauge rebar) with inspection photo URLs.
- Automatically transitions linked PO to `delivered` status.

### 4.5 Automated 3-Way Matching Engine
- Automated verification between:
  1. Purchase Order (Ordered quantities & agreed unit rates)
  2. Site GRN (Physically accepted vs rejected quantities)
  3. Tax Invoice (Vendor billed quantities & rates)
- Categorizes matching into `MATCHED (100% Passed)` or `MISMATCH DETECTED`.
- Variance diagnostics report exact financial discrepancies and overbilled amounts.
- Statutory TDS calculation (2% u/s 194C / 1% u/s 194Q) with net payable computation.

### 4.6 Rate Intelligence & Quotations
- Side-by-side vendor quotes table.
- Best Value Pick algorithm factoring price competitiveness (60%) and vendor historical reliability rating (40%).
- Historical PO rate trend line charts.

### 4.7 Executive Dashboard & Compliance Reports
- 5 Core KPI stat cards: Total Spend, Pending Approvals, Portfolio Budget Burn %, Maverick Spend Leakage, Compliance Score.
- Recharts visualizations: Spend by Category donut chart, Project Budget vs Actual stacked bar chart, Vendor performance radar, and Procurement cycle time tracker.
- GST reconciliation ledger and immutable system audit trail with CSV export.
