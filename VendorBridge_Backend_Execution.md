# VendorBridge — Backend Execution Guide
**Stack:** PostgreSQL · Prisma · Express · TypeScript · Node.js  
**Context:** Procurement & Vendor Management ERP — Hackathon Build  
**Schema Reference:** `schema.prisma` (final reconciled version)

---

## What We Are Building

VendorBridge is a backend ERP system that manages the full procurement lifecycle:

```
Vendor Registration
       ↓
   RFQ Created  →  Vendors Invited  →  Quotations Submitted
       ↓
  Quotation Comparison  →  Best Quote Selected
       ↓
   Approval Workflow  (PENDING → APPROVED / REJECTED)
       ↓
  Purchase Order Auto-Generated  →  GRN on Delivery
       ↓
   Invoice Generated  →  PDF Download / Email Sent  →  Marked Paid
       ↓
  Activity Logs + Notifications throughout every step
```

Four roles: **ADMIN**, **PROCUREMENT_OFFICER**, **MANAGER**, **VENDOR**

---

## PHASE 0 — Project Setup

### Step 0.1 — Initialize the Project

```bash
mkdir vendorbridge && cd vendorbridge
npm init -y
npm install express @prisma/client jsonwebtoken bcryptjs zod \
            nodemailer pdfkit dotenv cors morgan uuid
npm install -D prisma typescript ts-node-dev @types/express \
               @types/jsonwebtoken @types/bcryptjs @types/nodemailer \
               @types/pdfkit @types/cors @types/morgan @types/uuid
npx tsc --init
```

### Step 0.2 — tsconfig.json

Set these in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### Step 0.3 — package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

### Step 0.4 — .env File

```env
DATABASE_URL="postgresql://vb_user:password@localhost:5432/vendorbridge"
JWT_SECRET=change_me_minimum_32_characters_long
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
FROM_EMAIL=noreply@vendorbridge.com
```

### Step 0.5 — Start PostgreSQL

```bash
docker run -d \
  --name vendorbridge-db \
  -e POSTGRES_DB=vendorbridge \
  -e POSTGRES_USER=vb_user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## PHASE 1 — Database (Prisma Schema + Migration)

### Step 1.1 — Initialize Prisma

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and updates `.env` with `DATABASE_URL`.

### Step 1.2 — Copy Final Schema

Replace the contents of `prisma/schema.prisma` with the **final reconciled schema** (the `schema.prisma` file delivered alongside this guide).

Key models in order of dependency:
```
User → Vendor → VendorDocument
User → RFQ → RFQItem, RFQVendorInvite, RFQAmendment, RFQAttachment
Vendor + RFQ → Quotation → QuotationItem, QuotationAttachment
Quotation → Approval → PurchaseOrder → POItem
PurchaseOrder → GRN → GRNItem, GRNAttachment
PurchaseOrder → Invoice → InvoiceItem
Vendor + RFQ → NegotiationThread → NegotiationMessage
User → ActivityLog
User → Notification
```

### Step 1.3 — Run Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

`prisma generate` produces the typed Prisma Client in `node_modules/@prisma/client`.  
**Always run `prisma generate` after any schema change.**

### Step 1.4 — Verify in Prisma Studio

```bash
npx prisma studio
```

Open `http://localhost:5555` and confirm all tables are created with correct columns.

---

## PHASE 2 — Project File Structure

Create all folders and empty files before writing any logic. This keeps the build organized.

```
vendorbridge/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── index.ts
    ├── app.ts
    ├── config/
    │   ├── db.ts
    │   └── env.ts
    ├── routes/
    │   ├── index.ts
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── vendor.routes.ts
    │   ├── rfq.routes.ts
    │   ├── quotation.routes.ts
    │   ├── comparison.routes.ts
    │   ├── approval.routes.ts
    │   ├── purchaseOrder.routes.ts
    │   ├── invoice.routes.ts
    │   ├── grn.routes.ts
    │   ├── activityLog.routes.ts
    │   ├── notification.routes.ts
    │   ├── dashboard.routes.ts
    │   └── report.routes.ts
    ├── controllers/          (mirror of routes/)
    ├── services/             (mirror of routes/ + email.service.ts, pdf.service.ts)
    ├── middlewares/
    │   ├── authenticate.ts
    │   ├── authorize.ts
    │   ├── validate.ts
    │   ├── asyncHandler.ts
    │   └── errorHandler.ts
    ├── validators/
    │   ├── auth.validator.ts
    │   ├── vendor.validator.ts
    │   ├── rfq.validator.ts
    │   ├── quotation.validator.ts
    │   ├── approval.validator.ts
    │   └── invoice.validator.ts
    ├── types/
    │   ├── express.d.ts
    │   └── enums.ts
    └── utils/
        ├── generateNumber.ts
        ├── calculateTax.ts
        ├── apiResponse.ts
        ├── auditLog.ts
        └── pagination.ts
```

```bash
# Create all directories at once
mkdir -p src/{config,routes,controllers,services,middlewares,validators,types,utils}
```

---

## PHASE 3 — Core Infrastructure (Build First)

These files have zero business logic but every other module depends on them. Build them in order.

### Step 3.1 — Prisma Client Singleton (`src/config/db.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

**Why singleton:** Prisma opens a connection pool. Creating a new `PrismaClient()` per request exhausts connections.

### Step 3.2 — Environment Config (`src/config/env.ts`)

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  PORT: parseInt(process.env.PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@vendorbridge.com',
};

