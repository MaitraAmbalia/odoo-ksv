# VendorBridge — Design & Frontend Specification
> **For:** Antigravity execution team  
> **Stack:** PostgreSQL · Prisma · Express · TypeScript · Node.js · React · Socket.io · Docker  
> **Scope:** Full frontend implementation spec with UX rationale, component inventory, and interaction design  
> **Version:** 1.0 — Hackathon Build

---

## Table of Contents
1. [User Research & UX Rationale](#1-user-research--ux-rationale)
2. [Design System](#2-design-system)
3. [Information Architecture](#3-information-architecture)
4. [Page-by-Page Specifications](#4-page-by-page-specifications)
5. [Component Library](#5-component-library)
6. [Real-Time & Socket.io](#6-real-time--socketio)
7. [Frontend Project Structure](#7-frontend-project-structure)
8. [Tech Stack & Dependencies](#8-tech-stack--dependencies)
9. [Docker Setup](#9-docker-setup)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. User Research & UX Rationale

### 1.1 Synthesized User Personas

**Persona A — Priya (Procurement Officer, 29)**  
Works in a mid-size manufacturing firm. Raises 8–15 RFQs/month. Biggest pain: chasing vendors for quotations over WhatsApp, then copy-pasting numbers into Excel to compare. Hates switching tabs. Needs: one-screen quotation comparison, fast RFQ creation with pre-filled vendor lists, clear status indicators.

**Persona B — Rahul (Approving Manager, 44)**  
Reviews 20+ approval requests/week. Often traveling; reviews on phone. Biggest pain: long approval emails with no context, can't trace what was decided previously. Needs: a focused "pending actions" queue, side-by-side comparison summary within the approval view, one-tap approve/reject with remarks.

**Persona C — Sunita (Vendor, 38)**  
Sales manager at a components supplier. Responds to RFQs from 6 buyers simultaneously. Biggest pain: each buyer uses a different format, she never knows if her quote was seen. Needs: clear deadline visibility, draft save before final submit, confirmation that submission was received.

**Persona D — Vikram (Admin, 35)**  
IT admin who also manages user onboarding and vendor approval. Biggest pain: no visibility into who is doing what, vendors get stuck in "pending" with no workflow. Needs: a clean vendor pipeline view, user management table, audit logs with filters.

### 1.2 Key UX Insights & Design Decisions

| Insight | Design Decision |
|---------|-----------------|
| Officers lose track of "where is this RFQ" | Persistent status chip on every RFQ card; timeline sidebar on detail views |
| Managers need mobile-first approval UI | Approval queue card is thumb-friendly; no dense tables on mobile |
| Vendors distrust "submitted" without proof | Timestamped submission confirmation toast + email receipt (via backend) |
| Comparison is the hardest cognitive task | Dedicated full-screen comparison matrix; lowest price auto-highlighted in green |
| Audit trail matters for compliance | Activity log is prominent, not buried; every state change writes a log entry |
| Notifications get ignored in notification panels | Bell badge with count + a non-dismissable "Pending Approvals" banner for managers |

### 1.3 Added Features (Beyond Problem Statement)

These additions emerged from persona analysis and increase real-world usability:

- **Vendor Score Card** — a simple 1–5 star rating on each vendor record based on past PO history (on-time delivery, accepted quotes ratio). Visible in comparison view.
- **RFQ Deadline Countdown** — a live countdown chip on published RFQs so vendors know urgency.
- **Quick Quote Compare from Dashboard** — manager can open the comparison panel directly from the dashboard's "Pending Approvals" card without navigating to the RFQ.
- **Bulk Vendor Invite** — when creating an RFQ, officers can select a vendor category and bulk-invite all active vendors in that category.
- **Invoice Preview before Send** — full PDF preview modal before the "Send via Email" action.
- **Dark Mode** — system preference auto-detected; manual toggle in settings.
- **Keyboard Shortcuts** — `N` to create new RFQ, `A` to jump to approvals queue, `?` to show help.

---

## 2. Design System

### 2.1 Aesthetic Direction

**Theme:** Enterprise Clarity — "the Bloomberg Terminal got a spa day"  
Crisp, information-dense but never cluttered. Dark sidebar with high-contrast content area. Monospaced accents for numbers (PO numbers, amounts, dates feel like data). Zero decorative gradients. Every color earns its place by encoding meaning.

### 2.2 Color Tokens

```css
/* --- Semantic (light mode defaults, overridden in .dark) --- */
:root {
  /* Brand */
  --vb-brand-600: #1A56DB;    /* Primary action, links */
  --vb-brand-100: #E1EAFE;    /* Brand tint backgrounds */
  --vb-brand-700: #1447BF;    /* Hover on primary actions */

  /* Surface */
  --vb-surface-base:    #FFFFFF;
  --vb-surface-raised:  #F9FAFB;   /* Cards */
  --vb-surface-overlay: #F3F4F6;   /* Sidebar, table header */
  --vb-surface-sidebar: #111827;   /* Dark sidebar */

  /* Text */
  --vb-text-primary:   #111827;
  --vb-text-secondary: #6B7280;
  --vb-text-muted:     #9CA3AF;
  --vb-text-on-dark:   #F9FAFB;
  --vb-text-on-dark-muted: #9CA3AF;

  /* Border */
  --vb-border:        #E5E7EB;
  --vb-border-strong: #D1D5DB;

  /* Status — always use these for status chips */
  --vb-status-draft-bg:      #F3F4F6; --vb-status-draft-text:      #374151;
  --vb-status-pending-bg:    #FEF3C7; --vb-status-pending-text:    #92400E;
  --vb-status-active-bg:     #D1FAE5; --vb-status-active-text:     #065F46;
  --vb-status-rejected-bg:   #FEE2E2; --vb-status-rejected-text:   #991B1B;
  --vb-status-approved-bg:   #DBEAFE; --vb-status-approved-text:   #1E40AF;
  --vb-status-sent-bg:       #EDE9FE; --vb-status-sent-text:       #5B21B6;
  --vb-status-paid-bg:       #D1FAE5; --vb-status-paid-text:       #065F46;
  --vb-status-overdue-bg:    #FEE2E2; --vb-status-overdue-text:    #991B1B;

  /* Chart */
  --vb-chart-1: #1A56DB;
  --vb-chart-2: #10B981;
  --vb-chart-3: #F59E0B;
  --vb-chart-4: #EF4444;
  --vb-chart-5: #8B5CF6;

  /* Spacing */
  --vb-radius-sm: 4px;
  --vb-radius-md: 8px;
  --vb-radius-lg: 12px;
  --vb-radius-xl: 16px;

  /* Shadow */
  --vb-shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --vb-shadow-dropdown: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}

/* Dark Mode */
.dark {
  --vb-surface-base:    #111827;
  --vb-surface-raised:  #1F2937;
  --vb-surface-overlay: #374151;
  --vb-surface-sidebar: #0D1117;
  --vb-text-primary:    #F9FAFB;
  --vb-text-secondary:  #9CA3AF;
  --vb-text-muted:      #6B7280;
  --vb-border:          #374151;
  --vb-border-strong:   #4B5563;
}
```

### 2.3 Typography

```css
/* Import in index.html */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', 'Fira Code', monospace;
}

/* Scale */
/* h1: 24px/600  — Page titles */
/* h2: 20px/600  — Section headers */
/* h3: 16px/500  — Card headers */
/* body: 14px/400 — Default */
/* small: 12px/400 — Captions, chips */
/* mono: 13px/500 — PO numbers, amounts, dates */
```

### 2.4 Iconography

Use **Lucide React** exclusively. No icon should exceed 20px in navigation; action icons are 16px inline.

```tsx
import { FileText, Building2, CheckCircle2, Package, Receipt, Bell, BarChart2, Settings, LogOut, ChevronRight, Plus, Search, Filter, Download, Mail, Printer } from 'lucide-react';
```

### 2.5 Motion Principles

- **Page transitions:** `framer-motion` fade + 4px translateY. Duration 180ms ease-out.
- **Modals/Drawers:** slide from right (drawer), scale from center (modal). 200ms.
- **Toast notifications:** slide in from top-right. Auto-dismiss 4s.
- **Status transitions:** color cross-fade 150ms.
- **Skeleton loading:** shimmer animation on all async data containers.
- **No bounce, no spring** — this is enterprise, keep it crisp.

---

## 3. Information Architecture

### 3.1 Navigation Structure

```
/ (redirect based on role)
├── /login
├── /register
│
├── /dashboard              ← Role-adaptive (different cards per role)
│
├── /vendors
│   ├── /vendors             ← List + search
│   ├── /vendors/new         ← Register vendor (Admin only)
│   └── /vendors/:id         ← Vendor profile + history
│
├── /rfqs
│   ├── /rfqs                ← List (with filters)
│   ├── /rfqs/new            ← Create RFQ
│   ├── /rfqs/:id            ← RFQ detail + quotation list
│   └── /rfqs/:id/compare    ← Quotation comparison matrix
│
├── /quotations
│   └── /quotations/mine     ← Vendor's own quotations (VENDOR role only)
│
├── /approvals
│   └── /approvals           ← Queue with detail panel
│
├── /purchase-orders
│   ├── /purchase-orders     ← List
│   └── /purchase-orders/:id ← PO detail + invoice status
│
├── /invoices
│   ├── /invoices            ← List
│   └── /invoices/:id        ← Invoice detail (print/email/download)
│
├── /activity-logs           ← Admin + entity-filtered views
├── /reports                 ← Charts + export (Admin/Manager)
│
└── /settings
    └── /settings            ← Profile, password, notifications, appearance
```

### 3.2 Role-Based Route Guards

```tsx
// Route access matrix
const ROUTE_ROLES = {
  '/vendors/new':           ['ADMIN'],
  '/vendors/:id/edit':      ['ADMIN'],
  '/rfqs/new':              ['ADMIN', 'PROCUREMENT_OFFICER'],
  '/rfqs/:id/compare':      ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'],
  '/quotations/mine':       ['VENDOR'],
  '/approvals':             ['ADMIN', 'MANAGER'],
  '/purchase-orders':       ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'],
  '/invoices':              ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'],
  '/reports':               ['ADMIN', 'MANAGER'],
  '/activity-logs':         ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'],
};
```

---

## 4. Page-by-Page Specifications

---

### 4.1 Authentication — `/login` & `/register`

**Layout:** Split-screen. Left: dark brand panel (40%). Right: form (60%).  
**Brand panel:** VendorBridge logo, tagline, and 3 social-proof stats ("1,200+ vendors", "₹85M+ in POs processed", "99.9% uptime").  

**Login Form:**
```
[ Email input            ]
[ Password input + eye   ]
[ Forgot password link   ]
[ Sign In button (full width, primary) ]
[ ─────── or ─────────  ]
[ Don't have an account? Register ]
```

**Register Form (multi-step, 2 steps):**
- Step 1: First name, Last name, Email, Phone, Country (dropdown)
- Step 2: Password, Confirm password, Role selector (card-style: Procurement Officer / Manager / Vendor — Admin created by invitation only), Vendor-specific: Company Name, GST Number, Category (shown only when role=Vendor)

**Validation rules (Zod, mirrored from backend):**
- Email: valid format
- Password: min 8 chars, must contain 1 uppercase, 1 number
- GST Number: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`

**Error handling:** inline field errors on blur. API error toast top-right.

**Forgot Password:** Full-page centered form. Email input → "We'll send a reset link". (Backend can be stub for hackathon — just show success toast.)

---

### 4.2 Dashboard — `/dashboard`

**Layout:** Top KPI strip + two-column content (2/3 main + 1/3 sidebar).

#### KPI Cards (role-adaptive)

**ADMIN / MANAGER view:**
```
[ Active RFQs ] [ Pending Approvals 🔴 ] [ POs This Month ] [ Overdue Invoices 🔴 ] [ Spend This Month ]
```

**PROCUREMENT_OFFICER view:**
```
[ My Active RFQs ] [ Awaiting Quotations ] [ POs Created ] [ Invoices Sent ] [ Total Spend ]
```

**VENDOR view:**
```
[ Open RFQ Invites ] [ My Quotations ] [ Active POs ] [ Pending Invoices ] [ Total Billed ]
```

Each KPI card:
```
[ Icon ]  ₹2,30,00,000      ← 24px mono font
          Spend This Month  ← 12px muted
          ↑ 12% vs last month  ← trend indicator (green/red)
```

#### Main Content Area

**Pending Approvals (Manager/Admin):** Card list. Each item shows:  
`RFQ Title | Vendor Name | Amount | Submitted N days ago | [Approve] [Reject]`  
Max 5 items. "View all" → `/approvals`.

**Recent RFQs (Officer/Admin):** Table with status chips. Columns: Title, Category, Deadline, Status, Vendors, Actions.

**Recent POs (All permitted):** Compact table. Columns: PO#, Vendor, Amount, Date, Status.

**Vendor Quotation Feed (Vendor):** "New invites" banner if unread. Card list of open RFQs they're invited to.

#### Sidebar
- **Activity Feed:** Real-time (Socket.io). Last 10 events as a timeline. Each: icon + action text + time ago. Color-coded by event type.
- **Notifications:** Unread count badge. Click to expand list. "Mark all read" button.
- **Quick Actions:** Role-based. Officer: "New RFQ" button. Manager: "Pending Approvals" button with count badge.

**Analytics mini-charts (Admin/Manager only, bottom of main area):**
- Bar chart: Monthly spend (last 6 months) using **Recharts**
- Donut chart: POs by category

---

### 4.3 Vendor Management — `/vendors`

**List View:**

**Header:** `Vendors (142)` + Search bar + Filter dropdown (Status: All/Active/Pending/Blocked, Category: multi-select) + `+ Register Vendor` button (Admin only).

**Table columns:**
| # | Company | Category | GST | Contact | Status | Rating | Actions |
|---|---------|----------|-----|---------|--------|--------|---------|

- Status: `<StatusChip>` component (see 5.3)
- Rating: `<StarRating readonly value={vendor.rating} />` (5 stars, half-star precision)
- Actions: `[View]` (all roles), `[Edit]` `[Block/Activate]` (Admin only)

**Empty state:** Illustration + "No vendors match your filters. Try adjusting the search." with a "Clear filters" link.

**Vendor Registration (`/vendors/new`):**  
Full-page form (no modal — forms this long deserve a page).  
Fields: User Email (to link), Company Name, Category (select from predefined list), GST Number, Contact Phone, Address (textarea), Status default=PENDING.  
On submit: `POST /api/v1/vendors` → success → redirect to `/vendors/:id`.

**Vendor Profile (`/vendors/:id`):**  
Two-column layout.

Left (60%):
- Header: Company logo placeholder (initials avatar) + Company Name + Status chip + Rating
- Details grid: Category, GST, Phone, Address, Member since
- Edit button (Admin)

Right (40%):
- **Tab group:** Past RFQs | Quotations History | POs | Performance
  - Performance tab: 3 stats cards — Win Rate, Avg Delivery Days, Total Value Contracted
  - Quotations: compact table with RFQ title, amount, status, date

---

### 4.4 RFQ Management — `/rfqs`

**List View:**

Filters bar: `[All] [Draft] [Published] [Closed] [Cancelled]` + Search + Date range.

**Card-style list** (not table — cards show more context):
```
┌─────────────────────────────────────────────────────┐
│ [PUBLISHED]  Office Furniture Q2 FY2026             │
│ Category: Furniture  │  Deadline: 3 days left 🔴    │
│ Items: 3  │  Vendors: 5 invited  │  Quotations: 3   │
│ Created by Priya S.  │  Jun 4, 2026                 │
│ [View Details]  [Compare Quotations]  [Close RFQ]   │
└─────────────────────────────────────────────────────┘
```

"Compare Quotations" button is disabled (grayed) until at least 2 quotations are submitted.

**Create RFQ (`/rfqs/new`):**  
3-section form:

**Section 1: RFQ Details**
```
Title*              [_________________________]
Category*           [Dropdown ▾]
Description         [Textarea___________________]
Deadline*           [Date picker]
```

**Section 2: Items**  
Dynamic table with "Add Item" button:
```
| Item Name* | Quantity* | Unit* | [Remove] |
| [________] | [_______] | [___] |    🗑    |
[+ Add Item]
```

**Section 3: Assign Vendors**  
Search + multi-select with category filter. Selected vendors shown as chips below. Bulk invite by category button: "Invite all Furniture vendors (12)".

**Form actions:** `[Save as Draft]` `[Publish RFQ]`  
Publish action shows a confirmation modal: "This will notify 5 vendors by email and in-app notification. Continue?"

**RFQ Detail (`/rfqs/:id`):**  
2-column layout.

Left column (70%):
- RFQ header (title, status, deadline countdown)
- Items table (read-only)
- **Quotations received section:** Table listing all submitted quotations. Columns: Vendor, Grand Total, Delivery Days, Submitted, Status. Each row: `[View]` button.
- Compare button (prominent, disabled until 2+ submitted)

Right column (30%):
- **RFQ Timeline:** vertical stepper showing state changes with timestamps
- Invited vendors list with submission status per vendor (Submitted ✓ / Awaiting...)
- Status action bar: Officer can Publish / Close / Cancel based on current state

---

### 4.5 Quotation Submission — `/rfqs/:id/quotations/new` (Vendor)

Vendor sees the RFQ items on the left, fills in pricing on the right.

**Split-screen layout:**

Left (40%) — **RFQ Summary** (read-only):
```
Office Furniture Q2 FY2026
Deadline: 3 days remaining

Items:
┌─────────────────────────┐
│ Ergonomic Chair  × 25   │
│ Standing Desk    × 10   │
└─────────────────────────┘
```

Right (60%) — **Your Quotation:**
```
[ GST Rate %: 18 ▾ ]  [ Tax Type: Intra-State ▾ ]
[ Delivery Days: ____ ]
[ Payment Terms: ____________ ]

Items pricing:
┌─────────────────────┬──────────────┬────────────┐
│ Item                │ Unit Price ₹ │ Total      │
├─────────────────────┼──────────────┼────────────┤
│ Ergonomic Chair ×25 │ [_________]  │ ₹87,500    │  ← auto-calc
│ Standing Desk ×10   │ [_________]  │ ₹82,000    │  ← auto-calc
└─────────────────────┴──────────────┴────────────┘

Subtotal:   ₹1,69,500
CGST (9%):  ₹  15,255
SGST (9%):  ₹  15,255
─────────────────────
Grand Total: ₹2,00,010

Notes / Terms:
[ Textarea ________________________ ]

[Save Draft]           [Submit Quotation →]
```

Grand Total updates live as user types unit prices. "Submit" shows confirmation: "Once submitted, the buyer can see your quotation. You can still edit it until the RFQ closes."

**Edit quotation:** Same page pre-populated. Shows `[SUBMITTED]` chip. Can re-submit.

---

### 4.6 Quotation Comparison — `/rfqs/:id/compare`

> This is the most critical screen in the app. Make it excellent.

**Full-page layout. No sidebar here — maximum horizontal space.**

**Header:**  
`Comparing 4 Quotations — Office Furniture Q2 FY2026`  
Sort by: `[Price ▾] [Delivery] [Rating]`  
Highlight: `[✓ Lowest Price] [✓ Fastest Delivery]`

**Comparison Matrix:**

Sticky left column = Item Names.  
Each vendor = one column.

```
                    ┌────────────────┬────────────────┬────────────────┬────────────────┐
                    │ ABC Furniture  │ XYZ Traders    │ Prime Supplies │ Global Furnish │
                    │ ★★★★½         │ ★★★           │ ★★★★★         │ ★★★★          │
├───────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ Ergonomic Chair   │ ₹3,500/u      │ ₹3,200/u 🟢   │ ₹3,800/u      │ ₹3,600/u      │
│ Standing Desk     │ ₹8,200/u      │ ₹8,500/u      │ ₹7,900/u 🟢   │ ₹8,100/u      │
├───────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ Subtotal          │ ₹1,69,500      │ ₹1,65,000      │ ₹1,67,500      │ ₹1,69,000      │
│ GST (18%)         │ ₹30,510        │ ₹29,700        │ ₹30,150        │ ₹30,420        │
│ Grand Total       │ ₹2,00,010      │ ₹1,94,700 🟢   │ ₹1,97,650      │ ₹1,99,420      │
│ Delivery Days     │ 10 days        │ 14 days        │ 7 days 🟢      │ 10 days        │
│ Payment Terms     │ 30 days        │ 45 days        │ 30 days        │ 30 days        │
│ Vendor Rating     │ ★★★★½         │ ★★★           │ ★★★★★         │ ★★★★          │
├───────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│                   │ [Select]       │ [Select]       │ [Select]       │ [Select]       │
└───────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘
```

- 🟢 = lowest value for that row (auto-calculated, not a static icon)
- "Select" triggers: `POST /rfqs/:id/comparison/select { quotationId }` → opens a confirmation modal
- Confirmation modal: "This will accept XYZ Traders' quotation and send it for manager approval. All other quotations will be marked as Rejected. Continue?"
- After selection → redirect to `/rfqs/:id` with a success banner "Quotation submitted for approval. Manager will be notified."

---

### 4.7 Approval Workflow — `/approvals`

**Layout:** Master-detail split (list left, detail right — like an email client).

**Left panel (40%):**

Tabs: `[Pending (5)] [Approved] [Rejected]`

Each approval card in the list:
```
┌──────────────────────────────────────┐
│ [PENDING]  Office Furniture Q2       │
│ Vendor: XYZ Traders                  │
│ Amount: ₹1,94,700  │  3 days ago     │
│ Submitted by: Priya S.               │
└──────────────────────────────────────┘
```

**Right panel (60%) — Approval Detail:**

When an item is clicked:
```
Approval for: Office Furniture Q2 FY2026
───────────────────────────────────────
Selected Vendor:   XYZ Traders ★★★
Grand Total:       ₹1,94,700
Delivery:          14 days
Payment Terms:     45 days

Quotation Summary (vs alternatives):
┌─────────────────┬────────────────────┐
│ Metric          │ XYZ Traders        │
├─────────────────┼────────────────────┤
│ Price           │ ₹1,94,700 🟢 Lowest│
│ Delivery        │ 14 days            │
│ Rating          │ ★★★               │
└─────────────────┴────────────────────┘

Why this was selected: (Officer's note, if any)

Approval Remarks:
[ Textarea: Add your remarks... ]

[✗ Reject]              [✓ Approve →]
```

Both buttons trigger confirmation modals. Approve → auto-creates PO (shown in a success toast with PO number). Reject → requires non-empty remarks.

**Mobile view:** List becomes full page. Tap opens detail as a bottom sheet / full page.

---

### 4.8 Purchase Orders — `/purchase-orders`

**List:**  
Table. Columns: PO Number (mono font), Vendor, RFQ Title, Grand Total, Issued Date, Status, Actions.

Row actions: `[View]` `[Cancel]` (Admin/Officer only, disabled if invoice exists).

**PO Detail (`/purchase-orders/:id`):**  
Official PO document layout — designed to look printable.

```
╔══════════════════════════════════════════════════════════╗
║  VendorBridge                          PURCHASE ORDER    ║
║  ─────────────────────────────────────────────────────   ║
║  PO Number:  PO-2026-0042              Date: Jun 5, 2026 ║
║  ─────────────────────────────────────────────────────   ║
║  Vendor:                    Bill To:                     ║
║  XYZ Traders                Acme Manufacturing Ltd.      ║
║  GST: 22AAAAA0000A1Z5       GST: 27BBBBB1111B2Z6        ║
║  ─────────────────────────────────────────────────────   ║
║  # │ Item              │ Qty │ Unit Price │ Total        ║
║  1 │ Ergonomic Chair   │ 25  │ ₹3,200     │ ₹80,000      ║
║  2 │ Standing Desk     │ 10  │ ₹8,500     │ ₹85,000      ║
║  ─────────────────────────────────────────────────────   ║
║                            Subtotal:    ₹1,65,000        ║
║                            CGST (9%):   ₹14,850          ║
║                            SGST (9%):   ₹14,850          ║
║                            Grand Total: ₹1,94,700 🟢     ║
║  ─────────────────────────────────────────────────────   ║
║  Delivery: 14 days   │  Payment Terms: 45 days           ║
╚══════════════════════════════════════════════════════════╝
```

Actions below the document: `[Generate Invoice]` `[Cancel PO]` `[Print]`

---

### 4.9 Invoice Generation & Management — `/invoices`

**List:**  
Table. Columns: Invoice #, PO #, Vendor, Amount, Due Date, Status, Actions.

Status chips: DRAFT / SENT / PAID / OVERDUE / CANCELLED.

Overdue invoices have a red `!` indicator in the Status column.

**Invoice Detail / Creation (`/invoices/:id` or `/invoices/new?poId=:poId`):**

**Create flow:** Pre-filled from PO data. Officer can adjust: Due Date, GST Rate (default from quotation), Notes. Tax type auto-calculated. Preview before save.

**Invoice Document view** (same printable layout as PO):
```
╔══════════════════════════════════════════════════════════╗
║  VendorBridge                                  INVOICE   ║
║  Invoice #: INV-2026-0042    Date: Jun 5, 2026           ║
║  PO Ref:    PO-2026-0042     Due:  Jul 5, 2026           ║
║  Status: [DRAFT]                                         ║
║  ─────────────────────────────────────────────────────   ║
║  [items table same as PO]                                ║
║  ─────────────────────────────────────────────────────   ║
║  Subtotal:  ₹1,65,000                                    ║
║  CGST 9%:   ₹14,850                                      ║
║  SGST 9%:   ₹14,850                                      ║
║  Grand Total: ₹1,94,700                                  ║
║  ─────────────────────────────────────────────────────   ║
║  Notes: [editable in DRAFT status]                       ║
╚══════════════════════════════════════════════════════════╝
```

**Action bar below document:**
```
[📄 Download PDF]  [🖨 Print]  [📧 Send via Email]  [✓ Mark as Paid]  [✗ Cancel]
```

**Send via Email flow:**
1. Click "Send via Email"
2. Preview modal: shows the invoice PDF preview (rendered via `react-pdf` or an iframe to `/api/v1/invoices/:id/pdf`)
3. To field (pre-filled with vendor email, editable), Subject (pre-filled), Notes
4. Confirm → `POST /api/v1/invoices/:id/send` → status → SENT → toast: "Invoice sent to vendor@email.com"

**Print:** `window.print()` with a CSS `@media print` stylesheet that hides sidebar, header, action bar — shows only the invoice document.

---

### 4.10 Activity Logs — `/activity-logs`

**Layout:** Filters row + timeline list.

Filters:
```
[Entity Type ▾: All/RFQ/Vendor/Quotation/Approval/PO/Invoice]
[User ▾]  [Date Range: __ to __]  [Search action...]
```

**Timeline list:**
```
Jun 5, 2026 — 3:42 PM
  📄  Priya S.  created RFQ "Office Furniture Q2 FY2026"     [View RFQ →]

Jun 5, 2026 — 4:15 PM
  📬  Vendor "XYZ Traders"  submitted quotation for RFQ #042  [View Quotation →]

Jun 5, 2026 — 5:01 PM
  ✅  Rahul M. (Manager)  approved Approval #027               [View PO →]
```

Color-coded event icons by type (blue=RFQ, green=approval/PO, amber=quotation, purple=invoice).

Entity links navigate to the relevant detail page.

Paginated: 50 entries per page with a "Load more" button.

---

### 4.11 Reports & Analytics — `/reports`

**Layout:** Period selector header + grid of charts.

**Period selector:** `[This Week] [This Month] [This Quarter] [Custom ▾]`  
Date range filter applies to all charts.

**Chart grid:**

Row 1 (2 columns):
- **Monthly Procurement Spend** (line/bar combo chart, Recharts) — bars = PO value, line = invoice paid
- **Procurement by Category** (donut chart) — spend distribution

Row 2 (2 columns):
- **Vendor Performance** (horizontal bar chart) — Top 10 vendors by win rate + avg delivery
- **Invoice Aging** (stacked bar) — bucket: 0-30 days, 31-60, 61-90, 90+ overdue

Row 3 (full width):
- **Approval Cycle Time** (scatter plot) — days from RFQ publish to PO issue, by category

**Export buttons** per chart: `[Download CSV]` `[Download PNG]`

**Summary cards above charts:**
```
[ Total Spend: ₹2.3Cr ]  [ POs Raised: 142 ]  [ Avg Approval Time: 2.3 days ]  [ Overdue: ₹14.2L ]
```

---

### 4.12 Settings — `/settings`

**Tab navigation:**

**Profile tab:**
- Avatar (initials circle, no upload in hackathon scope)
- Edit: First name, Last name, Phone, Country
- Save button

**Security tab:**
- Current password, New password, Confirm password
- Change password button

**Notifications tab:**
- Toggle switches for: RFQ Invites, Quotation Received, Approval Needed, PO Issued, Invoice Sent, Invoice Overdue
- Email notifications vs in-app only

**Appearance tab:**
- Theme: System / Light / Dark (card-style selector)
- Density: Comfortable / Compact

---

## 5. Component Library

### 5.1 Layout Components

```tsx
// AppShell.tsx — Root layout wrapper
// Structure:
// <div class="flex h-screen">
//   <Sidebar />          ← fixed left, dark bg, 64px collapsed / 240px expanded
//   <main class="flex-1 overflow-auto">
//     <TopBar />         ← sticky, white, breadcrumbs + notifications + avatar
//     <div class="p-6">  ← page content
//       {children}
//     </div>
//   </main>
// </div>

interface AppShellProps {
  children: React.ReactNode;
}
```

```tsx
// Sidebar.tsx — Collapsible dark sidebar
// - Logo top-left
// - Nav items with icon + label (collapses to icon-only)
// - Role-based nav items (hide inaccessible items entirely)
// - Bottom: Settings + Logout

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: number; // for notification counts
}
```

```tsx
// TopBar.tsx
// - Breadcrumbs (auto-generated from route)
// - Global search (Cmd+K / Ctrl+K) → modal with recent items + search
// - Notification bell (badge count from Socket.io)
// - User avatar → dropdown: Profile, Settings, Logout
// - Dark mode toggle
```

```tsx
// PageHeader.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode; // buttons slot
  breadcrumb?: BreadcrumbItem[];
}
```

### 5.2 Data Display Components

```tsx
// DataTable.tsx — Reusable table with sorting, pagination, row selection
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  pagination?: PaginationState;
  onPaginationChange?: (state: PaginationState) => void;
  loading?: boolean;
  emptyMessage?: string;
}
// Uses TanStack Table v8
```

```tsx
// KPICard.tsx — Dashboard metric card
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: { value: number; direction: 'up' | 'down'; label: string };
  icon?: LucideIcon;
  color?: 'default' | 'warning' | 'danger' | 'success';
  loading?: boolean;
}
```

```tsx
// ActivityFeed.tsx — Real-time activity timeline
interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  user: { firstName: string; lastName: string };
  createdAt: string;
  meta?: Record<string, unknown>;
}
interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
}
```

### 5.3 Status & Visual Components

```tsx
// StatusChip.tsx — Unified status display
type StatusVariant =
  | 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'        // RFQ
  | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'   // Quotation
  | 'PENDING' | 'APPROVED'                                  // Approval
  | 'ISSUED'                                                // PO
  | 'SENT' | 'PAID' | 'OVERDUE'                            // Invoice
  | 'ACTIVE' | 'BLOCKED';                                   // Vendor

interface StatusChipProps {
  status: StatusVariant;
  size?: 'sm' | 'md';
}

// Implementation: uses CSS variables from section 2.2
// Example: APPROVED → bg:#DBEAFE text:#1E40AF, rounded-full, 12px font
```

```tsx
// DeadlineCountdown.tsx — Live countdown for RFQ deadlines
interface DeadlineCountdownProps {
  deadline: string; // ISO date
  variant?: 'chip' | 'inline';
}
// 3+ days: green, 1-3 days: amber, <1 day: red + pulsing
```

```tsx
// StarRating.tsx
interface StarRatingProps {
  value: number;    // 0-5, accepts 0.5 increments
  readonly?: boolean;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}
```

```tsx
// EmptyState.tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  illustration?: 'rfq' | 'vendor' | 'approval' | 'invoice' | 'generic';
}
```

```tsx
// SkeletonLoader.tsx — Shimmer loading states
// Variants: 'table-row', 'card', 'kpi-card', 'text-block'
```

### 5.4 Form Components

All form components use **React Hook Form** + **Zod** resolvers.

```tsx
// All inputs extend base props:
interface BaseInputProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

// TextInput, NumberInput, SelectInput, MultiSelectInput,
// TextareaInput, DatePickerInput, ToggleInput, SearchInput

// Compound:
// RFQItemsTable — dynamic rows for RFQ item management
// VendorMultiSelect — searchable vendor picker with category filter
// PricingTable — editable quotation item prices with live totals
```

### 5.5 Feedback Components

```tsx
// Toast.tsx — uses react-hot-toast
// Variants: success, error, warning, info
// Auto-dismiss 4s. Max 3 visible at once.

// ConfirmModal.tsx — Reusable confirmation dialog
interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;  // default: "Confirm"
  cancelLabel?: string;   // default: "Cancel"
  variant?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

// NotificationDropdown.tsx — Bell icon panel
// Shows last 10 notifications, mark-read actions, "View all" link

// GlobalSearchModal.tsx — Cmd+K search
// Searches vendors, RFQs, POs, invoices simultaneously
// Shows results in grouped sections with keyboard navigation
```

---

## 6. Real-Time & Socket.io

### 6.1 Events Architecture

```typescript
// Frontend connects after login, joins room by userId
// Backend emits to specific rooms

// Events the frontend listens to:
type ServerToClientEvents = {
  'notification:new':      (notification: Notification) => void;
  'rfq:status_changed':    (data: { rfqId: string; status: RFQStatus; rfqTitle: string }) => void;
  'quotation:received':    (data: { rfqId: string; vendorName: string; count: number }) => void;
  'approval:needed':       (data: { approvalId: string; rfqTitle: string; amount: number }) => void;
  'approval:decided':      (data: { approvalId: string; status: 'APPROVED' | 'REJECTED'; poNumber?: string }) => void;
  'po:issued':             (data: { poId: string; poNumber: string; rfqTitle: string }) => void;
  'invoice:sent':          (data: { invoiceId: string; invoiceNumber: string }) => void;
  'activity:new':          (activityLog: ActivityLog) => void;
};
```

### 6.2 Frontend Socket Setup

```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const getSocket = (): Socket | null => socket;
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
```

### 6.3 React Integration

```typescript
// src/hooks/useSocket.ts
// Subscribes to events, updates Zustand store
// Dashboard activity feed auto-updates via 'activity:new'
// Notification bell badge via 'notification:new' (increments count)
// Toast shown for high-priority events (approval:needed, po:issued)
```

### 6.4 Real-Time UI Elements

| Element | Event | Behavior |
|---------|-------|---------|
| Notification badge | `notification:new` | Badge count +1, dropdown prepends item |
| Activity feed | `activity:new` | New item slides in at top, max 10 shown |
| RFQ detail quotation count | `quotation:received` | Count badge updates live |
| Approval queue | `approval:needed` | New card appears at top of list |
| Toast | `approval:decided` `po:issued` `invoice:sent` | Auto-toast with action link |

---

## 7. Frontend Project Structure

```
frontend/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                    # React + Router + Providers bootstrap
│   ├── App.tsx                     # Routes definition
│   │
│   ├── assets/
│   │   └── logo.svg
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── ui/                     # Primitive / base components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── shared/                 # Domain-aware reusable components
│   │   │   ├── StatusChip.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── DeadlineCountdown.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── SkeletonLoader.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   └── GlobalSearchModal.tsx
│   │   │
│   │   └── forms/                  # Reusable form field components
│   │       ├── RFQItemsTable.tsx
│   │       ├── VendorMultiSelect.tsx
│   │       └── PricingTable.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── vendors/
│   │   │   ├── VendorListPage.tsx
│   │   │   ├── VendorCreatePage.tsx
│   │   │   └── VendorDetailPage.tsx
│   │   │
│   │   ├── rfqs/
│   │   │   ├── RFQListPage.tsx
│   │   │   ├── RFQCreatePage.tsx
│   │   │   ├── RFQDetailPage.tsx
│   │   │   └── RFQComparePage.tsx
│   │   │
│   │   ├── quotations/
│   │   │   ├── QuotationFormPage.tsx  ← create/edit
│   │   │   └── MyQuotationsPage.tsx   ← vendor view
│   │   │
│   │   ├── approvals/
│   │   │   └── ApprovalsPage.tsx      ← master-detail
│   │   │
│   │   ├── purchase-orders/
│   │   │   ├── POListPage.tsx
│   │   │   └── PODetailPage.tsx
│   │   │
│   │   ├── invoices/
│   │   │   ├── InvoiceListPage.tsx
│   │   │   └── InvoiceDetailPage.tsx  ← create + view + actions
│   │   │
│   │   ├── activity-logs/
│   │   │   └── ActivityLogsPage.tsx
│   │   │
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth state + JWT management
│   │   ├── useSocket.ts            # Socket.io event subscriptions
│   │   ├── useNotifications.ts     # Notification count + list
│   │   ├── useDebounce.ts          # Search debounce
│   │   └── usePrint.ts             # window.print() with print styles
│   │
│   ├── store/
│   │   ├── authStore.ts            # Zustand: user, token, login/logout
│   │   ├── notificationStore.ts    # Zustand: notifications list + unread count
│   │   └── socketStore.ts          # Zustand: socket connection state
│   │
│   ├── api/
│   │   ├── client.ts               # Axios instance + interceptors (JWT attach, 401 redirect)
│   │   ├── auth.api.ts
│   │   ├── vendor.api.ts
│   │   ├── rfq.api.ts
│   │   ├── quotation.api.ts
│   │   ├── comparison.api.ts
│   │   ├── approval.api.ts
│   │   ├── purchaseOrder.api.ts
│   │   ├── invoice.api.ts
│   │   ├── notification.api.ts
│   │   ├── dashboard.api.ts
│   │   └── report.api.ts
│   │
│   ├── types/
│   │   ├── api.ts                  # All API response types, mirroring backend
│   │   └── enums.ts                # Status enums (copy from backend /types/enums.ts)
│   │
│   ├── lib/
│   │   ├── socket.ts               # Socket.io setup (section 6.2)
│   │   ├── formatters.ts           # formatCurrency, formatDate, formatRelativeTime
│   │   └── constants.ts            # VENDOR_CATEGORIES, GST_RATES, etc.
│   │
│   └── styles/
│       ├── globals.css             # CSS variables (section 2.2) + resets
│       └── print.css               # @media print styles for invoice/PO
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 8. Tech Stack & Dependencies

### 8.1 Frontend Stack

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.x",
    "typescript": "^5.x",

    "axios": "^1.x",
    "socket.io-client": "^4.x",
    "zustand": "^4.x",

    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",

    "recharts": "^2.x",
    "lucide-react": "^0.x",
    "framer-motion": "^11.x",
    "react-hot-toast": "^2.x",
    "@tanstack/react-table": "^8.x",
    "react-datepicker": "^6.x",
    "react-select": "^5.x",
    "dayjs": "^1.x",

    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x"
  }
}
```

### 8.2 API Client Configuration

```typescript
// src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  timeout: 10000,
});

