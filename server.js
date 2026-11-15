import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressApp } from './src/backend/app.js';
import { connectDB } from './src/backend/config/db.js';
import { notFoundHandler, errorHandler } from './src/backend/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Initialize Express App
  const app = createExpressApp();

  // 2. Connect to MongoDB Atlas via Mongoose
  await connectDB();

  // 3. Mount Vite dev middleware or serve static dist in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // In dev: API routes are handled first. All other non-API routes go through Vite
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 4. API 404 & Central Error Handling (runs for unmatched /api routes)
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  // 5. Start listening on PORT (default 3000)
  const server = http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================================');
    console.log('🛍️  Shop-Co Backend Server successfully started! (JavaScript ESM)');
    console.log(`🚀 Port: ${PORT} (Environment: ${process.env.NODE_ENV || 'development'})`);
    console.log(`🏥 Health Check:     http://localhost:${PORT}/api/health`);
    console.log(`🔐 Admin Auth API:   http://localhost:${PORT}/api/admin/login`);
    console.log(`👤 Customer API:     http://localhost:${PORT}/api/customer`);
    console.log(`👕 Products API:     http://localhost:${PORT}/api/products`);
    console.log(`🏷️  Categories API:   http://localhost:${PORT}/api/categories`);
    console.log(`📦 Orders API:       http://localhost:${PORT}/api/orders`);
    console.log(`📊 Dashboard API:    http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`🌱 Database Seed:    POST http://localhost:${PORT}/api/seed`);
    console.log('========================================================');
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('[Server Fatal Startup Error]', err);
  process.exit(1);
});