// Crash early if critical env vars are missing
const required = ['DATABASE_URL', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
});
```

### Step 3.3 — Express Request Type Augmentation (`src/types/express.d.ts`)

```typescript
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: User;  // Populated by authenticate middleware
    }
  }
}
```

### Step 3.4 — API Response Wrapper (`src/utils/apiResponse.ts`)

```typescript
export const apiResponse = {
  success: <T>(data: T, message?: string) => ({
    success: true,
    data,
    message,
  }),
  error: (message: string, code?: string) => ({
    success: false,
    message,
    code,
  }),
  paginated: <T>(
    data: T[],
    pagination: { page: number; limit: number; total: number }
  ) => ({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  }),
};
```

### Step 3.5 — Async Handler (`src/middlewares/asyncHandler.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

### Step 3.6 — Error Classes + Global Error Handler (`src/middlewares/errorHandler.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Duplicate entry — this record already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }
  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
  }
  // App errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
};
```

### Step 3.7 — Validate Middleware (`src/middlewares/validate.ts`)

```typescript
import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  };
// Note: wrap in asyncHandler at the route level so Zod errors hit errorHandler
```

### Step 3.8 — Pagination Helper (`src/utils/pagination.ts`)

```typescript
export const getPagination = (query: any) => {
  const page  = Math.max(1, parseInt(query.page  || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};
```

### Step 3.9 — Audit Log Helper (`src/utils/auditLog.ts`)

```typescript
import prisma from '../config/db';

interface AuditPayload {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  meta?: Record<string, any>;
}

// Action constants — use these everywhere, never raw strings
export const Actions = {
  VENDOR_REGISTERED:        'VENDOR_REGISTERED',
  VENDOR_STATUS_CHANGED:    'VENDOR_STATUS_CHANGED',
  VENDOR_DOC_UPLOADED:      'VENDOR_DOC_UPLOADED',
  RFQ_CREATED:              'RFQ_CREATED',
  RFQ_PUBLISHED:            'RFQ_PUBLISHED',
  RFQ_AMENDED:              'RFQ_AMENDED',
  RFQ_CLOSED:               'RFQ_CLOSED',
  RFQ_CANCELLED:            'RFQ_CANCELLED',
  QUOTATION_SUBMITTED:      'QUOTATION_SUBMITTED',
  QUOTATION_WITHDRAWN:      'QUOTATION_WITHDRAWN',
  QUOTATION_SUPERSEDED:     'QUOTATION_SUPERSEDED',
  QUOTATION_SELECTED:       'QUOTATION_SELECTED',
  APPROVAL_CREATED:         'APPROVAL_CREATED',
  APPROVAL_APPROVED:        'APPROVAL_APPROVED',
  APPROVAL_REJECTED:        'APPROVAL_REJECTED',
  PO_ISSUED:                'PO_ISSUED',
  PO_STATUS_CHANGED:        'PO_STATUS_CHANGED',
  PO_CANCELLED:             'PO_CANCELLED',
  GRN_SUBMITTED:            'GRN_SUBMITTED',
  GRN_VERIFIED:             'GRN_VERIFIED',
  INVOICE_GENERATED:        'INVOICE_GENERATED',
  INVOICE_SENT:             'INVOICE_SENT',
  INVOICE_PAID:             'INVOICE_PAID',
  INVOICE_OVERDUE:          'INVOICE_OVERDUE',
  INVOICE_CANCELLED:        'INVOICE_CANCELLED',
} as const;

export const auditLog = {
  write: (payload: AuditPayload) =>
    prisma.activityLog.create({ data: payload }),
};
```

### Step 3.10 — GST Calculator (`src/utils/calculateTax.ts`)

```typescript
export type TaxType = 'GST_INTRA' | 'GST_INTER';

export interface TaxResult {
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;  // total tax regardless of type
  grandTotal: number;
}

export const calculateGST = (
  subtotal: number,
  gstRate: number,
  taxType: TaxType
): TaxResult => {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (taxType === 'GST_INTRA') {
    const half = round2((subtotal * (gstRate / 2)) / 100);
    return { cgst: half, sgst: half, igst: 0, gstAmount: round2(half * 2), grandTotal: round2(subtotal + half * 2) };
  }
  const igst = round2((subtotal * gstRate) / 100);
  return { cgst: 0, sgst: 0, igst, gstAmount: igst, grandTotal: round2(subtotal + igst) };
};
```

### Step 3.11 — Number Generators (`src/utils/generateNumber.ts`)

```typescript
import prisma from '../config/db';

const year = () => new Date().getFullYear();
const pad  = (n: number) => String(n).padStart(4, '0');

export const generatePONumber = async (): Promise<string> => {
  const count = await prisma.purchaseOrder.count();
  return `PO-${year()}-${pad(count + 1)}`;
};

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.invoice.count();
  return `INV-${year()}-${pad(count + 1)}`;
};
```

---

## PHASE 4 — Auth Module

### Step 4.1 — Auth Middlewares

**`src/middlewares/authenticate.ts`**
```typescript
import jwt from 'jsonwebtoken';
import { asyncHandler } from './asyncHandler';
import { AppError } from './errorHandler';
import prisma from '../config/db';
import { env } from '../config/env';

interface JWTPayload { id: string; role: string; }

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError(401, 'No token provided');

  const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!user || !user.isActive) throw new AppError(401, 'Account not found or inactive');
  req.user = user;
  next();
});
```

**`src/middlewares/authorize.ts`**
```typescript
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';

export const authorize = (...roles: Role[]) =>
  (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, `Access denied. Required role: ${roles.join(' or ')}`);
    }
    next();
  };
