import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

// Route imports
import authRoutes         from './routes/auth.routes';
import userRoutes         from './routes/user.routes';
import vendorRoutes       from './routes/vendor.routes';
import rfqRoutes          from './routes/rfq.routes';
import comparisonRoutes   from './routes/comparison.routes';
import quotationRoutes    from './routes/quotation.routes';
import approvalRoutes     from './routes/approval.routes';
import poRoutes           from './routes/purchaseOrder.routes';
import grnRoutes          from './routes/grn.routes';
import invoiceRoutes      from './routes/invoice.routes';
import notificationRoutes from './routes/notification.routes';
import activityLogRoutes  from './routes/activityLog.routes';
import dashboardRoutes    from './routes/dashboard.routes';
import reportRoutes       from './routes/report.routes';

const app = express();
const api = '/api/v1';

// Core middleware
app.use(cors({ origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routes
app.use(`${api}/auth`,          authRoutes);
app.use(`${api}/users`,         userRoutes);
app.use(`${api}/vendors`,       vendorRoutes);
app.use(`${api}/rfqs`,          rfqRoutes);
app.use(`${api}/rfqs`,          comparisonRoutes);   // Nested under /rfqs/:rfqId/...
app.use(`${api}/quotations`,    quotationRoutes);
app.use(`${api}/approvals`,     approvalRoutes);
app.use(`${api}/purchase-orders`, poRoutes);
app.use(`${api}/grns`,          grnRoutes);
app.use(`${api}/invoices`,      invoiceRoutes);
app.use(`${api}/notifications`, notificationRoutes);
app.use(`${api}/activity-logs`, activityLogRoutes);
app.use(`${api}/dashboard`,     dashboardRoutes);
app.use(`${api}/reports`,       reportRoutes);

// Global error handler — must be last
app.use(errorHandler);

export default app;
