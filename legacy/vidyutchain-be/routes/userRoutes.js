import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/update', updateProfile);

export default router; 