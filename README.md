# ConstructSync — Construction Procurement Intelligence & Vendor Risk Management System

[![Node.js](https://img.shields.io/badge/Node.js-v24.12.0-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-indigo.svg)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> **Domain:** ConTech / PropTech / Construction Operations  
> **Problem Space:** Procurement Capital Leakage, Vendor Risk & Project Cash Flow — Prescription, Not Just Analytics  
> **Target Users:** Construction PMs, Procurement Directors, CFOs, Site Heads, Finance Controllers  
> **Employer Context:** NIST Infra Developers Pvt Ltd (₹100M+ residential & commercial projects)

---

## 🎯 Executive Overview

In the Indian construction sector, **78% of firms** manage procurement through a chaotic mix of WhatsApp groups, spreadsheets, and paper chits. This leads to **10-15% margin erosion** from unmonitored budget drift, **₹10-50L penalty risks** from non-compliant GST vendors, and **15-20% capital leakage** from off-contract maverick spending.

**ConstructSync** replaces these fragmented workflows with an intelligent, full-stack procurement engine featuring:
1. **Automated 3-Way Matching Engine (PO ↔ GRN ↔ Invoice)** with itemized variance diagnostics.
2. **Multi-Level Threshold Approvals** (Site Eng → PM `< ₹1L` → Director Meena `>= ₹1L`) with auto-escalation (>24h).
3. **Live GSTIN Verification & Compliance Dossier** tracking expiry countdowns (<30 days).
4. **Site GRN with Damaged Material Logging** and photo evidence attachments.
5. **Rate Intelligence & Best Value Recommendation** combining quoted unit prices (60%) with vendor reliability ratings (40%).
6. **Statutory Indian Tax Engine** automating Section 194C/194Q TDS deductions and input GST credit reconciliation.
7. **Offline Site Capability** allowing site engineers to draft indents without signal and sync once connected.

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CONSTRUCTSYNC                          │
├──────────────┬──────────────┬───────────────┬───────────────┤
│   Web App    │  Mobile PWA  │  Vendor Portal│  Admin Panel  │
│  (React.js)  │ (Offline PWA)│   (React.js)  │  (React.js)   │
├──────────────┴──────────────┴───────────────┴───────────────┤
│                    API Gateway (Express.js)                  │
├─────────────┬──────────────┬────────────────┬───────────────┤
│   Vendor    │ Procurement  │   Analytics    │  Compliance   │
│   Service   │   Service    │    Service     │   Service     │
├─────────────┴──────────────┴────────────────┴───────────────┤
│              Prisma ORM (SQLite / PostgreSQL)               │
├─────────────┬──────────────┬────────────────┬───────────────┤
│   Vendors   │     POs      │    Invoices    │   Materials   │
│   Table     │    Table     │     Table      │    Table      │
└─────────────┴──────────────┴────────────────┴───────────────┘
```

- **Frontend:** React 19 + TypeScript + Vite, Ant Design 5.x, Recharts, Lucide React, Axios, Dayjs, Canvas-Confetti.
- **Backend:** Node.js + Express + TypeScript, Prisma ORM, JWT, bcryptjs, Multer.
- **Database:** Prisma SQLite (instant local development) + Production PostgreSQL DDL (`database/schema.sql`).
- **Styling:** Custom CSS design system with Plus Jakarta Sans typography, dark slate navigation, and ConTech safety accents.

---

## 👥 Pre-Configured Personas & Demo Accounts

Use the **Persona Switcher** in the top navigation bar to test any role instantly:

| Persona | Name | Role | Password | Authorization Level |
| :--- | :--- | :--- | :--- | :--- |
| **Project Director** | Meena Iyer | `project_director` | `Password@123` | High-value approvals (`>= ₹1,00,000`), portfolio budget oversight |
| **Procurement Mgr** | Rajesh Sharma | `procurement_manager` | `Password@123` | Standard approvals (`< ₹1,00,000`), PO generation, quote comparison |
| **Site Engineer** | Ankit Verma | `site_engineer` | `Password@123` | Site indents, offline requisitions, weighbridge GRN receipt |
| **Finance Controller** | Pooja Agarwal | `finance_controller` | `Password@123` | 3-way matching, invoice disputes, GST/TDS tax ledger |
| **System Admin** | System Admin | `admin` | `Password@123` | Unrestricted full system access & audit inspection |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+ recommended, verified on v24)
- npm (v9+)
- Git

### 1. Clone & Setup
```bash
git clone <repository_url>
cd constructsync
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
# Backend API runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Frontend Setup (In a new terminal)
```bash
cd ../frontend
npm install
npm run dev
# Frontend web application opens on http://localhost:3000
```

### 4. Running Automated Tests
```bash
cd ../backend
npm test
# Executes 3-way matching engine and procurement rule verification suite
```

---

## 📊 Core Features Walkthrough

### 1. Executive Dashboard
- **5 Core KPI Cards:** Total Committed Spend, Pending Approvals, Portfolio Budget Burn %, Maverick Spend Leakage, Compliance Score.
- **Spend by Category Donut Chart:** Breakdown across Steel, Cement, Electrical, Plumbing, Sand, Tiles.
- **Project Budget vs. Actual Stacked Bar Chart:** Real-time burn rates with 80% threshold alerts.
- **Vendor Performance Radar Chart:** Multi-dimensional matrix (Timeliness, Quality, Pricing, Communication, Compliance).
- **Procurement Cycle Time Funnel:** Stage-by-stage cycle times (Indent → Approval → PO → GRN → Payment) with bottleneck tags.
- **Maverick Spend Table:** Flags off-contract orders with leakage amounts.

### 2. Vendor Management & Compliance
- **Filterable Directory:** Search by company, category, GSTIN, city, and compliance status.
- **Live GSTIN Verification:** Real-time format and portal simulation identifying registration state and taxpayer status.
- **Vendor Profile Dossier:** Comprehensive view of active POs, performance evaluations, and compliance documents with expiry countdowns (<30 days).

### 3. Digital Indents & Multi-Level Approvals
- **Site Requisitions:** Priority levels (`urgent`, `normal`, `low`), required dates, and itemized material rates.
- **Approval Limits:** Automatic threshold gating (`< ₹1L` PM, `>= ₹1L` Director Meena).
- **Auto-Escalation:** Highlights indents pending for `> 24 hours`.
- **Offline Mode:** Draft indents without site signal; syncs automatically once reconnected.

### 4. Branded Purchase Orders
- Converts approved indents to formal POs with contract rates and statutory payment terms.
- **Official Print / PDF Modal:** Formatted with NIST Infra Developers corporate header, GSTIN, line-item tax calculation, and authorized signature blocks.

### 5. Site Goods Receipt Notes (GRN)
- Captures delivery challan, carrier vehicle number, ordered vs received vs accepted vs rejected quantities.
- Damaged material quarantine logging with rejection reasons and photo proof attachments.
- Automatically transitions linked PO to `delivered`.

### 6. Automated 3-Way Matching Engine
- Compares PO ↔ GRN ↔ Invoice.
- Flags mismatches (e.g. `INV-UTC-2026-339` overbilling 60 rejected cement bags) with calculated credit note requirement.
- Calculates Section 194C / 194Q statutory TDS and net payable disbursements.

### 7. Rate Intelligence & Quotations
- Side-by-side vendor quotation comparison.
- **Best Value Pick:** Composite scoring (60% unit rate + 40% reliability rating).
- Historical PO unit rate trends line chart.

### 8. Reports & Audit Trail
- **GST Reconciliation:** Eligible input credits vs disputed GST.
- **TDS Ledger:** Deductions by vendor across projects.
- **Immutable Audit Trail:** Searchable event logs (`USER_LOGIN`, `INDENT_CREATED`, `PO_GENERATED`, `3WAY_MATCH_VERIFIED`) with full JSON metadata and CSV export.

---

## 📁 Repository Structure

```
constructsync/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full relational database schema
│   │   └── seed.ts             # Realistic Indian construction seed data
│   ├── src/
│   │   ├── config/             # Prisma client singleton
│   │   ├── middleware/         # JWT Auth, RBAC, Multer upload
│   │   ├── routes/             # REST API controllers
│   │   ├── services/           # 3-way matching engine, audit service
│   │   └── index.ts            # Express server entrypoint
│   └── test/
│       └── api.test.js         # Automated test suite
├── database/
│   └── schema.sql              # Production PostgreSQL DDL schema
├── docs/
│   ├── PRD.md                  # Comprehensive Product Requirements Document
│   ├── COMPETITIVE_ANALYSIS.md # Feature matrix comparing 5+ ERPs
│   ├── USER_PERSONAS_AND_FLOWS.md # 4 personas, journey maps & diagrams
│   ├── DECISION_LOG.md         # Architecture Decision Records (ADRs)
│   └── POST_LAUNCH_REFLECTION.md # Retrospective & v2 roadmap
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, Persona switcher
│   │   ├── context/            # AuthContext with demo switcher
│   │   ├── services/           # Axios API client
│   │   ├── utils/              # Offline queue & sync utility
│   │   ├── views/              # Dashboard, Vendors, Indents, POs, GRN, Matching, Rates, Reports
│   │   ├── App.tsx             # Root component
│   │   └── index.css           # ConTech enterprise design system
│   └── vite.config.ts          # Vite configuration with API proxy
└── README.md
```

---

## 📄 License

ConstructSync is licensed under the MIT License.
