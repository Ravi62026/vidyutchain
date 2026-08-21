import { Router } from 'express';
import { signup, login, logout, verifyWalletMatch, createAdmin, adminLogin } from '../controllers/authController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify-wallet', verifyWalletMatch);
router.post('/create-admin', createAdmin);
router.post('/admin/login', adminLogin);

// Check authentication status
router.get('/check-auth', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      walletAddress: req.user.walletAddress,
      role: req.user.role,
      isAdmin: req.user.isAdmin
    }
  });
});

// Protected admin routes example
router.get('/admin/check', authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin authentication successful'
  });
});

export default router;
