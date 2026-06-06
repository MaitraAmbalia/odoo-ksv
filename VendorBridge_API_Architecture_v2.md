# VendorBridge — Lean API & Architecture Specification
> Stack: **PostgreSQL · Prisma · Express · TypeScript · Node.js**
> Scope: 8-hour hackathon build — core procurement workflow only

---

## Table of Contents
1. [Project File Structure](#1-project-file-structure)
2. [Database Schema (Prisma)](#2-database-schema-prisma)
3. [API Endpoints](#3-api-endpoints)
4. [Role & Permission Matrix](#4-role--permission-matrix)
5. [Workflow State Machines](#5-workflow-state-machines)
6. [Key Implementation Patterns](#6-key-implementation-patterns)
7. [Environment Setup](#7-environment-setup)

---

## 1. Project File Structure

```
vendorbridge/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── README.md
│
├── prisma/
│   ├── schema.prisma              # Single source of truth for DB schema
│   └── seed.ts                    # Seed: admin user, sample vendors, RFQ
│
└── src/
    ├── index.ts                   # Express app bootstrap, listen
    ├── app.ts                     # Middleware registration, router mount
    │
    ├── config/
    │   ├── db.ts                  # Prisma Client singleton
    │   └── env.ts                 # Validated env vars (dotenv)
    │
    ├── routes/
    │   ├── index.ts               # Mount all routers → /api/v1
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── vendor.routes.ts
    │   ├── rfq.routes.ts
    │   ├── quotation.routes.ts
    │   ├── comparison.routes.ts
    │   ├── approval.routes.ts
    │   ├── purchaseOrder.routes.ts
    │   ├── invoice.routes.ts
    │   ├── activityLog.routes.ts
    │   ├── notification.routes.ts
    │   ├── dashboard.routes.ts
    │   └── report.routes.ts
    │
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── vendor.controller.ts
    │   ├── rfq.controller.ts
    │   ├── quotation.controller.ts
    │   ├── comparison.controller.ts
    │   ├── approval.controller.ts
    │   ├── purchaseOrder.controller.ts
    │   ├── invoice.controller.ts
    │   ├── activityLog.controller.ts
    │   ├── notification.controller.ts
    │   ├── dashboard.controller.ts
    │   └── report.controller.ts
    │
    ├── services/
    │   ├── auth.service.ts
    │   ├── vendor.service.ts
    │   ├── rfq.service.ts
    │   ├── quotation.service.ts
    │   ├── comparison.service.ts
    │   ├── approval.service.ts
    │   ├── purchaseOrder.service.ts
    │   ├── invoice.service.ts
    │   ├── activityLog.service.ts
    │   ├── notification.service.ts
    │   ├── dashboard.service.ts
    │   ├── report.service.ts
    │   ├── email.service.ts       # Nodemailer (send invoice via email)
    │   └── pdf.service.ts         # PDFKit (invoice PDF download)
    │
    ├── middlewares/
    │   ├── authenticate.ts        # JWT verify → req.user
    │   ├── authorize.ts           # Role guard factory
    │   ├── validate.ts            # Zod schema validator
    │   ├── asyncHandler.ts        # Wraps async controllers, catches errors
    │   └── errorHandler.ts        # Global error handler
    │
    ├── validators/
    │   ├── auth.validator.ts
    │   ├── vendor.validator.ts
    │   ├── rfq.validator.ts
    │   ├── quotation.validator.ts
    │   ├── approval.validator.ts
    │   └── invoice.validator.ts
    │
    ├── types/
    │   ├── express.d.ts           # Augment Express Request with req.user
    │   └── enums.ts               # All status enums (mirrors Prisma enums)
    │
    └── utils/
        ├── generateNumber.ts      # PO number & invoice number generator
        ├── calculateTax.ts        # GST: CGST+SGST (intra) / IGST (inter)
        ├── apiResponse.ts         # { success, data, message, pagination }
        ├── auditLog.ts            # Central write-once activity log helper
        └── pagination.ts          # Offset pagination helper
```

---

## 2. Database Schema (Prisma)

> File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum Role {
  ADMIN
  PROCUREMENT_OFFICER
  MANAGER
  VENDOR
}

enum VendorStatus {
  PENDING
  ACTIVE
  BLOCKED
}

enum RFQStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
}

enum QuotationStatus {
  DRAFT
  SUBMITTED
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum POStatus {
  ISSUED
  CANCELLED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

// ─────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────

model User {
  id            String    @id @default(uuid())
  firstName     String
  lastName      String
  email         String    @unique
  passwordHash  String
  role          Role
  phone         String?
  country       String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  vendor        Vendor?
  rfqsCreated   RFQ[]     @relation("RFQCreator")
  approvals     Approval[] @relation("Approver")
  activityLogs  ActivityLog[]
  notifications Notification[]
}

model Vendor {
  id           String       @id @default(uuid())
  userId       String       @unique          // Vendor role user linked to this profile
  companyName  String
  category     String
  gstNumber    String       @unique
  contactPhone String
  address      String?
  status       VendorStatus @default(PENDING)
  rating       Float        @default(0)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  user         User         @relation(fields: [userId], references: [id])
  rfqInvites   RFQVendor[]
  quotations   Quotation[]
  purchaseOrders PurchaseOrder[]
  invoices     Invoice[]
}

model RFQ {
  id          String    @id @default(uuid())
  title       String
  category    String
  description String?
  deadline    DateTime
  status      RFQStatus @default(DRAFT)
  createdById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  createdBy   User        @relation("RFQCreator", fields: [createdById], references: [id])
  items       RFQItem[]
  vendors     RFQVendor[]
  quotations  Quotation[]
  approval    Approval?
  activityLogs ActivityLog[]
}

model RFQItem {
  id          String  @id @default(uuid())
  rfqId       String
  itemName    String
  quantity    Int
  unit        String

  rfq         RFQ     @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  quotationItems QuotationItem[]
}

// Join table: which vendors are invited to which RFQ
model RFQVendor {
  rfqId      String
  vendorId   String
  invitedAt  DateTime @default(now())

  rfq        RFQ      @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  vendor     Vendor   @relation(fields: [vendorId], references: [id])

  @@id([rfqId, vendorId])
}

model Quotation {
  id             String          @id @default(uuid())
  rfqId          String
  vendorId       String
  status         QuotationStatus @default(DRAFT)
  deliveryDays   Int
  gstRate        Float           @default(18)
  taxType        String          @default("GST_INTRA")  // GST_INTRA | GST_INTER
  subtotal       Float           @default(0)
  gstAmount      Float           @default(0)
  grandTotal     Float           @default(0)
  notes          String?
  paymentTerms   String?
  submittedAt    DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  rfq            RFQ             @relation(fields: [rfqId], references: [id])
  vendor         Vendor          @relation(fields: [vendorId], references: [id])
  items          QuotationItem[]
  approval       Approval?
  purchaseOrder  PurchaseOrder?

  @@unique([rfqId, vendorId])   // One quotation per vendor per RFQ
}

model QuotationItem {
  id          String  @id @default(uuid())
  quotationId String
  rfqItemId   String
  unitPrice   Float
  totalPrice  Float

  quotation   Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  rfqItem     RFQItem   @relation(fields: [rfqItemId], references: [id])
}

model Approval {
  id           String         @id @default(uuid())
  rfqId        String         @unique
  quotationId  String         @unique
  approverId   String?        // Assigned manager
  status       ApprovalStatus @default(PENDING)
  remarks      String?
  decidedAt    DateTime?
  createdAt    DateTime       @default(now())

  rfq          RFQ            @relation(fields: [rfqId], references: [id])
  quotation    Quotation      @relation(fields: [quotationId], references: [id])
  approver     User?          @relation("Approver", fields: [approverId], references: [id])
  purchaseOrder PurchaseOrder?
}

model PurchaseOrder {
  id           String    @id @default(uuid())
  poNumber     String    @unique                // e.g. PO-2025-0068
  approvalId   String    @unique
  quotationId  String    @unique
  vendorId     String
  status       POStatus  @default(ISSUED)
  issuedAt     DateTime  @default(now())

  approval     Approval  @relation(fields: [approvalId], references: [id])
  quotation    Quotation @relation(fields: [quotationId], references: [id])
  vendor       Vendor    @relation(fields: [vendorId], references: [id])
  invoice      Invoice?
}

model Invoice {
  id            String        @id @default(uuid())
  invoiceNumber String        @unique              // e.g. INV-2025-0068
  poId          String        @unique
  vendorId      String
  status        InvoiceStatus @default(DRAFT)
  dueDate       DateTime
  taxType       String        @default("GST_INTRA")
  gstRate       Float         @default(18)
  subtotal      Float
  cgst          Float         @default(0)
  sgst          Float         @default(0)
  igst          Float         @default(0)
  grandTotal    Float
  notes         String?
  sentAt        DateTime?
  paidAt        DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  po            PurchaseOrder @relation(fields: [poId], references: [id])
  vendor        Vendor        @relation(fields: [vendorId], references: [id])
  items         InvoiceItem[]
}

model InvoiceItem {
  id          String  @id @default(uuid())
  invoiceId   String
  description String
  quantity    Int
  unitPrice   Float
  totalPrice  Float

  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}

// Write-once audit trail — NO soft delete
model ActivityLog {
  id         String   @id @default(uuid())
  userId     String
  entityType String   // "RFQ" | "VENDOR" | "QUOTATION" | "APPROVAL" | "PO" | "INVOICE"
  entityId   String
  action     String   // "RFQ_PUBLISHED" | "QUOTATION_SUBMITTED" | "APPROVAL_APPROVED" etc.
  meta       Json?    // Additional context (vendor name, amount, etc.)
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId])
}

model Notification {
  id         String   @id @default(uuid())
  userId     String
  type       String   // "RFQ_INVITE" | "QUOTATION_RECEIVED" | "APPROVAL_NEEDED" | "PO_ISSUED" | "INVOICE_SENT"
  title      String
  body       String
  isRead     Boolean  @default(false)
  entityType String?
  entityId   String?
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
}
```

---

## 3. API Endpoints

> **Base URL:** `/api/v1`
> **Auth:** `Authorization: Bearer <jwt>` on all routes except `/auth/*`
> **Response shape:** `{ success: boolean, data: T, message?: string }`
> **Pagination:** `{ success, data: T[], pagination: { page, limit, total } }`

---

### 3.1 Auth — `/auth`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/register` | Public | Register user, returns JWT |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | Any | Get own profile |
| PATCH | `/auth/me` | Any | Update own profile |
| PATCH | `/auth/me/password` | Any | Change password |

**POST `/auth/register` body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "country": "string",
  "role": "ADMIN | PROCUREMENT_OFFICER | MANAGER | VENDOR"
}
```
> Returns: `{ token, user: { id, email, role, firstName, lastName } }`

**POST `/auth/login` body:**
```json
{ "email": "string", "password": "string" }
```
> Returns: `{ token, user: { id, email, role, firstName, lastName } }`

> **JWT Strategy:** Single access token, `7d` expiry, stored in client localStorage. No refresh token needed for hackathon.

---

### 3.2 Users — `/users`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/users` | ADMIN | List all users (filter by role) |
| GET | `/users/:id` | ADMIN | Get user by ID |
| PATCH | `/users/:id/status` | ADMIN | Activate / deactivate user |
| PATCH | `/users/:id/role` | ADMIN | Change user role |

---

### 3.3 Vendors — `/vendors`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/vendors` | ADMIN, OFFICER | List vendors — filter: `status`, `category`, `search` |
| POST | `/vendors` | ADMIN | Register new vendor |
| GET | `/vendors/:id` | ADMIN, OFFICER, VENDOR(own) | Vendor detail |
| PATCH | `/vendors/:id` | ADMIN | Update vendor info |
| PATCH | `/vendors/:id/status` | ADMIN | Activate / Block vendor |

**POST `/vendors` body:**
```json
{
  "userId": "uuid",
  "companyName": "string",
  "category": "string",
  "gstNumber": "string",
  "contactPhone": "string",
  "address": "string"
}
```

**GET `/vendors` query params:**
- `?status=ACTIVE|PENDING|BLOCKED`
- `?category=string`
- `?search=string` (searches companyName, gstNumber)
- `?page=1&limit=20`

---

### 3.4 RFQs — `/rfqs`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/rfqs` | ADMIN, OFFICER, MANAGER | List RFQs — filter: `status`, `search` |
| POST | `/rfqs` | OFFICER | Create RFQ (DRAFT) |
| GET | `/rfqs/:id` | ADMIN, OFFICER, MANAGER, VENDOR | RFQ detail with items + invited vendors |
| PATCH | `/rfqs/:id` | OFFICER | Update RFQ (DRAFT only) |
| DELETE | `/rfqs/:id` | OFFICER | Delete RFQ (DRAFT only) |
| POST | `/rfqs/:id/publish` | OFFICER | Publish → notify invited vendors |
| POST | `/rfqs/:id/close` | OFFICER | Close RFQ (stop accepting quotations) |
| POST | `/rfqs/:id/cancel` | OFFICER | Cancel RFQ |
| POST | `/rfqs/:id/vendors` | OFFICER | Assign vendor(s) to RFQ |
| DELETE | `/rfqs/:id/vendors/:vendorId` | OFFICER | Remove vendor from RFQ |

**POST `/rfqs` body:**
```json
{
  "title": "Office Furniture Procurement Q2",
  "category": "Furniture",
  "description": "Ergonomic chairs and standing desks for 3rd floor",
  "deadline": "2025-06-15T00:00:00.000Z",
  "items": [
    { "itemName": "Ergonomic Chair", "quantity": 25, "unit": "NOS" },
    { "itemName": "Standing Desk", "quantity": 10, "unit": "NOS" }
  ],
  "vendorIds": ["uuid1", "uuid2"]
}
```

> On `POST /rfqs/:id/publish`:
> - Status → `PUBLISHED`
> - Creates a `Notification` for each assigned vendor (type: `RFQ_INVITE`)
> - Writes `ActivityLog` entry

---

### 3.5 Quotations — `/quotations` and `/rfqs/:rfqId/quotations`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/rfqs/:rfqId/quotations` | ADMIN, OFFICER, MANAGER | All quotations for an RFQ |
| GET | `/quotations/mine` | VENDOR | Own quotations across all RFQs |
| POST | `/rfqs/:rfqId/quotations` | VENDOR | Create/save quotation draft |
| GET | `/quotations/:id` | ADMIN, OFFICER, MANAGER, VENDOR(own) | Quotation detail with items |
| PATCH | `/quotations/:id` | VENDOR | Edit quotation (DRAFT or SUBMITTED while RFQ is active) |
| POST | `/quotations/:id/submit` | VENDOR | Submit quotation |
| POST | `/quotations/:id/withdraw` | VENDOR | Withdraw submitted quotation |

**POST `/rfqs/:rfqId/quotations` body:**
```json
{
  "deliveryDays": 7,
  "gstRate": 18,
  "taxType": "GST_INTRA",
  "notes": "Payment terms: 30 days net",
  "paymentTerms": "30 days",
  "items": [
    { "rfqItemId": "uuid", "unitPrice": 3500 },
    { "rfqItemId": "uuid", "unitPrice": 8200 }
  ]
}
```
> Server auto-calculates: `subtotal`, `gstAmount`, `grandTotal` from items.

---

### 3.6 Quotation Comparison — `/rfqs/:rfqId/comparison`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/rfqs/:rfqId/comparison` | ADMIN, OFFICER, MANAGER | Side-by-side comparison matrix |
| POST | `/rfqs/:rfqId/comparison/select` | OFFICER | Select a quotation → triggers approval |

**GET `/rfqs/:rfqId/comparison` response shape:**
```json
{
  "rfq": { "id": "...", "title": "...", "items": [] },
  "quotations": [
    {
      "quotationId": "...",
      "vendorId": "...",
      "vendorName": "...",
      "vendorRating": 4.5,
      "grandTotal": 185000,
      "deliveryDays": 10,
      "gstRate": 18,
      "paymentTerms": "30 days",
      "items": [{ "rfqItemId": "...", "itemName": "...", "unitPrice": 3500, "totalPrice": 87500 }],
      "isLowestPrice": true,
      "isFastestDelivery": false
    }
  ]
}
```

**POST `/rfqs/:rfqId/comparison/select` body:**
```json
{ "quotationId": "uuid" }
```
> Side effects:
> - Quotation status → `ACCEPTED`, others → `REJECTED`
> - Creates `Approval` record (status: `PENDING`)
> - Notifies MANAGERs (type: `APPROVAL_NEEDED`)
> - Writes `ActivityLog`

---

### 3.7 Approvals — `/approvals`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/approvals` | MANAGER, ADMIN | List all approvals (filter: `status`) |
| GET | `/approvals/pending` | MANAGER | My pending queue |
| GET | `/approvals/:id` | MANAGER, OFFICER, ADMIN | Approval detail with quotation summary |
| POST | `/approvals/:id/approve` | MANAGER | Approve → auto-create PO |
| POST | `/approvals/:id/reject` | MANAGER | Reject with remarks |

**POST `/approvals/:id/approve` body:**
```json
{ "remarks": "Approved. Proceed with delivery." }
```
> Side effects on approve:
> - Approval status → `APPROVED`
> - Auto-creates `PurchaseOrder` (poNumber generated, status: `ISSUED`)
> - Notifies OFFICER (type: `APPROVAL_DECIDED`) and VENDOR (type: `PO_ISSUED`)
> - Writes `ActivityLog`

**POST `/approvals/:id/reject` body:**
```json
{ "remarks": "Price too high, re-evaluate quotations." }
```

---

### 3.8 Purchase Orders — `/purchase-orders`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/purchase-orders` | ADMIN, OFFICER, MANAGER | List POs (filter: `status`, `vendorId`) |
| GET | `/purchase-orders/:id` | ADMIN, OFFICER, MANAGER, VENDOR(own) | PO detail with line items |
| PATCH | `/purchase-orders/:id/cancel` | ADMIN, OFFICER | Cancel PO |

> POs are **auto-generated** on approval. No manual POST endpoint needed.
> PO number format: `PO-{YYYY}-{4-digit-seq}` e.g. `PO-2025-0068`

---

### 3.9 Invoices — `/invoices`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/invoices` | ADMIN, OFFICER, MANAGER | List invoices (filter: `status`, `vendorId`) |
| POST | `/invoices` | OFFICER | Generate invoice from a PO |
| GET | `/invoices/:id` | ADMIN, OFFICER, MANAGER, VENDOR(own) | Invoice detail with line items |
| PATCH | `/invoices/:id` | OFFICER | Edit DRAFT invoice |
| POST | `/invoices/:id/send` | OFFICER | Send invoice via email to vendor |
| POST | `/invoices/:id/mark-paid` | ADMIN, MANAGER | Mark invoice as PAID |
| GET | `/invoices/:id/pdf` | ADMIN, OFFICER, VENDOR | Stream PDF download |
| POST | `/invoices/:id/cancel` | ADMIN | Cancel invoice |

**POST `/invoices` body:**
```json
{
  "poId": "uuid",
  "dueDate": "2025-06-21T00:00:00.000Z",
  "taxType": "GST_INTRA",
  "gstRate": 18,
  "notes": "string"
}
```
> Server auto-calculates from PO line items:
> - `subtotal` = sum of all item totals
> - `GST_INTRA`: `cgst = subtotal × (gstRate/2)/100`, `sgst = same`, `igst = 0`
> - `GST_INTER`: `igst = subtotal × gstRate/100`, `cgst = sgst = 0`
> - `grandTotal = subtotal + cgst + sgst + igst`
> - Invoice number format: `INV-{YYYY}-{4-digit-seq}` e.g. `INV-2025-0068`

**GET `/invoices/:id/pdf`** — streams a PDFKit-generated PDF inline.

**POST `/invoices/:id/send`** — sends invoice PDF as email attachment via Nodemailer to vendor's registered email. Status → `SENT`, `sentAt` recorded.

---

### 3.10 Activity Logs — `/activity-logs`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/activity-logs` | ADMIN | Full system log (paginated) |
| GET | `/activity-logs?entityType=RFQ&entityId=:id` | ADMIN, OFFICER | Logs for a specific entity |

> Logs are **write-once** — no update or delete endpoints.
> Filter params: `?entityType=`, `?entityId=`, `?userId=`, `?page=`, `?limit=`

**Action constants:**
```
VENDOR_REGISTERED, VENDOR_STATUS_CHANGED,
RFQ_CREATED, RFQ_PUBLISHED, RFQ_CLOSED, RFQ_CANCELLED,
QUOTATION_SUBMITTED, QUOTATION_WITHDRAWN,
QUOTATION_SELECTED, APPROVAL_CREATED,
APPROVAL_APPROVED, APPROVAL_REJECTED,
PO_ISSUED, PO_CANCELLED,
INVOICE_GENERATED, INVOICE_SENT, INVOICE_PAID, INVOICE_CANCELLED
```

---

### 3.11 Notifications — `/notifications`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/notifications` | Any | My notifications (paginated) |
| GET | `/notifications/unread-count` | Any | Badge count |
| PATCH | `/notifications/:id/read` | Any | Mark one as read |
| PATCH | `/notifications/read-all` | Any | Mark all as read |

---

### 3.12 Dashboard — `/dashboard`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/dashboard/summary` | ADMIN, OFFICER, MANAGER | KPI cards |
| GET | `/dashboard/recent-pos` | ADMIN, OFFICER, MANAGER | Last 5 purchase orders |
| GET | `/dashboard/recent-activity` | Any | Last 10 activity log entries |

**GET `/dashboard/summary` response:**
```json
{
  "activeRFQs": 12,
  "pendingApprovals": 5,
  "posThisMonth": 23,
  "overdueInvoices": 3,
  "totalSpendThisMonth": 2300000
}
```

---

### 3.13 Reports — `/reports`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/reports/summary` | ADMIN, MANAGER | Total spend, PO count for period |
| GET | `/reports/vendor-performance` | ADMIN, OFFICER | Per-vendor: quotations submitted, won, avg delivery |
| GET | `/reports/monthly-trends` | ADMIN, MANAGER | Month-over-month PO volume + spend |
| GET | `/reports/overdue-invoices` | ADMIN, MANAGER | Overdue invoice aging |

> All report endpoints accept: `?from=ISO&to=ISO&vendorId=&category=`

---

## 4. Role & Permission Matrix

| Feature | ADMIN | OFFICER | MANAGER | VENDOR |
|---------|-------|---------|---------|--------|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Register Vendors | ✅ | ❌ | ❌ | ❌ |
| View Vendors | ✅ | ✅ | ❌ | Own |
| Block/Activate Vendor | ✅ | ❌ | ❌ | ❌ |
| Create RFQ | ✅ | ✅ | ❌ | ❌ |
| View RFQ | ✅ | ✅ | ✅ | Assigned |
| Submit Quotation | ❌ | ❌ | ❌ | ✅ |
| Compare Quotations | ✅ | ✅ | ✅ | ❌ |
| Select Quotation | ✅ | ✅ | ❌ | ❌ |
| Approve / Reject | ✅ | ❌ | ✅ | ❌ |
| Generate Invoice | ✅ | ✅ | ❌ | ❌ |
| Send Invoice (email) | ✅ | ✅ | ❌ | ❌ |
| Mark Invoice Paid | ✅ | ❌ | ✅ | ❌ |
| Download Invoice PDF | ✅ | ✅ | ✅ | Own |
| View Reports | ✅ | Limited | ✅ | ❌ |
| View Activity Logs | ✅ | Own | Own | Own |

---

## 5. Workflow State Machines

### 5.1 RFQ Lifecycle
```
DRAFT ──publish──► PUBLISHED ──close──► CLOSED
  │
  └──cancel──► CANCELLED
```

### 5.2 Quotation Lifecycle
```
DRAFT ──submit──► SUBMITTED
                      │
             [Officer selects via comparison]
                      │
               ACCEPTED   REJECTED   WITHDRAWN
```

### 5.3 Approval Lifecycle
```
PENDING ──approve──► APPROVED ──[auto]──► PO Created
    └───reject────► REJECTED ──[notify officer]
```

### 5.4 Purchase Order Lifecycle
```
[auto-created on APPROVED] ──► ISSUED
ISSUED ──cancel──► CANCELLED
```

### 5.5 Invoice Lifecycle
```
DRAFT ──send──► SENT ──mark-paid──► PAID
  │               └──[overdue]──► OVERDUE
  └──cancel──► CANCELLED
```

---

## 6. Key Implementation Patterns

### Controller (standard shape)
```typescript
// src/controllers/rfq.controller.ts
export const createRFQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = rfqCreateSchema.parse(req.body);             // Zod validate
  const rfq  = await rfqService.create(body, req.user.id);  // Service
  await auditLog.write({ userId: req.user.id, entityType: 'RFQ', entityId: rfq.id, action: 'RFQ_CREATED' });
  return res.status(201).json(apiResponse.success(rfq));
});
```

### Service (business logic)
```typescript
// src/services/rfq.service.ts
export const publishRFQ = async (rfqId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId }, include: { vendors: true } });
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Only DRAFT RFQs can be published');
  if (rfq.vendors.length === 0) throw new AppError(400, 'Assign at least one vendor before publishing');
  const updated = await prisma.rFQ.update({ where: { id: rfqId }, data: { status: 'PUBLISHED' } });
  // Notify each vendor
  await notificationService.notifyVendors(rfq.vendors.map(v => v.vendorId), rfq);
  return updated;
};
```

### GST Calculation
```typescript
// src/utils/calculateTax.ts
export const calculateGST = (subtotal: number, gstRate: number, taxType: 'GST_INTRA' | 'GST_INTER') => {
  if (taxType === 'GST_INTRA') {
    const half = (subtotal * (gstRate / 2)) / 100;
    return { cgst: half, sgst: half, igst: 0, grandTotal: subtotal + half * 2 };
  }
  const igst = (subtotal * gstRate) / 100;
  return { cgst: 0, sgst: 0, igst, grandTotal: subtotal + igst };
};
```

### PO/Invoice Number Generator
```typescript
// src/utils/generateNumber.ts
export const generatePONumber = async (): Promise<string> => {
  const count = await prisma.purchaseOrder.count();
  const seq   = String(count + 1).padStart(4, '0');
  return `PO-${new Date().getFullYear()}-${seq}`;
};

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.invoice.count();
  const seq   = String(count + 1).padStart(4, '0');
  return `INV-${new Date().getFullYear()}-${seq}`;
};
```

### API Response Wrapper
```typescript
// src/utils/apiResponse.ts
export const apiResponse = {
  success: <T>(data: T, message?: string) => ({ success: true, data, message }),
  error:   (message: string, code?: string) => ({ success: false, message, code }),
  paginated: <T>(data: T[], pagination: { page: number; limit: number; total: number }) => ({
    success: true, data, pagination
  })
};
```

### Auth Middleware
```typescript
// src/middlewares/authenticate.ts
export const authenticate = asyncHandler(async (req: AuthRequest, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError(401, 'No token provided');
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  req.user = await prisma.user.findUniqueOrThrow({ where: { id: payload.id } });
  next();
});

// src/middlewares/authorize.ts
export const authorize = (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) throw new AppError(403, 'Forbidden');
    next();
  };
```

---

## 7. Environment Setup

### `.env.example`
```env
# Database
DATABASE_URL="postgresql://vb_user:password@localhost:5432/vendorbridge"

# Auth
JWT_SECRET=change_me_32_chars_minimum
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email (use Mailtrap for dev)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@vendorbridge.com
```

### `package.json` scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

### Key dependencies
```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "express": "^4.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "zod": "^3.x",
    "nodemailer": "^6.x",
    "pdfkit": "^0.x",
    "dotenv": "^16.x",
    "cors": "^2.x",
    "morgan": "^1.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x",
    "ts-node-dev": "^2.x",
    "@types/express": "^4.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcryptjs": "^2.x",
    "@types/nodemailer": "^6.x",
    "@types/pdfkit": "^0.x"
  }
}
```

### Seed data (`prisma/seed.ts`)
Seed the following on `db:seed` to enable demo flow immediately:
- 1 Admin user
- 1 Procurement Officer user
- 1 Manager user
- 3 Vendor users + linked Vendor profiles (ACTIVE, with categories + GST)
- 1 sample RFQ in DRAFT
- Docker compose not needed — run Postgres locally or via `docker run -e POSTGRES_DB=vendorbridge -e POSTGRES_USER=vb_user -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16-alpine`

---

## Dropped from Previous Version (Intentionally)

| Feature | Reason |
|---------|--------|
| Redis / refresh tokens | Overkill; 7d JWT is fine for hackathon |
| MinIO / S3 file storage | Removed file upload; attachments deferred |
| RFQ Amendments | Edge case; re-create RFQ instead |
| GRN (Goods Receipt Note) | Full delivery verification cycle not needed |
| Negotiation threads | Real-time chat; out of scope |
| Vendor onboarding documents | Document upload/verify pipeline deferred |
| Nginx reverse proxy | Run API + frontend directly |
| Docker Compose | Single `docker run` for Postgres is enough |

---

*VendorBridge Hackathon 2026 — Architecture v2.0 (Lean Build)*
