import { Admin } from '../models/Admin.js';
import { ADMIN_COOKIE_NAME } from '../middleware/authMiddleware.js';

const getAdminCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

/**
 * @route   POST /api/admin/login (and alias POST /api/auth/admin-login)
 * @desc    Authenticate admin with email and password only, set HTTP-only cookie & return JWT
 * @access  Public
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || email.trim().length === 0 || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Please provide a valid email address.',
      });
    }

    // Verify email against admin stored in MongoDB Atlas
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid email or password. No administrator account found with that email.',
      });
    }

    // Verify password against bcrypt hash
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid email or password. Incorrect password.',
      });
    }

    // Sign JWT and set secure HTTP-only cookie
    const token = admin.generateAuthToken();
    res.cookie(ADMIN_COOKIE_NAME, token, getAdminCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Admin logged in successfully.',
      token,
      tokenType: 'Bearer',
      expiresIn: '7d',
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/me (and alias GET /api/auth/me)
 * @desc    Get currently authenticated admin (email & id only)
 * @access  Private / Admin
 */
export const getAdminProfile = async (req, res, next) => {
  try {
    const adminUser = req.adminUser;
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Not authenticated.',
      });
    }

    if (String(adminUser.id).match(/^[0-9a-fA-F]{24}$/)) {
      const admin = await Admin.findById(adminUser.id).select('_id email createdAt updatedAt');
      if (admin) {
        return res.status(200).json({
          success: true,
          admin: {
            id: admin._id,
            email: admin.email,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/logout (and alias POST /api/auth/logout)
 * @desc    Clear HTTP-only admin authentication cookie
 * @access  Public / Admin
 */
export const adminLogout = (req, res) => {
  const { maxAge, ...clearOptions } = getAdminCookieOptions();
  res.clearCookie(ADMIN_COOKIE_NAME, clearOptions);

  return res.status(200).json({
    success: true,
    message: 'Admin logged out successfully.',
  });
};
