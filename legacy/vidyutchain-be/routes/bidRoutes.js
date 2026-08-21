import express from 'express';
import {
  createBid,
  getBidsByTenderId,
  getBidsByBidder,
  getBidById,
  updateBid,
  deleteBid,
  awardBid,
  getUserBidForTender,
  getAllBids,
  processBidPayout
} from '../controllers/bidController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Bid routes - authentication is now handled in the controller
router.post('/', createBid);
router.get('/my-bids', authMiddleware, getBidsByBidder);

// Get all bids with pagination and filtering (admin only)
router.get('/all', authMiddleware, getAllBids);

// Get all bids for a tender
router.get('/tender/:id', authMiddleware, getBidsByTenderId);

// Get a user's bid for a specific tender
router.get('/user/:userId/tender/:tenderId', authMiddleware, getUserBidForTender);

// Award a bid
router.put('/tender/:id/award', authMiddleware, awardBid);

// Process payout for an accepted bid
router.post('/:id/payout', authMiddleware, processBidPayout);

// Generic bid routes - these must come AFTER the more specific routes
router.get('/:id', authMiddleware, getBidById);
router.put('/:id', authMiddleware, updateBid);
router.delete('/:id', authMiddleware, deleteBid);

export default router; 