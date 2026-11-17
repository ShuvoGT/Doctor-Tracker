import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { protect } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.use(cors({ origin: origins, credentials: true }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check (public)
  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Public auth routes
  app.use('/api/auth', authRoutes);

  // Everything below requires a valid JWT.
  app.use('/api/doctors', protect, doctorRoutes);
  app.use('/api/patients', protect, patientRoutes);
  app.use('/api/dashboard', protect, dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
