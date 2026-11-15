import { Router } from 'express';
import { adminLogin, getAdminProfile, adminLogout } from '../controllers/authController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Base: /api/admin
// Strictly login, current session check, and logout (NO public registration)
router.post('/login', requireDatabase, adminLogin);
router.get('/me', requireAdminAuth, requireDatabase, getAdminProfile);
router.post('/logout', adminLogout);

export default router;
