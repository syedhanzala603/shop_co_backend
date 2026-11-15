import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shopco_jwt_super_secret_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a new JWT token for a customer user
 */
export const signCustomerToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: 'customer',
      tokenType: 'customer',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Sign a new JWT token for an admin user (email + id only)
 */
export const signAdminToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      tokenType: 'admin',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Verify and decode any Shop-Co JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyAdminToken = verifyToken;
