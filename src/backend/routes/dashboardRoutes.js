import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Base: /api/dashboard
// Protected: Only authenticated admins can view statistics
router.get('/stats', requireAdminAuth, requireDatabase, getDashboardStats);

export default router;
