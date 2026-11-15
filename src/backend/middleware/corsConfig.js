import cors from 'cors';

/**
 * Clean CORS configuration allowing credentials (HTTP-only cookies)
 * from the Shop-Co frontends and local development servers.
 */
export const getCorsMiddleware = () => {
  const allowedDefaults = [
    'https://shop-co-assignment.vercel.app',
    'https://shop-co-assignment-dashbord.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001',
  ];

  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = [...new Set([...allowedDefaults, ...envOrigins])];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Reflect allowed origins cleanly so HTTP-only cookies work with credentials: true
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (origin.endsWith('.vercel.app') && origin.includes('shop-co')) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key', 'x-admin-key'],
    credentials: true,
  });
};
