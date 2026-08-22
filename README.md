# 🛡️ INVOICE FRAUD DETECTION SYSTEM
### Enterprise Rule-Based Invoice Fraud Detection, GST Compliance & Forensic Audit Platform

---

## 📌 1. Project Title & Objective

**Project Title**: Invoice Fraud Detection System (FraudShield India)  
**Academic Domain**: FinTech, Forensic Accounting, Information Security & Distributed Systems  
**Context**: Indian Corporate Accounting, Statutory GST Compliance, and Accounts Payable (AP) Fraud Prevention  

### 🎯 Primary Objective
To design, implement, and verify an automated, deterministic fraud detection and forensic audit system capable of identifying fake, duplicate, inflated, manipulated, or non-compliant commercial invoices before payment disbursement.

The system replaces manual, error-prone invoice sampling with a **100% transparent 20-Rule Forensic Engine** that enforces Indian GST law, mathematical integrity, supplier risk profiling, and 3-way Purchase Order matching with zero random scoring.

---

## 🇮🇳 2. Indian Business & Statutory GST Context

FraudShield is built natively for the Indian corporate and taxation ecosystem:
- **Currency**: Indian Rupee (`₹ / INR`) with standard Indian numbering formatting (Lakhs & Crores, e.g., `₹12,45,000.00`).
- **Date Format**: `DD/MM/YYYY` across all user interfaces, exports, and audit trails.
- **Statutory Identifiers**:
  - **GSTIN** (Goods and Services Tax Identification Number): 15-character statutory format with MOD-36 Luhn checksum validation.
  - **PAN** (Permanent Account Number): 10-character alphanumeric format cross-verified with GSTIN characters 3–12.
  - **HSN/SAC**: Harmonized System of Nomenclature & Service Accounting Codes (2 to 8 digits) required on all taxable items.
- **Indian GST Dual Structure**:
  - **Intra-State Supply**: Applicable when Supplier State Code equals Place of Supply State Code. Enforces strict equality: $\text{CGST} = \text{SGST} = \frac{\text{Taxable Value} \times \text{Rate}}{2}$.
  - **Inter-State Supply**: Applicable when Supplier State Code differs from Place of Supply. Enforces $\text{IGST} = \text{Taxable Value} \times \text{Rate}$ and $\text{CGST} = \text{SGST} = 0$.
- **Purchase Order 3-Way Matching**: Cross-matches Billed Quantities, Unit Rates, and Line-Item Totals against approved Purchase Orders with a $+5\%$ statutory tolerance limit.

---

## 🚀 3. Key System Features

| Feature Area | Capabilities |
|:---|:---|
| **Dual Invoice Ingestion** | **1. Drag-and-Drop Document Uploader**: PDF, PNG, JPG with simulated OCR extraction and interactive pre-submission review.<br>**2. Manual Enterprise Entry Form**: Multi-section form with real-time GST tax split and dynamic line-item schedules. |
| **Deterministic Fraud Engine** | **20 Forensic Rules** across 8 financial categories. Accumulates deterministic penalty points capped at $100$. No random scores. |
| **Explainable Fraud Gauge** | Circular SVG meter displaying 4 risk tiers: `LOW (0–24)`, `MEDIUM (25–49)`, `HIGH (50–74)`, `CRITICAL (75–100)` with plain-English verdicts. |
| **GST Tax Discrepancy Matrix** | Side-by-side Expected vs Actual audit comparison for Taxable, CGST, SGST, IGST, Total Tax, and Grand Total with $\pm ₹1.00$ variance tolerance. |
| **3-Way PO Matching Engine** | Compares PO Authorized vs Invoiced vs Allowed Tolerance (+5% limit), line-item rate checks, and vendor identity verification. |
| **Supplier KYC & Risk Matrix** | Vendor profiling, lifetime billed volume, active fraud flags count, and historical fraud scores. |
| **Auditor Decision Suite** | 5 compliance actions: `Approve & Verify`, `Send for Review`, `Mark as Fraud`, `Reject`, and `Live Re-evaluate` with modal justifications. |
| **Fraud Alert Center** | Real-time compliance alert feed with status workflows (`OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`) and auditor assignment. |
| **Executive Dashboard & Analytics** | 10 real-time KPI metrics, capital exposure breakdown, monthly volume trajectories, and Recharts visualizations. |
| **Statutory Report Center** | 4 CSV audit exports (*Invoices Ledger*, *Fraud Exceptions*, *Vendor Risk Matrix*, *System Audit Trail*) with pre-export validation preview. |
| **Immutable Audit Trail** | Cryptographically recorded compliance ledger logging every user login, status transition, alert resolution, and re-evaluation. |

