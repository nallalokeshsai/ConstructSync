import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendors';
import projectRoutes from './routes/projects';
import indentRoutes from './routes/indents';
import poRoutes from './routes/purchaseOrders';
import grnRoutes from './routes/grn';
import invoiceRoutes from './routes/invoices';
import rateRoutes from './routes/rates';
import analyticsRoutes from './routes/analytics';
import auditRoutes from './routes/audit';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents & GRN photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'ConstructSync API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/indents', indentRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ConstructSync Backend API running on http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