// Request: attach JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('vb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: handle 401
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vb_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.message || 'Something went wrong');
  }
);

export default client;
```

### 8.3 State Management Pattern

```typescript
// Simple rule: API data → React Query (server state). UI state → Zustand.
// Do NOT use React Query for this hackathon to keep it lean.
// Use SWR or plain useEffect + useState + a loading/error pattern.

// Example pattern used throughout:
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  rfqApi.list(filters)
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, [filters]);
```

### 8.4 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',   // class-based dark mode, toggled via Zustand
  theme: {
    extend: {
      colors: {
        // Map Tailwind classes to CSS variables for full dark mode support
        brand:  { DEFAULT: 'var(--vb-brand-600)', light: 'var(--vb-brand-100)', dark: 'var(--vb-brand-700)' },
        surface: { base: 'var(--vb-surface-base)', raised: 'var(--vb-surface-raised)', sidebar: 'var(--vb-surface-sidebar)' },
        border:  { DEFAULT: 'var(--vb-border)', strong: 'var(--vb-border-strong)' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--vb-radius-sm)',
        md: 'var(--vb-radius-md)',
        lg: 'var(--vb-radius-lg)',
        xl: 'var(--vb-radius-xl)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 9. Docker Setup

### 9.1 docker-compose.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: vb_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: vendorbridge
      POSTGRES_USER: vb_user
      POSTGRES_PASSWORD: vb_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vb_user -d vendorbridge"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vb_backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://vb_user:vb_password@postgres:5432/vendorbridge
      JWT_SECRET: dev_secret_change_in_prod_32chars
      JWT_EXPIRES_IN: 7d
      PORT: 4000
      NODE_ENV: development
      CLIENT_URL: http://localhost:3000
      SMTP_HOST: smtp.mailtrap.io
      SMTP_PORT: 587
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
      FROM_EMAIL: noreply@vendorbridge.com
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: sh -c "npx prisma migrate dev --name init && npx ts-node prisma/seed.ts && npm run dev"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: vb_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host

volumes:
  postgres_data:
```