---

## 🛠️ 4. Technology Stack

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 (Bundles in < 14s)
- **Routing**: React Router 6
- **Styling**: Tailwind CSS (Dark/Light mode support)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Area, Bar, Pie, Stacked charts)
- **HTTP Client**: Axios with JWT interceptors

### Backend (Server)
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma ORM v5
- **Database**: SQLite (ACID compliant local relational storage)
- **Authentication**: JWT (JSON Web Tokens) with HTTP Bearer authorization
- **Security**: bcrypt.js password hashing (12 salt rounds)
- **Data Validation**: Zod runtime schema validation
- **File Uploads**: Multer (PDF, PNG, JPG file filter and size limiter)

---

## 🏛️ 5. Architectural Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE OVERVIEW                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   [ PRESENTATION LAYER (React + Vite + Tailwind CSS) ]                                 │
│   ├── Executive Dashboard (10 KPIs, Amount at Risk Breakdown, Risk Matrix)             │
│   ├── Dual Invoice Ingestion (Manual Entry + Drag-and-Drop Document OCR)               │
│   ├── Forensic Invoice Inspector (Score Gauge, 20-Rule Matrix, GST & PO 3-Way Match)   │
│   ├── Fraud Alert Center (Workflow Actions, Inspection Modals, Notification Bell)      │
│   ├── Enterprise Analytics & Quarterly Trends (Recharts)                               │
│   └── Statutory Report Center (Pre-Export Preview, Real-time CSV Streaming)            │
│                                                                                        │
│                                           │ (REST APIs with JWT Bearer Auth)           │
│                                           ▼                                            │
│                                                                                        │
│   [ APPLICATION & API LAYER (Express.js + TypeScript) ]                                │
│   ├── Route Controllers & Zod Schema Validation Guards                                 │
│   ├── Role-Based Access Control Middleware (ADMIN, AUDITOR, FINANCE_USER)              │
│   ├── OCR Document Parsing & Simulated Extraction Pipeline                             │
│   └── Statutory CSV Streaming Engines & Metadata Aggregation                           │
│                                                                                        │
│                                           │ (Context Evaluation)                       │
│                                           ▼                                            │
│                                                                                        │
│   [ FORENSIC FRAUD DETECTION CORE (Deterministic 20-Rule Engine) ]                     │
│   ├── Category 1: Duplicate Detection (DUP-01, DUP-02)                                 │
│   ├── Category 2: GSTIN & PAN Consistency (GST-01, GST-02, GST-03)                     │
│   ├── Category 3: Statutory Tax Validation (TAX-01, TAX-02, TAX-03, TAX-04)           │
│   ├── Category 4: Amount & Historical Anomalies (ANO-01, ANO-02)                       │
│   ├── Category 5: Date Anomalies (DAT-01, DAT-02)                                      │
│   ├── Category 6: Vendor Risk & Prior Violations (VEN-01, VEN-02)                      │
│   ├── Category 7: Purchase Order 3-Way Matching (PO-01, PO-02, PO-03)                  │
│   └── Category 8: Integrity & Mandatory Compliance (MAN-01, MAN-02)                    │
│                                                                                        │
│                                           │ (Prisma Client ORM)                        │
│                                           ▼                                            │
│                                                                                        │
│   [ DATA PERSISTENCE LAYER (SQLite + Prisma Schema) ]                                  │
│   ├── Users, Vendors, Invoices, InvoiceItems, PurchaseOrders, POItems                 │
│   ├── FraudDetections, FraudRuleResults, FraudAlerts, and Immutable AuditLogs          │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ 6. 20-Rule Deterministic Fraud Scoring Matrix

