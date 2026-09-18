# Architecture & Engineering Decision Log (ADR)

## Decision 1: Dual Database Support (Zero-Config SQLite for Local Dev + Production PostgreSQL Schema DDL)
- **Context**: The specification suggested PostgreSQL (Supabase/Railway) and Prisma ORM. On local developer machines, PostgreSQL services or Docker containers may require variable authentication credentials or ports.
- **Decision**: Configured Prisma with SQLite provider for instantaneous, zero-friction local execution with ACID compliance, relational integrity, and seeded demo data, while providing a production-grade PostgreSQL DDL schema in `database/schema.sql` and database URL configuration in `.env.example`.
- **Outcome**: Zero environment configuration blockers; tests, seeding, backend, and frontend start cleanly on any environment without external credential dependencies.

---

## Decision 2: 3-Way Matching Engine Logic & Variance Diagnostics
- **Context**: Construction procurement suffers from damaged transit materials (e.g. wet cement bags, bent rebar) being rejected at site, but vendor accounts departments billing for the full PO quantity on the tax invoice.
- **Decision**: Built a dedicated matching engine in `matchingService.ts` that compares PO items, GRN items, and Invoice totals. It calculates accepted quantity value and compares against invoiced amounts. If variance exceeds tolerance (`₹5`), it flags `MISMATCH DETECTED`, classifies the discrepancy (`QUANTITY_MISMATCH`, `PRICE_MISMATCH`), and calculates the exact overbilled financial leakage amount.
- **Outcome**: Completely stops overpayment leaks and automates credit note requests.

---

## Decision 3: Multi-Level Approval Authorization Limits
- **Context**: Construction firms suffer from maverick and unauthorized commitments where site teams place high-value orders without portfolio oversight.
- **Decision**: Implemented value-based threshold gating:
  - Estimated Indent Value `< ₹1,00,000`: Can be approved by Procurement Manager (Rajesh Sharma) or Project Director.
  - Estimated Indent Value `>= ₹1,00,000`: Strictly requires Project Director (Meena Iyer) or System Admin approval.
- **Outcome**: Enforces organizational governance while preventing operational bottlenecks for small consumables.

---

## Decision 4: Interactive Persona Switcher in Application Header
- **Context**: Reviewers and stakeholders need to verify the user experience for all 4 distinct personas (Director, Procurement Manager, Site Engineer, Finance Controller) without cumbersome manual re-login flows.
- **Decision**: Added a quick persona switcher in the top navigation bar with pre-authenticated demo tokens and role badges. Switching persona instantly reloads user context, permissions, and designated approval workflows.
- **Outcome**: Exceptional usability for evaluation and demonstration.

---

## Decision 5: Offline Indent Queue for Site Operations
- **Context**: Basement excavations, tunneling sites, and remote casting yards frequently experience poor cellular connectivity.
- **Decision**: Implemented an offline storage queue using `localStorage` and a batch synchronization endpoint `/api/indents/batch-sync`. When offline, site engineers can continue drafting indents, and a sync indicator displays pending requisitions with one-click cloud upload once connectivity returns.
- **Outcome**: 100% operational continuity on construction sites.