### 9.2 Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 4000
```

### 9.3 Frontend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
```

### 9.4 Quick Start

```bash
# 1. Clone and configure
cp backend/.env.example backend/.env
# Fill in SMTP credentials if needed (optional for hackathon)

# 2. Start everything
docker compose up --build

# 3. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api/v1
# Prisma Studio: docker exec -it vb_backend npx prisma studio

# Seeded demo credentials:
# Admin:    admin@vendorbridge.com / Admin@1234
# Officer:  officer@vendorbridge.com / Officer@1234
# Manager:  manager@vendorbridge.com / Manager@1234
# Vendor 1: vendor1@abc.com / Vendor@1234
```

---

## 10. Implementation Checklist

> Success criteria for each feature. Verify before moving on.

### Auth
- [ ] Login with valid credentials → JWT stored → redirect to `/dashboard`
- [ ] Login with invalid credentials → inline error shown
- [ ] Register as Officer → profile created → logged in
- [ ] Register as Vendor → vendor profile created → linked
- [ ] Protected route without token → redirect to `/login`
- [ ] Role guard: Vendor accessing `/approvals` → redirect to `/dashboard`

### Dashboard
- [ ] KPI cards render with correct values for each role
- [ ] Activity feed shows last 10 events
- [ ] New activity from another tab → feed updates live (Socket.io)
- [ ] Pending approvals card links to `/approvals` (Manager)