The fraud score is an accumulated sum of deterministic rule penalties, strictly capped at **100 points**:

$$\text{Fraud Score} = \min\left(100, \sum_{i=1}^{20} \text{Penalty}(R_i)\right)$$

### Risk Classification Tiers
- **`LOW` (0–24 pts)**: Clean invoice, valid GSTIN checksum, taxes verified, PO matched.
- **`MEDIUM` (25–49 pts)**: Minor discrepancy or unlinked PO under review.
- **`HIGH` (50–74 pts)**: Significant tax mismatch, vendor risk, or substantial budget overrun.
- **`CRITICAL` (75–100 pts)**: Severe fraudulent indicators (Duplicate invoice, GSTIN forgery, PO hijacking, math tampering). Automatically generates active compliance alerts.

### Complete Rule Catalog

| Code | Rule Name | Category | Severity | Score Penalty | Description |
|:---|:---|:---:|:---:|:---:|:---|
| **DUP-01** | Exact Duplicate Invoice | `DUPLICATE` | `CRITICAL` | $+40$ pts | Same vendor and duplicate invoice number already recorded in ledger. |
| **DUP-02** | Suspicious Clone Amount | `DUPLICATE` | `WARNING` | $+15$ pts | Identical grand total billed within 7 days for the same vendor. |
| **GST-01** | GSTIN Format & Checksum | `GSTIN` | `CRITICAL` | $+35$ pts | Invalid 15-char structure or failed MOD-36 Luhn checksum algorithm. |
| **GST-02** | GSTIN / PAN Consistency | `GSTIN` | `FAIL` | $+25$ pts | Vendor PAN does not match characters 3 to 12 of the vendor GSTIN. |
| **GST-03** | Master Vendor GSTIN Match | `GSTIN` | `CRITICAL` | $+35$ pts | Invoiced GSTIN does not match registered master GSTIN for vendor. |
| **TAX-01** | Statutory Tax Applicability | `TAX` | `FAIL` | $+25$ pts | Intra-state billed with IGST or Inter-state billed with CGST/SGST. |
| **TAX-02** | Tax Math Verification | `TAX` | `FAIL` | $+25$ pts | Computed tax rates ($\text{Taxable} \times \text{Rate}$) deviate from invoice total. |
| **TAX-03** | Intra-State CGST = SGST | `TAX` | `FAIL` | $+25$ pts | Asymmetrical CGST and SGST amounts on an intra-state supply. |
| **TAX-04** | Line Item Sum Match | `TAX` | `FAIL` | $+20$ pts | Sum of itemized line totals does not equal the invoice grand total. |
| **ANO-01** | Historical Average Spike | `ANOMALY` | `FAIL` | $+25$ pts | Billed amount exceeds $3.0\times$ the vendor's historical mean volume. |
| **ANO-02** | Suspicious Round Amount | `ANOMALY` | `WARNING` | $+10$ pts | High-value commercial transaction billed as an exact round number. |
| **DAT-01** | Future Invoice Date | `DATE` | `CRITICAL` | $+30$ pts | Invoice date is post-dated beyond current calendar timestamp. |
| **DAT-02** | Stale Invoice Review | `DATE` | `WARNING` | $+10$ pts | Invoice dated more than 180 days in the past submitted for AP review. |
| **VEN-01** | Unverified Supplier KYC | `VENDOR` | `WARNING` | $+15$ pts | Supplier has not completed statutory KYC registration checks. |
| **VEN-02** | Prior Vendor Fraud History | `VENDOR` | `FAIL` | $+25$ pts | Vendor has active recorded fraud flags or prior compliance incidents. |
| **PO-01** | Unlinked High-Value PO | `PO` | `WARNING` | $+15$ pts | Commercial invoice $\ge ₹50,000$ lacking an approved Purchase Order. |
| **PO-02** | PO Budget Limit Overrun | `PO` | `FAIL` | $+25$ pts | Billed total exceeds authorized PO amount by more than $+5\%$ tolerance. |
| **PO-03** | PO Vendor Identity Mismatch| `PO` | `CRITICAL` | $+35$ pts | Purchase Order authorized for Vendor A is claimed by Vendor B. |
| **MAN-01** | Missing Indian HSN/SAC | `MANIPULATION` | `WARNING` | $+10$ pts | Line items omit mandatory Indian HSN or SAC tax classification codes. |
| **MAN-02** | Missing Mandatory Fields | `MANIPULATION` | `FAIL` | $+20$ pts | Omission of mandatory statutory invoice header fields (GSTIN, POS). |

