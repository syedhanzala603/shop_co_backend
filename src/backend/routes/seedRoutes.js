import { Router } from 'express';
import { seedDatabase, resetDatabase } from '../controllers/seedController.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Base: /api/seed
router.post('/', requireDatabase, seedDatabase);
router.post('/reset', requireDatabase, resetDatabase);

export default router;