### Vendors
- [ ] List loads with pagination and status filters
- [ ] Search by company name debounces and filters
- [ ] Register vendor form validates GST format
- [ ] Admin can block/activate vendor → status chip updates
- [ ] Vendor profile shows past quotation history

### RFQs
- [ ] Create RFQ → save draft → publish
- [ ] Publish → notification toast → vendors in list see it
- [ ] Deadline countdown shows correct time remaining
- [ ] Add/remove items dynamically
- [ ] Bulk invite vendors by category
- [ ] "Compare Quotations" button disabled until 2+ submitted

### Quotations (Vendor)
- [ ] Vendor sees only their invited RFQs
- [ ] Unit price input → totals auto-calculate live
- [ ] Save draft → re-open → form pre-populated
- [ ] Submit → confirmation modal → status = SUBMITTED
- [ ] Toast with timestamp confirms submission

### Comparison
- [ ] All submitted quotations shown in columns
- [ ] Lowest value per row highlighted in green
- [ ] Sort by grand total works
- [ ] Select quotation → confirm modal → approval created
- [ ] After selection: other quotations show REJECTED, selected shows ACCEPTED

### Approvals
- [ ] Manager sees only pending approvals in queue
- [ ] Click item → detail panel shows quotation summary
- [ ] Approve with remarks → PO auto-created → officer notified (toast)
- [ ] Reject with remarks → officer notified
- [ ] Approve without remarks → allowed (remarks optional on approve)
- [ ] Reject without remarks → inline error "Remarks required for rejection"