---

## 🗄️ 7. Database Entity Relationship (Prisma ORM)

```
┌──────────────┐         ┌──────────────┐         ┌───────────────────┐
│    User      │ 1     * │    Invoice   │ 1     * │    InvoiceItem    │
│ (Role, Auth) │─────────│ (Totals, GST)│─────────│  (HSN, Qty, Rate) │
└──────────────┘         └──────────────┘         └───────────────────┘
                                │ 1                         │
                                │                           │
                                │ 1                         │
                                ▼                           │
                         ┌──────────────┐                   │
                         │FraudDetection│                   │
                         │ (Score, Risk)│                   │
                         └──────────────┘                   │
                                │ 1                         │
                                │                           │
                                │ *                         │
                                ▼                           ▼
                         ┌──────────────┐         ┌───────────────────┐
                         │FraudRuleRes. │         │   PurchaseOrder   │
                         │(Rule Results)│         │(PO Number, Amount)│
                         └──────────────┘         └───────────────────┘
                                │                           │ 1
                                │                           │
                                ▼                           ▼ *
                         ┌──────────────┐         ┌───────────────────┐
                         │  FraudAlert  │         │ PurchaseOrderItem │
                         │ (Open/Review)│         │ (Description, HSN)│
                         └──────────────┘         └───────────────────┘
```

---

## 🔑 8. Default Demo Credentials

The database is seeded with 3 distinct organizational roles with strict permissions:

| Role | Email Address | Password | Permissions & Capabilities |
|:---|:---|:---|:---|
| **Administrator** | `admin@fraudshield.in` | `Admin@123` | Full system access: manage users, view all invoices, full analytics, all 4 report exports, and immutable audit logs. |
| **Auditor (CA)** | `auditor.sharma@fraudshield.in` | `Audit@123` | Compliance access: investigate fraud alerts, assign reviewers, resolve alerts, approve/reject/flag invoices, re-evaluate fraud engine, and inspect audit trails. |
| **Finance User** | `finance.patel@fraudshield.in` | `Finance@123` | AP Billing access: submit manual invoices, upload PDF/image documents, view invoice statuses, and generate invoice reports (Audit logs restricted). |

---

## 💻 9. Installation & Running Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project root
cd Invoice-Fraud-Detection-System

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Database Initialization & Seeding

```bash
# From the /server directory:
cd ../server

# Generate Prisma Client and apply migrations
npx prisma generate
npx prisma db push

# Seed master vendors, purchase orders, users, and baseline invoices
npm run seed
```

### Step 3: Run the Complete Application

#### Option A: Windows One-Click Launcher (Recommended)
Simply double-click the file in the project root:
```
START-INVOICE-FRAUD-DETECTION.bat
```
This automatically starts both the backend & frontend, prevents duplicate processes, and opens **`http://localhost:5173`** directly in your default browser.

