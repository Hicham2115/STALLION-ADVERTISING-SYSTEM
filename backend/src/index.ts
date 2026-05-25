import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';

process.on('unhandledRejection', (err: unknown) => { console.error('[unhandledRejection]', err); });
process.on('uncaughtException', (err: Error) => { console.error('[uncaughtException]', err.message); });

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import clientRoutes from './routes/clients';
import paymentRoutes from './routes/payments';
import expenseRoutes from './routes/expenses';
import leadRoutes from './routes/leads';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import serviceRoutes from './routes/services';
import chatRoutes from './routes/chat';
import portalRoutes from './routes/portal';
import portalAdminRoutes from './routes/portalAdmin';
import currencyRoutes from './routes/currency';
import meetingRoutes from './routes/meetings';
import crmRoutes from './routes/crm';
import masterRoutes from './routes/master';
import { initSocket } from './socket';
import { errorHandler, notFound } from './middleware/errorHandler';
import { syncRates, loadRatesFromDB } from './lib/currency';
import { schedule as cronSchedule } from 'node-cron';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Init Socket.io
initSocket(httpServer);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting — strict on auth endpoints, generous elsewhere
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, skipSuccessfulRequests: true, message: 'Too many login attempts, try again later' });
app.use('/api/auth/login', authLimiter);
app.use('/api/portal/login', authLimiter);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'production' ? 500 : 5000, message: 'Too many requests' }));

// Logging & parsing
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve uploads — requires valid JWT or portal token
app.use('/uploads', authenticate, express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/portal-admin', portalAdminRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/master', masterRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`\n🐎 Stallion API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
  // Run non-blocking — do not await, never block the event loop or exhaust the DB pool at startup
  loadRatesFromDB().catch((e) => console.warn('[startup] loadRatesFromDB failed:', e.message));
  setTimeout(() => {
    syncRates().catch((e) => console.warn('[startup] syncRates failed:', e.message));
  }, 5000);
  // Sync exchange rates every 6 hours
  cronSchedule('0 */6 * * *', () => { syncRates(); });
});

export default app;
