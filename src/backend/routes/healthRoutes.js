import { Router } from 'express';
import { getDBStatus } from '../config/db.js';

const router = Router();
const startTime = Date.now();

/**
 * @route   GET /api/health
 * @desc    Comprehensive Health Check Endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`,
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    server: {
      framework: 'Express.js',
      runtime: 'Node.js (Pure JavaScript ES Modules)',
      port: process.env.PORT || 3000,
    },
    mongodb: dbStatus,
    api: {
      version: '1.0.0',
      service: 'Shop-Co E-Commerce Backend',
      endpoints: [
        '/api/health',
        '/api/admin/login',
        '/api/admin/me',
        '/api/admin/logout',
        '/api/customer/auth/register',
        '/api/customer/auth/login',
        '/api/customer/profile',
        '/api/customer/orders',
        '/api/products (Public GET with pagination & filters)',
        '/api/products (Admin POST protected)',
        '/api/products/:id (Public GET by id or slug)',
        '/api/products/:id (Admin PUT/DELETE protected)',
        '/api/categories',
        '/api/orders',
        '/api/orders/:id',
        '/api/orders/:id/status',
        '/api/dashboard/stats',
        '/api/seed',
      ],
      adminSecurity: {
        protectedEndpoints: [
          'GET /api/admin/me',
          'POST /api/products',
          'PUT /api/products/:id',
          'DELETE /api/products/:id',
          'POST /api/categories',
          'PUT /api/categories/:id',
          'DELETE /api/categories/:id',
          'GET /api/orders',
          'PUT /api/orders/:id',
          'PUT /api/orders/:id/status',
          'DELETE /api/orders/:id',
          'GET /api/dashboard/stats',
        ],
        authMethods: ['HTTP-only Cookie (shopco_admin_token)', 'Authorization: Bearer <token>'],
      },
    },
    cors: {
      allowedClients: [
        'https://shop-co-assignment.vercel.app (Customer Website)',
        'https://shop-co-assignment-dashbord.vercel.app (Admin Dashboard)',
      ],
      credentials: true,
    },
  });
});

export default router;
