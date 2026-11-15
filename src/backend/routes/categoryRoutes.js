import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Base: /api/categories
router.get('/', requireDatabase, getCategories);
router.get('/:id', requireDatabase, getCategoryById);

// Admin-only category management
router.post('/', requireAdminAuth, requireDatabase, createCategory);
router.put('/:id', requireAdminAuth, requireDatabase, updateCategory);
router.delete('/:id', requireAdminAuth, requireDatabase, deleteCategory);

export default router;
