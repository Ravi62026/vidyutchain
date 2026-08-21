import express from 'express';
import {
  createGrid,
  getAllGrids,
  getGridById,
  updateGrid,
  deleteGrid
} from '../controllers/gridController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Grid routes - authentication is now handled in the controller
router.post('/', createGrid);
router.get('/', getAllGrids);
router.get('/:id', getGridById);
router.put('/:id', updateGrid);
router.delete('/:id', deleteGrid);

export default router; 