```

### Step 4.2 — Auth Validator (`src/validators/auth.validator.ts`)

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName:  z.string().min(1),
    lastName:   z.string().min(1),
    email:      z.string().email(),
    password:   z.string().min(8),
    phone:      z.string().optional(),
    country:    z.string().optional(),
    role:       z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR']),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),
});
```

### Step 4.3 — Auth Service (`src/services/auth.service.ts`)

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { env } from '../config/env';

export const register = async (body: any) => {
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: { ...body, password: undefined, passwordHash },
  });
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return { token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } };
};
```

### Step 4.4 — Auth Controller (`src/controllers/auth.controller.ts`)

```typescript
import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import * as authService from '../services/auth.service';
import { apiResponse } from '../utils/apiResponse';
import { registerSchema, loginSchema } from '../validators/auth.validator';

export const register = asyncHandler(async (req: Request, res: Response) => {
  registerSchema.parse({ body: req.body });
  const result = await authService.register(req.body);
  res.status(201).json(apiResponse.success(result, 'Registered successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  loginSchema.parse({ body: req.body });
  const result = await authService.login(req.body.email, req.body.password);
  res.status(200).json(apiResponse.success(result, 'Login successful'));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { passwordHash, ...user } = req.user as any;
  res.json(apiResponse.success(user));
});
```

### Step 4.5 — Auth Routes (`src/routes/auth.routes.ts`)

```typescript
import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        authenticate, ctrl.me);

export default router;
```

---

## PHASE 5 — Vendor Module

### Vendor Validator

```typescript
// src/validators/vendor.validator.ts
import { z } from 'zod';

export const createVendorSchema = z.object({
  body: z.object({
    userId:       z.string().uuid(),
    companyName:  z.string().min(1),
    category:     z.string().min(1),
    gstNumber:    z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number'),
    contactPhone: z.string().min(10),
    address:      z.string().optional(),
  }),
});
```

### Vendor Service — Key Methods

```typescript
// src/services/vendor.service.ts
import prisma from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { auditLog, Actions } from '../utils/auditLog';

export const listVendors = async (query: any) => {
  const { status, category, search, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status)   where.status   = status;
  if (category) where.category = category;
  if (search)   where.OR = [
    { companyName: { contains: search, mode: 'insensitive' } },
    { gstNumber:   { contains: search, mode: 'insensitive' } },
  ];

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({ where, skip, take: parseInt(limit), include: { user: { select: { email: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.vendor.count({ where }),
  ]);
  return { vendors, total };
};

export const changeStatus = async (id: string, status: string, actorId: string) => {
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.vendor.update({ where: { id }, data: { status: status as any } });
  await auditLog.write({ userId: actorId, entityType: 'VENDOR', entityId: id, action: Actions.VENDOR_STATUS_CHANGED, meta: { from: vendor.status, to: status } });
  return updated;
};
```

### Vendor Routes

```typescript
// src/routes/vendor.routes.ts
router.get('/',            authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER'), listVendors);
router.post('/',           authenticate, authorize('ADMIN'),                        createVendor);
router.get('/:id',         authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'), getVendor);
router.patch('/:id',       authenticate, authorize('ADMIN'),                        updateVendor);
router.patch('/:id/status',authenticate, authorize('ADMIN'),                        changeStatus);
```

---

## PHASE 6 — RFQ Module

### RFQ Validator

```typescript
// src/validators/rfq.validator.ts
import { z } from 'zod';

export const createRFQSchema = z.object({
  body: z.object({
    title:       z.string().min(1),
    category:    z.string().min(1),
    description: z.string().optional(),
    deadline:    z.string().datetime(),
    items: z.array(z.object({
      itemName:    z.string().min(1),
      description: z.string().optional(),
      quantity:    z.number().int().positive(),
      unit:        z.string().min(1),
    })).min(1, 'At least one item required'),
    vendorIds: z.array(z.string().uuid()).optional().default([]),
  }),
});
```

### RFQ Service — Key Methods

```typescript
// src/services/rfq.service.ts
export const createRFQ = async (body: any, actorId: string) => {
  const { items, vendorIds, ...rfqData } = body;
  const rfq = await prisma.rFQ.create({
    data: {
      ...rfqData,
      createdById: actorId,
      deadline: new Date(rfqData.deadline),
      items: { create: items },
      vendorInvites: vendorIds?.length
        ? { create: vendorIds.map((vendorId: string) => ({ vendorId })) }
        : undefined,
    },
    include: { items: true, vendorInvites: true },
  });
  await auditLog.write({ userId: actorId, entityType: 'RFQ', entityId: rfq.id, action: Actions.RFQ_CREATED });
  return rfq;
};

export const publishRFQ = async (rfqId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({
    where: { id: rfqId },
    include: { vendorInvites: { include: { vendor: { include: { user: true } } } } },
  });
  if (rfq.status !== 'DRAFT') throw new AppError(400, 'Only DRAFT RFQs can be published');
  if (rfq.vendorInvites.length === 0) throw new AppError(400, 'Assign at least one vendor before publishing');

  const updated = await prisma.rFQ.update({ where: { id: rfqId }, data: { status: 'PUBLISHED' } });

  // Notify each invited vendor
  await Promise.all(
    rfq.vendorInvites.map(invite =>
      prisma.notification.create({
        data: {
          userId:     invite.vendor.userId,
          type:       'RFQ_INVITE',
          title:      'New RFQ Invitation',
          body:       `You have been invited to submit a quotation for: ${rfq.title}`,
          entityType: 'RFQ',
          entityId:   rfqId,
        },
      })
    )
  );
  await auditLog.write({ userId: actorId, entityType: 'RFQ', entityId: rfqId, action: Actions.RFQ_PUBLISHED, meta: { vendorCount: rfq.vendorInvites.length } });
  return updated;
};
```

### RFQ Routes

```typescript
// src/routes/rfq.routes.ts — all routes
router.get('/',                        authenticate, authorize('ADMIN','PROCUREMENT_OFFICER','MANAGER'), listRFQs);
router.post('/',                       authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           createRFQ);
router.get('/:id',                     authenticate, authenticate,                                       getRFQ);
router.patch('/:id',                   authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           updateRFQ);
router.delete('/:id',                  authenticate, authorize('PROCUREMENT_OFFICER'),                   deleteRFQ);
router.post('/:id/publish',            authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           publishRFQ);
router.post('/:id/close',              authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           closeRFQ);
router.post('/:id/cancel',             authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           cancelRFQ);
router.post('/:id/vendors',            authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           addVendors);
router.delete('/:id/vendors/:vendorId',authenticate, authorize('ADMIN','PROCUREMENT_OFFICER'),           removeVendor);
```

---

## PHASE 7 — Quotation Module

### Quotation Validator

```typescript
export const createQuotationSchema = z.object({
  body: z.object({
    deliveryDays:  z.number().int().positive(),
    gstRate:       z.number().min(0).max(28).default(18),
    taxType:       z.enum(['GST_INTRA', 'GST_INTER']).default('GST_INTRA'),
    notes:         z.string().optional(),
    paymentTerms:  z.string().optional(),
    items: z.array(z.object({
      rfqItemId:  z.string().uuid(),
      unitPrice:  z.number().positive(),
    })).min(1),
  }),
});
```

### Quotation Service — Key Methods

```typescript
export const createQuotation = async (rfqId: string, body: any, vendorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId }, include: { items: true } });
  if (rfq.status !== 'PUBLISHED') throw new AppError(400, 'RFQ is not accepting quotations');

  // Verify vendor is invited
  const invite = await prisma.rFQVendorInvite.findUnique({ where: { rfqId_vendorId: { rfqId, vendorId } } });
  if (!invite) throw new AppError(403, 'Not invited to this RFQ');

  // Calculate totals
  const subtotal = body.items.reduce((sum: number, item: any) => {
    const rfqItem = rfq.items.find(i => i.id === item.rfqItemId);
    if (!rfqItem) throw new AppError(400, `RFQ item ${item.rfqItemId} not found`);
    return sum + item.unitPrice * rfqItem.quantity;
  }, 0);
  const tax = calculateGST(subtotal, body.gstRate, body.taxType);

  const quotation = await prisma.quotation.upsert({
    where: { rfqId_vendorId: { rfqId, vendorId } },
    create: {
      rfqId, vendorId, ...body,
      subtotal, gstAmount: tax.gstAmount, grandTotal: tax.grandTotal,
      items: {
        create: body.items.map((item: any) => {
          const rfqItem = rfq.items.find(i => i.id === item.rfqItemId)!;
          return { rfqItemId: item.rfqItemId, unitPrice: item.unitPrice, totalPrice: item.unitPrice * rfqItem.quantity };
        }),
      },
    },
    update: {
      ...body, subtotal, gstAmount: tax.gstAmount, grandTotal: tax.grandTotal, status: 'DRAFT',
      items: {
        deleteMany: {},
        create: body.items.map((item: any) => {
          const rfqItem = rfq.items.find(i => i.id === item.rfqItemId)!;
          return { rfqItemId: item.rfqItemId, unitPrice: item.unitPrice, totalPrice: item.unitPrice * rfqItem.quantity };
        }),
      },
    },
    include: { items: true },
  });
  return quotation;
};

export const submitQuotation = async (quotationId: string, vendorId: string) => {
  const q = await prisma.quotation.findUniqueOrThrow({ where: { id: quotationId } });
  if (q.vendorId !== vendorId)   throw new AppError(403, 'Not your quotation');
  if (q.status !== 'DRAFT')      throw new AppError(400, 'Only DRAFT quotations can be submitted');

  const updated = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
  // Update invite status
  await prisma.rFQVendorInvite.update({
    where: { rfqId_vendorId: { rfqId: q.rfqId, vendorId } },
    data: { status: 'SUBMITTED' },
  });
  await auditLog.write({ userId: vendorId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_SUBMITTED });
  return updated;
};
```

---

## PHASE 8 — Comparison + Quotation Selection

### Comparison Service

```typescript
// GET /rfqs/:rfqId/comparison
export const getComparison = async (rfqId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({
    where: { id: rfqId },
    include: {
      items: true,
      quotations: {
        where: { status: 'SUBMITTED' },
        include: { vendor: true, items: { include: { rfqItem: true } } },
      },
    },
  });

  const quotes = rfq.quotations;
  const minTotal    = Math.min(...quotes.map(q => q.grandTotal));
  const minDelivery = Math.min(...quotes.map(q => q.deliveryDays));

  return {
    rfq: { id: rfq.id, title: rfq.title, items: rfq.items },
    quotations: quotes.map(q => ({
      quotationId:      q.id,
      vendorId:         q.vendorId,
      vendorName:       q.vendor.companyName,
      vendorRating:     q.vendor.rating,
      grandTotal:       q.grandTotal,
      subtotal:         q.subtotal,
      gstRate:          q.gstRate,
      taxType:          q.taxType,
      deliveryDays:     q.deliveryDays,
      paymentTerms:     q.paymentTerms,
      notes:            q.notes,
      items:            q.items.map(i => ({ rfqItemId: i.rfqItemId, itemName: i.rfqItem.itemName, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
      isLowestPrice:    q.grandTotal  === minTotal,
      isFastestDelivery:q.deliveryDays === minDelivery,
    })),
  };
};

// POST /rfqs/:rfqId/comparison/select
export const selectQuotation = async (rfqId: string, quotationId: string, actorId: string) => {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: rfqId }, include: { quotations: true } });

  await prisma.$transaction(async (tx) => {
    // Accept selected, reject others
    await tx.quotation.update({ where: { id: quotationId }, data: { status: 'ACCEPTED' } });
    await tx.quotation.updateMany({
      where: { rfqId, id: { not: quotationId }, status: 'SUBMITTED' },
      data: { status: 'REJECTED' },
    });
    // Create approval record
    await tx.approval.create({ data: { rfqId, quotationId, status: 'PENDING' } });
    // Close the RFQ
    await tx.rFQ.update({ where: { id: rfqId }, data: { status: 'CLOSED' } });
  });

  // Notify all MANAGER users
  const managers = await prisma.user.findMany({ where: { role: 'MANAGER', isActive: true } });
  await Promise.all(managers.map(m =>
    prisma.notification.create({
      data: { userId: m.id, type: 'APPROVAL_NEEDED', title: 'Approval Required', body: `A quotation has been selected for RFQ: ${rfq.title}`, entityType: 'RFQ', entityId: rfqId },
    })
  ));
  await auditLog.write({ userId: actorId, entityType: 'QUOTATION', entityId: quotationId, action: Actions.QUOTATION_SELECTED, meta: { rfqId } });
};
```

---

## PHASE 9 — Approval Module

### Approval Service — Key Methods

```typescript
// POST /approvals/:id/approve
export const approveQuotation = async (approvalId: string, remarks: string, approverId: string) => {
  const approval = await prisma.approval.findUniqueOrThrow({
    where: { id: approvalId },
    include: { quotation: { include: { items: { include: { rfqItem: true } } } }, rfq: true },
  });
  if (approval.status !== 'PENDING') throw new AppError(400, 'Approval already decided');

  const poNumber = await generatePONumber();

  await prisma.$transaction(async (tx) => {
    // Update approval
    await tx.approval.update({
      where: { id: approvalId },
      data: { status: 'APPROVED', approverId, remarks, decidedAt: new Date() },
    });

    // Auto-create Purchase Order with line items
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        approvalId,
        quotationId: approval.quotationId,
        vendorId:    approval.quotation.vendorId,
        status:      'ISSUED',
        items: {
          create: approval.quotation.items.map(qi => ({
            rfqItemId:      qi.rfqItemId,
            quotationItemId:qi.id,
            quantity:       qi.rfqItem.quantity,
            unitPrice:      qi.unitPrice,
            totalPrice:     qi.totalPrice,
          })),
        },
      },
    });

    // Notify officer and vendor
    const [officer, vendor] = await Promise.all([
      tx.user.findUnique({ where: { id: approval.rfq.createdById } }),
      tx.vendor.findUnique({ where: { id: approval.quotation.vendorId }, include: { user: true } }),
    ]);
    await Promise.all([
      officer && tx.notification.create({ data: { userId: officer.id, type: 'APPROVAL_DECIDED', title: 'Quotation Approved', body: `PO ${poNumber} has been generated.`, entityType: 'PO', entityId: po.id } }),
      vendor  && tx.notification.create({ data: { userId: vendor.user.id, type: 'PO_ISSUED', title: 'Purchase Order Issued', body: `PO ${poNumber} has been issued to your company.`, entityType: 'PO', entityId: po.id } }),
    ]);
  });

  await auditLog.write({ userId: approverId, entityType: 'APPROVAL', entityId: approvalId, action: Actions.APPROVAL_APPROVED, meta: { poNumber, remarks } });
};

