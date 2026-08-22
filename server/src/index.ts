import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { APP_CONFIG } from './config/constants';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded invoice files
const uploadDir = path.join(process.cwd(), APP_CONFIG.UPLOAD_DIR);
app.use('/uploads', express.static(uploadDir));

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Invoice Fraud Detection System (India)',
    engine: 'Rule-Based Deterministic Scoring v1.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount All REST API Routes
app.use('/api', apiRouter);

// Centralized Error Handling Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🛡️  INVOICE FRAUD DETECTION SYSTEM (INDIA)`);
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📡  API Root: http://localhost:${PORT}/api`);
    console.log(`📂  Uploads: ${uploadDir}`);
    console.log(`====================================================`);
  });
}

export default app;
