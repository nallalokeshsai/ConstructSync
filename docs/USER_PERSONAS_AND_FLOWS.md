# User Personas, Journeys & System Workflows

## 1. Persona Journey Maps

### Persona 1: Ankit Verma (Lead Site Engineer)
- **Context**: Working at Tower B foundation of Skyline Heights project. Slab casting scheduled for Wednesday.
- **Trigger**: Noticed TMT 16mm rebar stock is low.
- **Workflow in ConstructSync**:
  1. Opens ConstructSync on site tablet/mobile.
  2. Raises an **Urgent Material Indent** for 50 MT TMT Rebar (16mm) and 30 MT (12mm).
  3. Signal drops -> Indent safely saved to **Offline Queue**.
  4. Cellular signal restored -> Indent auto-syncs to cloud and triggers approval notification.
  5. Once trailer arrives at site gate, opens PO in **Site GRN Receipts**, checks weighbridge slip, inspects bundles.
  6. Accepts 50 MT, takes photo of trailer challan, confirms receipt -> PO automatically marked `delivered`.

---

### Persona 2: Rajesh Sharma (Procurement Manager)
- **Context**: Managing 25 active vendor relationships across 4 construction sites.
- **Trigger**: Receives notification of approved material indents.
- **Workflow in ConstructSync**:
  1. Opens **Rate Intelligence** tab to compare quotes from Tata Tiscon (`₹62,500/MT`) vs Jindal Steel (`₹61,800/MT`).
  2. Checks composite value recommendation: Tata Tiscon has higher reliability (`4.8/5.0`) and 3-day delivery.
  3. Converts Indent to formal **Purchase Order (PO)** with 18% GST and 30-day payment terms.
  4. Clicks **Print / PDF** to generate branded NIST Infra Developers PO and emails it to vendor desk.

---

### Persona 3: Meena Iyer (Project Director)
- **Context**: Oversees ₹400M+ portfolio budget across 4 projects.
- **Trigger**: Monthly board review and capital allocation sign-offs.
- **Workflow in ConstructSync**:
  1. Views **Executive Dashboard** top KPI cards: Portfolio Spend (`₹73.09 L`), Budget Burn (`2.4%`), Maverick Spend (`₹7.14 L`).
  2. Checks **Budget vs Actual Stacked Bar Chart** for threshold breach alerts.
  3. Reviews high-value indents in **Digital Indents** requiring Director sign-off (`>= ₹1,00,000`).
  4. Authorizes requisition with approval comments, immediately unlocking PO generation.

---

### Persona 4: Pooja Agarwal (Finance Controller)
- **Context**: Auditing vendor tax invoices before releasing supplier RTGS/NEFT payments.
- **Trigger**: Supplier submits Tax Invoice for cement shipment.
- **Workflow in ConstructSync**:
  1. Enters invoice into **Automated 3-Way Matching Engine**.
  2. System compares PO ↔ GRN ↔ Invoice.
  3. **Discrepancy Detected**: GRN rejected 60 hardened bags, but invoice billed for full 800 bags.
  4. System flags **MISMATCH DETECTED**, blocks payment release, and computes exact overbilled variance (`₹29,568`).
  5. Automatically calculates Section 194C 2% TDS on accepted goods (`740 bags`).
  6. Clicks **Dispute & Request Credit Note**, preventing capital leakage.

---

## 2. End-to-End Procurement Lifecycle Flow Diagram

```
┌────────────────────────────────────────────────────────┐
│ 1. SITE REQUISITION (Ankit - Site Engineer)           │
│    • Creates digital indent (urgent / normal)          │
│    • Offline queue fallback with automatic sync        │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 2. MULTI-LEVEL THRESHOLD APPROVAL                     │
│    • Total Value < ₹1,00,000  → Approved by PM (Rajesh)│
│    • Total Value >= ₹1,00,000 → Approved by Meena (Dir)│
│    • Escalation triggered if pending > 24 hours        │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 3. RATE INTELLIGENCE & PO RELEASE (Rajesh - PM)       │
│    • Side-by-side vendor quotes comparison             │
│    • Best Value composite pick (60% Price, 40% Score)  │
│    • PO generated with GST, terms, and NIST branding   │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 4. SITE DELIVERY & GRN QUALITY CHECK (Ankit)           │
│    • Weighbridge inspection                            │
│    • Accepted vs Rejected quantities logged            │
│    • Transit damage photo proof attached               │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 5. AUTOMATED 3-WAY MATCHING (Pooja - Finance)          │
│    • PO ↔ GRN ↔ Invoice quantity & rate verification   │
│    • Flag discrepancies & overbilling                  │
│    • Compute Section 194C / 194Q statutory TDS         │
│    • Approved payment release or dispute credit note   │
└────────────────────────────────────────────────────────┘
```
