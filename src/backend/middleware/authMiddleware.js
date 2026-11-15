import { verifyToken } from '../utils/jwt.js';
import { Admin } from '../models/Admin.js';
import { isMongoDBConnected } from '../config/db.js';

export const ADMIN_COOKIE_NAME = 'shopco_admin_token';

/**
 * Admin Authentication Middleware
 * Checks secure HTTP-only cookie first, then Authorization Bearer header.
 * Strictly prevents unauthenticated requests and customer tokens from accessing admin APIs.
 */
export const requireAdminAuth = async (req, res, next) => {
  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  const configuredEmail = process.env.ADMIN_EMAIL || 'admin@shopco.com';

  const cookieToken = req.cookies?.[ADMIN_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const adminKeyHeader = req.headers['x-admin-key'];

  let token = null;

  if (cookieToken) {
    token = String(cookieToken).trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1].trim();
  } else if (adminKeyHeader) {
    token = String(adminKeyHeader).trim();
  }

  // 1. Missing credentials
  if (!token) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Access denied: Admin authentication required. Please log in via POST /api/admin/login.',
      error: 'UNAUTHORIZED_ADMIN_ACCESS',
    });
  }

  // 2. Optional Admin Secret Key support if explicitly configured in environment
  if (configuredSecret && token === configuredSecret) {
    req.adminUser = {
      id: 'admin_secret_key_holder',
      email: configuredEmail,
    };
    return next();
  }

  // 3. Verify JWT Token
  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id || !decoded.email) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Authentication failed: Malformed or invalid admin token.',
        error: 'INVALID_ADMIN_TOKEN',
      });
    }

    // Explicitly block customer tokens from accessing admin routes
    if (decoded.tokenType === 'customer' || decoded.role === 'customer') {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Access forbidden: Administrator privileges required. Customer accounts cannot access admin endpoints.',
        error: 'FORBIDDEN_CUSTOMER_ACCESS_TO_ADMIN',
      });
    }

    if (decoded.tokenType !== 'admin' && decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Access forbidden: Invalid admin credentials.',
        error: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
      });
    }

    // Verify admin still exists in MongoDB Atlas if connected
    if (isMongoDBConnected() && String(decoded.id).match(/^[0-9a-fA-F]{24}$/)) {
      const adminExists = await Admin.findById(decoded.id).select('_id email');
      if (!adminExists) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Authentication failed: Admin account no longer exists.',
          error: 'ADMIN_NOT_FOUND',
        });
      }
      req.adminUser = {
        id: adminExists._id.toString(),
        email: adminExists.email,
      };
    } else {
      req.adminUser = {
        id: decoded.id,
        email: decoded.email,
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Admin session expired. Please log in again via POST /api/admin/login.',
        error: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Authentication failed: Invalid admin token.',
      error: 'INVALID_ADMIN_TOKEN',
    });
  }
};

/**
 * Customer Authentication Middleware
 * Protects customer-specific endpoints (Profile, Order History, etc.)
 */
export const requireCustomerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Authentication required. Please log in with your customer account.',
      error: 'UNAUTHORIZED_CUSTOMER_ACCESS',
      hint: 'Include header: "Authorization: Bearer <customer-jwt-token>" obtained from POST /api/customer/auth/login',
    });
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id || !decoded.email) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid customer authentication token.',
        error: 'INVALID_CUSTOMER_TOKEN',
      });
    }

    req.customerUser = {
      id: decoded.id,
      email: decoded.email.toLowerCase(),
      role: decoded.role || 'customer',
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Customer session expired. Please log in again.',
        error: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Authentication failed: Invalid token.',
      error: 'INVALID_CUSTOMER_TOKEN',
    });
  }
};

/**
 * Optional Customer Authentication Middleware
 * If a customer is logged in, attaches customerUser to request (e.g. during checkout)
 */
export const optionalCustomerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1].trim();
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.email) {
        req.customerUser = {
          id: decoded.id,
          email: decoded.email.toLowerCase(),
          role: decoded.role || 'customer',
          name: decoded.name,
        };
      }
    } catch {
      // Continue as guest
    }
  }

  next();
};