### Purchase Orders
- [ ] PO list shows PO-YYYY-XXXX numbers in mono font
- [ ] PO detail renders printable document layout
- [ ] Print button → `window.print()` → only document visible
- [ ] Cancel PO disabled if invoice exists for it

### Invoices
- [ ] Create invoice from PO → pre-filled → GST auto-calculated
- [ ] Grand total calculation is correct (CGST + SGST for intra, IGST for inter)
- [ ] PDF download → `GET /invoices/:id/pdf` → file downloads
- [ ] Print works via `window.print()`
- [ ] Send via email → preview modal → confirm → status = SENT
- [ ] Mark as paid → status = PAID
- [ ] Overdue invoices show red indicator in list

### Activity Logs
- [ ] Filter by entity type → list filters correctly
- [ ] Entity link in log row navigates to correct detail page
- [ ] Pagination works

### Reports
- [ ] Charts render with correct data for selected period
- [ ] Period change → all charts refresh
- [ ] Download CSV per chart works

### Real-Time
- [ ] Notification bell badge increments on new notification
- [ ] Dashboard activity feed updates without page refresh
- [ ] Approval queue updates when new approval is created by another user

### General
- [ ] Dark mode toggle persists in localStorage
- [ ] Keyboard shortcut `N` opens new RFQ form (Officer/Admin)
- [ ] Keyboard shortcut `A` navigates to approvals
- [ ] Cmd+K opens global search
- [ ] Responsive: all pages usable at 375px (mobile) and 768px (tablet)
- [ ] Loading skeletons shown for all async data
- [ ] Error states shown for failed API calls with retry option
- [ ] Confirmation modals before all destructive actions

---

*VendorBridge — Design.md v1.0 — Ready for Antigravity execution*
