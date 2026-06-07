# 🌉 VendorBridge — B2B Procurement & Vendor Management Platform

VendorBridge is a production-grade, full-stack B2B procurement platform designed to streamline the entire source-to-pay lifecycle. It empowers procurement officers, managers, and vendors to collaborate seamlessly across **RFQs (Requests for Quotation), multi-level approvals, Purchase Orders, and Invoicing**. By replacing scattered emails and spreadsheets with a unified, real-time dashboard, VendorBridge eliminates cognitive overhead and accelerates procurement cycles.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Role-Based Access Control** | Dedicated dashboards and workflows for Admin, Procurement Officer, Manager, and Vendor |
| **Vendor Onboarding & Rating** | Comprehensive vendor profiles with performance tracking (0–5 stars based on past deliveries) |
| **RFQ Management** | Fast RFQ creation with itemized requirements, deadlines, and bulk-category vendor invitations |
| **Quotation Matrix** | Side-by-side comparison matrix for quotations with auto-highlighting of the lowest price and fastest delivery |
| **Multi-Level Approvals** | Thumb-friendly approval queue for managers with side-by-side comparison summaries and one-tap decisions |
| **Automated PO Generation** | One-click Purchase Order generation from approved quotations with printable PDF exports |
| **Invoice Tracking** | Complete invoice lifecycle management (Draft, Sent, Paid, Overdue) with email delivery |
| **Activity Audit Trail** | Write-once, immutable activity logs for complete compliance tracking across every state change |
| **Real-time Notifications** | In-app alerts and status chips for RFQ deadlines, quotation submissions, and required approvals |
| **Analytics & Reporting** | Visual dashboards tracking monthly spend, vendor performance, and approval cycle times |
| **Security Hardened** | JWT authentication, bcrypt password hashing, and role-based route guards |

---

## 🏗️ Architecture

```
odoo-ksv/
├── backend/                         # Node.js + Express backend
│   ├── package.json                 # npm dependencies
│   ├── .env                         # Environment variables
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema & models
│   │   └── seed.ts                  # Database seeding script
│   └── src/
│       ├── index.ts                 # Express app entry point
│       ├── config/                  # DB connection and env validation
│       ├── controllers/             # Request handlers (Auth, RFQ, PO, Vendors)
│       ├── middlewares/             # Error handling, Auth/Role guards
│       ├── routes/                  # API route definitions
│       └── services/                # Core business logic (Email, PDF generation)
├── Frontend/                        # React 19 + Vite 8 frontend
│   ├── package.json                 # npm dependencies
│   ├── vite.config.ts               # Vite build config
│   ├── tailwind.config.js           # TailwindCSS configuration
│   ├── index.html                   # HTML entry point
│   └── src/
│       ├── App.tsx                  # React Router setup
│       ├── main.tsx                 # React entry point
│       ├── index.css                # Global styles & design system tokens
│       ├── components/              # Reusable UI components (Buttons, Tables, Modals)
│       ├── pages/                   # Route-level components (Dashboard, RFQs, Vendors)
│       ├── lib/                     # Utilities (Axios config, formatting)
│       └── assets/                  # Static images and icons
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) | High-performance RESTful API framework |
| [Prisma ORM](https://www.prisma.io/) | Type-safe database access and schema migrations |
| [PostgreSQL](https://www.postgresql.org/) | Relational database for structured procurement data |
| JWT + bcryptjs | Authentication and password hashing |
| Nodemailer | Transactional email delivery (Invoices, Password Resets) |
| PDFKit | On-the-fly PDF generation for Purchase Orders and Invoices |

### Frontend
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) | Modern SPA framework and blazing fast bundler |
| [TailwindCSS 3](https://tailwindcss.com/) | Utility-first CSS framework for rapid styling |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible, customizable component library |
| [Lucide React](https://lucide.dev/) | Consistent, crisp icon system |
| [React Router 7](https://reactrouter.com/) | Client-side routing and layout management |
| Axios | Promise-based HTTP client |

---

## 🗄️ Database Schema

The system is built on a robust relational schema utilizing PostgreSQL and Prisma ORM.

### Core Entities

| Model | Description | Key Relationships |
|---|---|---|
| **`User`** | Platform users with role-based access (`ADMIN`, `MANAGER`, `PROCUREMENT_OFFICER`, `VENDOR`). | Can act as an `Approver` or be linked to a `Vendor` profile. |
| **`Vendor`** | Business profile containing GST number, category, company name, and rating. | 1:1 with `User`. 1:N with `RFQInvites`, `Quotations`, `PurchaseOrders`, and `Invoices`. |
| **`RFQ`** | Request for Quotation detailing required items and deadline. Tracks revision history. | Created by `User`. 1:N with `RFQItems` and `Quotations`. |
| **`Quotation`** | Vendor's pricing response to an RFQ, including tax, delivery days, and itemized costs. | Belongs to `RFQ` and `Vendor`. 1:N with `QuotationItems`. |
| **`Approval`** | Managerial approval record for a selected quotation before a PO can be issued. | Links 1:1 to `RFQ` and `Quotation`. Approved by `User`. |
| **`PurchaseOrder`** | Binding contract issued to a vendor upon manager approval. Tracks fulfillment status. | Links 1:1 to `Approval` and `Quotation`. Belongs to `Vendor`. |
| **`GRN`** | Goods Receipt Note tracking the physical receipt of items against a PO. | Belongs to `PurchaseOrder`. 1:N with `GRNItems`. |
| **`Invoice`** | Financial document raised against a PO for payment tracking (Draft, Sent, Paid, Overdue). | Belongs to `PurchaseOrder` and `Vendor`. 1:N with `InvoiceItems`. |

> **Note:** The system uses an immutable `ActivityLog` table to preserve a complete, write-once audit trail of every state change across these entities.

---

## 🔄 Core Procurement Workflow

VendorBridge digitizes the end-to-end procurement process through a strict state machine:

1. **Vendor Onboarding** — Admins invite or register vendors. Vendors complete their profiles (GST, Category, Contact).
2. **RFQ Creation** — Procurement Officers create RFQs with itemized lists and deadlines, inviting specific vendors or bulk-inviting by category.
3. **Quotation Submission** — Invited vendors receive alerts, view the RFQ, and submit itemized quotations with tax and delivery terms.
4. **Comparison & Selection** — Officers view all submitted quotations in a real-time matrix. The system automatically highlights the lowest price and fastest delivery.
5. **Manager Approval** — The selected quotation goes to a Manager's queue. The Manager reviews a compact summary and Approves or Rejects.
6. **PO Issuance** — Upon approval, a Purchase Order is automatically generated and sent to the winning vendor.
7. **Invoicing** — Once goods are delivered, the vendor or officer generates an Invoice against the PO, tracking it until Paid.

---

## 🔒 Security

VendorBridge implements robust security measures for enterprise use:

| Feature | Implementation |
|---|---|
| **Role-Based Access Control** | API endpoints and frontend routes are strictly guarded by User Roles (Admin, Manager, Officer, Vendor) |
| **Authentication** | Stateless JWT-based authentication with expiration |
| **Password Security** | Passwords hashed via `bcrypt` with a high salt round factor |
| **Data Isolation** | Vendors can only view RFQs they are invited to and Quotations/POs assigned to them |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **npm**
- **PostgreSQL 14+**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/MaitraAmbalia/odoo-ksv.git
cd odoo-ksv
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and configure your PostgreSQL DATABASE_URL

# Run database migrations
npm run db:migrate

# Seed the database with mock data (optional)
npm run db:seed
```

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd Frontend

