import { Router } from 'express';
import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerOrders,
} from '../controllers/customerController.js';
import { requireCustomerAuth } from '../middleware/authMiddleware.js';
import {
  validateCustomerRegister,
  validateCustomerLogin,
  validateCustomerProfileUpdate,
} from '../middleware/validateCustomer.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Base: /api/customer
// Public customer authentication endpoints
router.post('/auth/register', validateCustomerRegister, requireDatabase, registerCustomer);
router.post('/auth/login', validateCustomerLogin, requireDatabase, loginCustomer);

// Protected customer endpoints (Requires Customer JWT)
router.get('/profile', requireCustomerAuth, requireDatabase, getCustomerProfile);
router.put(
  '/profile',
  requireCustomerAuth,
  validateCustomerProfileUpdate,
  requireDatabase,
  updateCustomerProfile
);
router.get('/orders', requireCustomerAuth, requireDatabase, getCustomerOrders);

export default router;