#### Option B: Terminal Command
From the project root directory:
```bash
npm.cmd run dev
```

This single command uses `concurrently` to start BOTH:
- **Backend API Server**: `http://localhost:5000/api`
- **Frontend Client Application**: `http://localhost:5173`

Visit **`http://localhost:5173`** in your browser to access FraudShield India.

---

## 🧪 10. Automated Test Suite Execution

Run all 5 comprehensive test suites covering **138 automated checks**:

```bash
cd server

# 1. Run Phase 7 College Project Demo Suite
npx ts-node src/tests/phase7Verification.test.ts

# 2. Run Phase 6 Executive Dashboard & Reports Suite
npx ts-node src/tests/phase6Verification.test.ts

# 3. Run Phase 5 Fraud Intelligence & Rule Scenarios Suite
npx ts-node src/tests/phase5Verification.test.ts

# 4. Run Phase 4 Invoice Ingestion & OCR Suite
npx ts-node src/tests/phase4Verification.test.ts

# 5. Run Full End-to-End System Suite
npx ts-node src/tests/e2eVerification.test.ts

# Run Production Typecheck & Builds
npm run typecheck && npm run build
cd ../client && npm run typecheck && npm run build
```

---

## 🎓 11. College Project Demonstration Script

Follow this step-by-step presentation script for academic evaluators:

1. **Sign in as Finance User (`finance.patel@fraudshield.in` / `Finance@123`)**:
   - Navigate to **Manual Entry** (`/invoices/create`).
   - Create a legitimate invoice linked to an approved Purchase Order.
   - Show that the invoice receives **`Score = 0/100 (LOW RISK)`** and is verified.
2. **Demonstrate Drag-and-Drop Document OCR (`/invoices/upload`)**:
   - Upload a sample invoice document (PDF or PNG).
   - Review extracted fields in the interactive review form and submit.
3. **Demonstrate Fraud Detection Scenarios**:
   - **Duplicate Invoice**: Attempt to submit the same invoice number for the same vendor. Show instant triggering of **`DUP-01: CRITICAL (+40 pts)`**.
   - **GST Checksum Tampering**: Change the 15th character of the GSTIN to an invalid character. Show triggering of **`GST-01: CRITICAL (+35 pts)`**.
   - **Tax Math Asymmetry**: Submit intra-state supply with unequal CGST and SGST. Show triggering of **`TAX-03: FAIL (+25 pts)`**.
   - **PO Budget Overrun**: Bill an amount $50\%$ higher than the linked PO limit. Show triggering of **`PO-02: FAIL (+25 pts)`**.
4. **Switch to Auditor Account (`auditor.sharma@fraudshield.in` / `Audit@123`)**:
   - Open **Fraud Alerts Center** (`/alerts`).
   - Show real-time alert created for the critical invoice.
   - Execute **Start Review**, add resolution notes, and **Resolve** the alert.
   - Open the **Invoice Details Page** (`/invoices/:id`).
   - Demonstrate the **Circular Score Gauge**, **GST Discrepancy Matrix**, **3-Way PO Matcher**, and **20-Rule Forensic Breakdown**.
   - Execute an audit action (`Send for Review` or `Mark as Fraud`).
   - Demonstrate live **Re-evaluation**.
5. **Switch to Administrator Account (`admin@fraudshield.in` / `Admin@123`)**:
   - Open **Executive Dashboard** (`/`) to review 10 real-time KPIs and Amount at Risk exposure.
   - Open **Analytics** (`/analytics`) to show monthly trajectories and Supplier Risk Matrix.
   - Open **Reports** (`/reports`), preview report metadata, and download CSV exports.
   - Open **Audit Logs** (`/audit-logs`) to demonstrate the immutable compliance trail. Show that Finance users are restricted with `403 Forbidden`.

---

## 📄 12. License & Academic Attribution
This project was developed as a final-year Capstone Project for demonstration of enterprise fraud detection and automated forensic audit architectures.
