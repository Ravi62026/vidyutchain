import express from 'express';
import {
  createTender,
  getAllTenders,
  getTenderById,
  updateTender,
  deleteTender,
  openTender,
  closeTender
} from '../controllers/tenderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tender routes - authentication is now handled in the controller
router.post('/', createTender);
router.get('/', getAllTenders);
router.get('/:id', getTenderById);
router.put('/:id', updateTender);
router.delete('/:id', deleteTender);

// Special tender actions
router.put('/:id/open', openTender);
router.put('/:id/close', closeTender);

export default router; 