// POST /approvals/:id/reject
export const rejectQuotation = async (approvalId: string, remarks: string, approverId: string) => {
  const approval = await prisma.approval.findUniqueOrThrow({ where: { id: approvalId }, include: { rfq: true } });
  if (approval.status !== 'PENDING') throw new AppError(400, 'Approval already decided');
  if (!remarks) throw new AppError(400, 'Remarks are required when rejecting');

  await prisma.approval.update({
    where: { id: approvalId },
    data: { status: 'REJECTED', approverId, remarks, decidedAt: new Date() },
  });

  // Notify officer
  const officer = await prisma.user.findUnique({ where: { id: approval.rfq.createdById } });
  if (officer) {
    await prisma.notification.create({ data: { userId: officer.id, type: 'APPROVAL_DECIDED', title: 'Quotation Rejected', body: `Rejection reason: ${remarks}`, entityType: 'RFQ', entityId: approval.rfqId } });
  }
  await auditLog.write({ userId: approverId, entityType: 'APPROVAL', entityId: approvalId, action: Actions.APPROVAL_REJECTED, meta: { remarks } });
};
```

---

## PHASE 10 — Purchase Order Module

> **POs are auto-created in the approval service. No manual POST endpoint.**

### PO Service

```typescript
export const listPOs = async (query: any, user: any) => {
  const { status, vendorId, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (status)   where.status   = status;
  if (vendorId) where.vendorId = vendorId;
  if (user.role === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    where.vendorId = vendor.id;
  }

  const [pos, total] = await Promise.all([
    prisma.purchaseOrder.findMany({ where, skip, take: parseInt(limit),
      include: { vendor: true, quotation: true, items: { include: { rfqItem: true } } },
      orderBy: { issuedAt: 'desc' } }),
    prisma.purchaseOrder.count({ where }),
  ]);
  return { pos, total };
};
```

---

## PHASE 11 — GRN Module (Goods Receipt Note)

GRNs record what was actually received vs. what was ordered. They drive `POStatus` transitions.

```typescript
export const submitGRN = async (grnId: string, actorId: string) => {
  const grn = await prisma.gRN.findUniqueOrThrow({
    where: { id: grnId },
    include: { items: true, po: { include: { items: true } } },
  });

  await prisma.gRN.update({ where: { id: grnId }, data: { status: 'SUBMITTED' } });

  // Determine PO status from received quantities
  const allReceived = grn.items.every(item => item.qtyReceived >= item.qtyOrdered);
  const poStatus    = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

  await prisma.purchaseOrder.update({
    where: { id: grn.poId },
    data: { status: poStatus as any },
  });
  await auditLog.write({ userId: actorId, entityType: 'GRN', entityId: grnId, action: Actions.GRN_SUBMITTED, meta: { poStatus } });
};
```

---

## PHASE 12 — Invoice Module

### Invoice Service — Key Methods

```typescript
// POST /invoices  — generate from PO
export const generateInvoice = async (body: any, actorId: string) => {
  const { poId, dueDate, taxType, gstRate, notes } = body;
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: poId },
    include: { items: { include: { rfqItem: true } }, vendor: { include: { user: true } } },
  });
  if (po.status === 'CANCELLED') throw new AppError(400, 'Cannot invoice a cancelled PO');

  const subtotal = po.items.reduce((sum, i) => sum + i.totalPrice, 0);
  const tax = calculateGST(subtotal, gstRate ?? 18, taxType ?? 'GST_INTRA');
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber, poId, vendorId: po.vendorId,
      taxType: taxType ?? 'GST_INTRA',
      gstRate: gstRate ?? 18,
      subtotal,
      cgst:      tax.cgst,
      sgst:      tax.sgst,
      igst:      tax.igst,
      grandTotal:tax.grandTotal,
      dueDate:   new Date(dueDate),
      notes,
      items: {
        create: po.items.map(i => ({
          poItemId:    i.id,
          description: i.rfqItem.itemName,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          totalPrice:  i.totalPrice,
        })),
      },
    },
    include: { items: true },
  });

  await auditLog.write({ userId: actorId, entityType: 'INVOICE', entityId: invoice.id, action: Actions.INVOICE_GENERATED, meta: { invoiceNumber, grandTotal: tax.grandTotal } });
  return invoice;
};

