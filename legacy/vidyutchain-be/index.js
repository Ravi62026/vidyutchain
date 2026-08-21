import express from 'express';
import connectDB from './db/connection.js';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import userRoutes from './routes/userRoutes.js';
import gridRoutes from './routes/gridRoutes.js';
import tenderRoutes from './routes/tenderRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import solarRoutes from './routes/solarRoutes.js';
import cookieParser from 'cookie-parser';
import corsMiddleware from './middleware/corsMiddleware.js';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { setupCronJobs, runInitialJobs } from './utils/cronJobs.js';
import logger from './utils/logger.js';
 
dotenv.config();

const app = express();
connectDB();

// Middleware
app.use(corsMiddleware); // Apply CORS before other middleware
// Trust reverse proxies (Render/Heroku) so secure cookies work correctly
app.set('trust proxy', 1);
app.use(morgan('dev')); // HTTP request logger
app.use(express.json({ limit: '50mb' })); // Increase JSON limit for larger payloads
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/user', userRoutes);

// Mount grid tendering routes
app.use('/api/grids', gridRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bids', bidRoutes);

// Keep the original mounting point for backward compatibility
app.use('/api/solar', solarRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.get('/', (req, res) => res.send('VidyutChain Backend Running 🚀'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  
  // Initialize cron jobs after server starts
  setupCronJobs();
  
  // Run initial job to handle any tenders that might have expired while server was down
  runInitialJobs().catch(err => {
    logger.error(`Error running initial jobs: ${err.message}`);
  });
});
