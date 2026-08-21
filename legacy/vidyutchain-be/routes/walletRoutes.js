import { Router } from 'express';
import { getBalance } from '../controllers/walletController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Protected route - requires authentication
router.get('/balance', authMiddleware, getBalance);

export default router; 