# Install dependencies
npm install
```

### 4. Run the Application

You need **two terminals** running simultaneously:

**Terminal 1 — Start the Backend (port 4000):**

```bash
cd backend
npm run dev
```

**Terminal 2 — Start the Frontend (port 5173):**

```bash
cd Frontend
npm run dev
```

### 5. Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)** — the frontend will communicate with the backend at `http://localhost:4000`.

---

## 🔑 Environment Variables

Ensure your `backend/.env` file is properly configured:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/odoo_ksv?schema=public`) | Yes |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | Yes |
| `PORT` | Backend API port (Default: 4000) | No |
| `CLIENT_URL` | Frontend URL for CORS and email links (Default: http://localhost:5173) | No |
| `SMTP_HOST` | SMTP Host for email delivery | Yes |
| `SMTP_PORT` | SMTP Port | Yes |
| `SMTP_USER` | SMTP Username | Yes |
| `SMTP_PASS` | SMTP Password | Yes |

---

## 📡 API Reference

The backend exposes a RESTful API at `http://localhost:4000/api/v1`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user/vendor |
| `POST` | `/api/v1/auth/login` | Authenticate and retrieve JWT |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset link |

### Core Entities
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/rfqs` | List RFQs (filtered by role) |
| `POST` | `/api/v1/rfqs` | Create a new RFQ |
| `POST` | `/api/v1/rfqs/:id/quotations` | Submit a quotation for an RFQ |
| `POST` | `/api/v1/approvals/:id/approve` | Approve a selected quotation |
| `GET` | `/api/v1/purchase-orders` | List Purchase Orders |
| `GET` | `/api/v1/invoices` | List Invoices |

---

## 🌐 Frontend Pages

| Route | Component | Description |
|---|---|---|
| `/login` | `SignInPage` | User authentication — sign in |
| `/register` | `SignUpPage` | User authentication — sign up |
| `/dashboard` | `Dashboard` | Role-adaptive dashboard with KPIs and quick actions |
| `/rfqs` | `RFQList` | List of active/past RFQs with status chips |
| `/rfqs/new` | `CreateRFQ` | Multi-step RFQ creation form |
| `/rfqs/:id/compare` | `CompareQuotations` | Real-time quotation comparison matrix |
| `/approvals` | `ApprovalQueue` | Manager approval queue with side-by-side details |
| `/purchase-orders` | `POList` | List of Purchase Orders and generation interface |

---

## 📄 License

This project is open-source and available for enterprise use.
