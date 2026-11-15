import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController.js';
import { requireAdminAuth, optionalCustomerAuth } from '../middleware/authMiddleware.js';
import { requireDatabase } from '../config/db.js';

const router = Router();

// Base: /api/orders
// Public checkout endpoint for customer shopping website (attaches customerId if logged in)
router.post('/', optionalCustomerAuth, requireDatabase, createOrder);

// Admin-only: list all customer orders with pagination & filters
router.get('/', requireAdminAuth, requireDatabase, getOrders);

// View order details by ID or orderNumber
router.get('/:id', requireDatabase, getOrderById);

// Admin-only order management
router.put('/:id/status', requireAdminAuth, requireDatabase, updateOrderStatus);
router.put('/:id', requireAdminAuth, requireDatabase, updateOrder);
router.delete('/:id', requireAdminAuth, requireDatabase, deleteOrder);

export default router;