// POST /invoices/:id/send — email invoice PDF to vendor
export const sendInvoice = async (invoiceId: string, actorId: string) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { vendor: { include: { user: true } }, items: true },
  });
  if (!['DRAFT', 'OVERDUE'].includes(invoice.status)) throw new AppError(400, 'Invoice already sent or paid');

  const pdfBuffer = await pdfService.generateInvoicePDF(invoice);
  await emailService.sendInvoiceEmail({ to: invoice.vendor.user.email, invoice, pdfBuffer });

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'SENT', sentAt: new Date() } });
  await auditLog.write({ userId: actorId, entityType: 'INVOICE', entityId: invoiceId, action: Actions.INVOICE_SENT });
};
```

### PDF Service (`src/services/pdf.service.ts`)

```typescript
import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end',  ()    => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('VendorBridge', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Tax Invoice', 50, 80);

    // Invoice meta
    doc.fontSize(11).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 50, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 65, { align: 'right' });
    doc.text(`Due:  ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 80, { align: 'right' });

    // Vendor info
    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('Vendor:');
    doc.font('Helvetica').text(invoice.vendor.companyName);

    // Line items table header
    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, doc.y, { width: 250, continued: false });
    doc.text('Qty',    300, doc.y - 14, { width: 60, align: 'right' });
    doc.text('Rate',   360, doc.y - 14, { width: 80, align: 'right' });
    doc.text('Amount', 440, doc.y - 14, { width: 100, align: 'right' });

    // Line items
    doc.font('Helvetica');
    invoice.items.forEach((item: any) => {
      doc.text(item.description, 50,  doc.y + 5, { width: 250 });
      doc.text(String(item.quantity),  300, doc.y - 14, { width: 60,  align: 'right' });
      doc.text(`₹${item.unitPrice.toFixed(2)}`, 360, doc.y - 14, { width: 80, align: 'right' });
      doc.text(`₹${item.totalPrice.toFixed(2)}`, 440, doc.y - 14, { width: 100, align: 'right' });
    });

    // Totals
    doc.moveDown();
    doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`,  { align: 'right' });
    if (invoice.cgst)  doc.text(`CGST (${invoice.gstRate / 2}%): ₹${invoice.cgst.toFixed(2)}`,  { align: 'right' });
    if (invoice.sgst)  doc.text(`SGST (${invoice.gstRate / 2}%): ₹${invoice.sgst.toFixed(2)}`,  { align: 'right' });
    if (invoice.igst)  doc.text(`IGST (${invoice.gstRate}%): ₹${invoice.igst.toFixed(2)}`,      { align: 'right' });
    doc.font('Helvetica-Bold').text(`Grand Total: ₹${invoice.grandTotal.toFixed(2)}`, { align: 'right' });

    doc.end();
  });
};
```

### Email Service (`src/services/email.service.ts`)

```typescript
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export const sendInvoiceEmail = async ({ to, invoice, pdfBuffer }: any) => {
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to,
    subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`,
    html: `<p>Dear ${invoice.vendor.companyName},</p>
           <p>Please find your invoice <strong>${invoice.invoiceNumber}</strong> attached.</p>
           <p>Amount Due: <strong>₹${invoice.grandTotal.toFixed(2)}</strong></p>
           <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>`,
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
};
```

---

## PHASE 13 — Notifications + Activity Logs

### Notification Routes

```typescript
router.get('/',               authenticate, listNotifications);       // paginated, own
router.get('/unread-count',   authenticate, getUnreadCount);          // { count: 5 }
router.patch('/:id/read',     authenticate, markOneRead);
router.patch('/read-all',     authenticate, markAllRead);
```

### Activity Log Routes

```typescript
router.get('/', authenticate, authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), listLogs);
// Filter: ?entityType=RFQ&entityId=uuid&userId=uuid&page=1&limit=20
// Logs are read-only — no POST, PATCH, DELETE
```

---

## PHASE 14 — Dashboard + Reports

### Dashboard (`GET /dashboard/summary`)

```typescript
export const getSummary = async (user: any) => {
  const now   = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeRFQs, pendingApprovals, posThisMonth, overdueInvoices, spendResult] =
    await Promise.all([
      prisma.rFQ.count({ where: { status: 'PUBLISHED' } }),
      prisma.approval.count({ where: { status: 'PENDING' } }),
      prisma.purchaseOrder.count({ where: { issuedAt: { gte: month } } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: { status: { in: ['SENT', 'PAID'] }, createdAt: { gte: month } },
        _sum: { grandTotal: true },
      }),
    ]);

  return {
    activeRFQs,
    pendingApprovals,
    posThisMonth,
    overdueInvoices,
    totalSpendThisMonth: spendResult._sum.grandTotal ?? 0,
  };
};
```

### Reports

```typescript
// GET /reports/vendor-performance
// Returns: per vendor — quotations submitted, won, avg delivery days, total PO value
export const vendorPerformance = async (query: any) => {
  const { from, to } = query;
  const dateFilter = from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};

  const vendors = await prisma.vendor.findMany({
    include: {
      quotations: { where: dateFilter, select: { status: true, deliveryDays: true } },
      purchaseOrders: { where: dateFilter, include: { items: true } },
    },
  });

  return vendors.map(v => ({
    vendorId:          v.id,
    companyName:       v.companyName,
    category:          v.category,
    rating:            v.rating,
    quotationsSubmitted: v.quotations.length,
    quotationsWon:       v.quotations.filter(q => q.status === 'ACCEPTED').length,
    avgDeliveryDays:     v.quotations.length > 0
      ? v.quotations.reduce((s, q) => s + q.deliveryDays, 0) / v.quotations.length
      : 0,
    totalPOValue: v.purchaseOrders.reduce(
      (sum, po) => sum + po.items.reduce((s, i) => s + i.totalPrice, 0), 0
    ),
  }));
};
```

---

## PHASE 15 — App Bootstrap + Route Mounting

### `src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';

// Route imports
import authRoutes         from './routes/auth.routes';
import userRoutes         from './routes/user.routes';
import vendorRoutes       from './routes/vendor.routes';
import rfqRoutes          from './routes/rfq.routes';
import quotationRoutes    from './routes/quotation.routes';
import comparisonRoutes   from './routes/comparison.routes';
import approvalRoutes     from './routes/approval.routes';
import poRoutes           from './routes/purchaseOrder.routes';
import invoiceRoutes      from './routes/invoice.routes';
import grnRoutes          from './routes/grn.routes';
import activityLogRoutes  from './routes/activityLog.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes    from './routes/dashboard.routes';
import reportRoutes       from './routes/report.routes';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
const api = '/api/v1';
app.use(`${api}/auth`,          authRoutes);
app.use(`${api}/users`,         userRoutes);
app.use(`${api}/vendors`,       vendorRoutes);
app.use(`${api}/rfqs`,          rfqRoutes);
app.use(`${api}/quotations`,    quotationRoutes);
app.use(`${api}/rfqs`,          comparisonRoutes);   // /rfqs/:rfqId/comparison
app.use(`${api}/approvals`,     approvalRoutes);
app.use(`${api}/purchase-orders`, poRoutes);
app.use(`${api}/invoices`,      invoiceRoutes);
app.use(`${api}/grns`,          grnRoutes);
app.use(`${api}/activity-logs`, activityLogRoutes);
app.use(`${api}/notifications`, notificationRoutes);
app.use(`${api}/dashboard`,     dashboardRoutes);
app.use(`${api}/reports`,       reportRoutes);

app.use(errorHandler);

export default app;
```

### `src/index.ts`

```typescript
import app from './app';
import { env } from './config/env';
import prisma from './config/db';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');
    app.listen(env.PORT, () => {
      console.log(`VendorBridge API running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
};

start();
```

---

## PHASE 16 — Seed Data

`prisma/seed.ts` — run with `npm run db:seed`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // Create users
  const admin   = await prisma.user.create({ data: { firstName: 'Admin',   lastName: 'User',   email: 'admin@vb.com',   passwordHash: await hash('Admin@123'),   role: 'ADMIN'               } });
  const officer = await prisma.user.create({ data: { firstName: 'Priya',   lastName: 'Sharma', email: 'officer@vb.com', passwordHash: await hash('Officer@123'), role: 'PROCUREMENT_OFFICER' } });
  const manager = await prisma.user.create({ data: { firstName: 'Rahul',   lastName: 'Mehta',  email: 'manager@vb.com', passwordHash: await hash('Manager@123'), role: 'MANAGER'             } });
  const v1user  = await prisma.user.create({ data: { firstName: 'Vendor',  lastName: 'One',    email: 'vendor1@vb.com', passwordHash: await hash('Vendor@123'),  role: 'VENDOR'              } });
  const v2user  = await prisma.user.create({ data: { firstName: 'Vendor',  lastName: 'Two',    email: 'vendor2@vb.com', passwordHash: await hash('Vendor@123'),  role: 'VENDOR'              } });

  // Create vendor profiles
  const vendor1 = await prisma.vendor.create({ data: { userId: v1user.id, companyName: 'SupplyNow Pvt Ltd',  category: 'Furniture',  gstNumber: '27AADCS0472N1Z1', contactPhone: '9876543210', status: 'ACTIVE' } });
  const vendor2 = await prisma.vendor.create({ data: { userId: v2user.id, companyName: 'OfficePro Supplies', category: 'Furniture',  gstNumber: '29AADCO4396N1Z6', contactPhone: '9876543211', status: 'ACTIVE' } });

  // Create a sample RFQ
  await prisma.rFQ.create({
    data: {
      title: 'Office Furniture Procurement Q2',
      category: 'Furniture',
      description: 'Ergonomic chairs and standing desks for the new floor',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdById: officer.id,
      items: { create: [
        { itemName: 'Ergonomic Chair', quantity: 25, unit: 'NOS' },
        { itemName: 'Standing Desk',   quantity: 10, unit: 'NOS' },
      ]},
      vendorInvites: { create: [
        { vendorId: vendor1.id },
        { vendorId: vendor2.id },
      ]},
    },
  });

  console.log('Seed complete. Credentials:');
  console.log('  admin@vb.com   / Admin@123');
  console.log('  officer@vb.com / Officer@123');
  console.log('  manager@vb.com / Manager@123');
  console.log('  vendor1@vb.com / Vendor@123');
  console.log('  vendor2@vb.com / Vendor@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

---

## PHASE 17 — Build Order Checklist

Execute in this exact order to avoid missing dependencies:

```
[ ] Phase 0  — npm init, install packages, tsconfig, .env
[ ] Phase 1  — Copy schema.prisma, prisma migrate dev, prisma generate
[ ] Phase 2  — Create all folder + empty file structure
[ ] Phase 3  — db.ts, env.ts, express.d.ts, apiResponse, asyncHandler,
               errorHandler, validate, pagination, auditLog, calculateTax,
               generateNumber
[ ] Phase 4  — authenticate, authorize middlewares → auth validator →
               auth service → auth controller → auth routes
[ ] Phase 5  — vendor validator → vendor service → vendor controller → vendor routes
[ ] Phase 6  — rfq validator → rfq service → rfq controller → rfq routes
[ ] Phase 7  — quotation validator → quotation service → quotation controller →
               quotation routes
[ ] Phase 8  — comparison service → comparison controller → comparison routes
[ ] Phase 9  — approval validator → approval service → approval controller →
               approval routes
[ ] Phase 10 — po service → po controller → po routes (NO manual create endpoint)
[ ] Phase 11 — grn service → grn controller → grn routes
[ ] Phase 12 — pdf.service → email.service → invoice validator → invoice service →
               invoice controller → invoice routes
[ ] Phase 13 — notification service/controller/routes →
               activityLog service/controller/routes
[ ] Phase 14 — dashboard service/controller/routes →
               report service/controller/routes
[ ] Phase 15 — app.ts (mount all routers) → index.ts (boot server)
[ ] Phase 16 — prisma/seed.ts → npm run db:seed
[ ] VERIFY   — GET /health → 200 OK
               POST /api/v1/auth/login with seed credentials
               GET /api/v1/dashboard/summary
```

---

## Quick Reference — Role Permission Matrix

| Endpoint Area | ADMIN | OFFICER | MANAGER | VENDOR |
|---|:---:|:---:|:---:|:---:|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Register/Block Vendors | ✅ | ❌ | ❌ | ❌ |
| View Vendors | ✅ | ✅ | ❌ | Own |
| Create RFQ | ✅ | ✅ | ❌ | ❌ |
| Publish / Close RFQ | ✅ | ✅ | ❌ | ❌ |
| View RFQ | ✅ | ✅ | ✅ | Invited |
| Submit Quotation | ❌ | ❌ | ❌ | ✅ |
| Compare / Select Quotation | ✅ | ✅ | ✅ | ❌ |
| Approve / Reject | ✅ | ❌ | ✅ | ❌ |
| View POs | ✅ | ✅ | ✅ | Own |
| Create / Submit GRN | ✅ | ✅ | ❌ | ❌ |
| Generate Invoice | ✅ | ✅ | ❌ | ❌ |
| Send Invoice (email) | ✅ | ✅ | ❌ | ❌ |
| Mark Invoice Paid | ✅ | ❌ | ✅ | ❌ |
| Download Invoice PDF | ✅ | ✅ | ✅ | Own |
| View Reports | ✅ | Limited | ✅ | ❌ |
| View Activity Logs | ✅ | Own | Own | Own |

---

## Workflow State Reference

```
RFQ:        DRAFT → PUBLISHED → CLOSED / CANCELLED
                              ↑ (AMENDED stays PUBLISHED)

QUOTATION:  DRAFT → SUBMITTED → ACCEPTED / REJECTED / WITHDRAWN
                             → SUPERSEDED (on RFQ amendment)

APPROVAL:   PENDING → APPROVED → [auto] PO Created
                    → REJECTED → [notify officer]

PO:         ISSUED → PARTIALLY_RECEIVED → RECEIVED
                   → CANCELLED

GRN:        DRAFT → SUBMITTED → VERIFIED

INVOICE:    DRAFT → SENT → PAID
                  → OVERDUE
            DRAFT or OVERDUE → CANCELLED
```

---

*VendorBridge Backend Execution Guide — v1.0*  
*Aligned with: schema.prisma (final), API Architecture v2, Database Schema PDF, Problem Statement*
