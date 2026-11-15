import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { validateCreateProduct, validateUpdateProduct } from '../middleware/validateProduct.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Public routes: Anyone can browse products and view details
router.get('/', requireDatabase, getProducts);
router.get('/:id', requireDatabase, getProductById);

// Admin-only routes: Only authenticated admins can create, update, or delete products
router.post('/', requireAdminAuth, validateCreateProduct, requireDatabase, createProduct);
router.put('/:id', requireAdminAuth, validateUpdateProduct, requireDatabase, updateProduct);
router.delete('/:id', requireAdminAuth, requireDatabase, deleteProduct);

export default router;
