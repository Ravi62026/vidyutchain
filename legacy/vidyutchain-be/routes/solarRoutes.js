import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  createInstallationRequest,
  getInstallationRequests,
  getInstallationById,
  updateInstallationStatus,
  getSolarSellers
} from '../controllers/solarController.js';

const router = Router();

// Product routes
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', authMiddleware, createProduct);
router.put('/products/:id', authMiddleware, updateProduct);
router.delete('/products/:id', authMiddleware, deleteProduct);
router.get('/seller/products', authMiddleware, getSellerProducts);
router.get('/seller/:sellerId/products', getSellerProducts);
router.get('/sellers', getSolarSellers);

// Installation routes
router.post('/installations', authMiddleware, createInstallationRequest);
router.get('/installations', authMiddleware, getInstallationRequests);
router.get('/installations/:id', authMiddleware, getInstallationById);
router.put('/installations/:id', authMiddleware, updateInstallationStatus);

export default router; 