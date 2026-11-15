import 'dotenv/config';
import mongoose from 'mongoose';
import { Admin } from '../models/Admin.js';

/**
 * Secure Admin Seed Script
 * Creates the initial Shop-Co admin account in MongoDB Atlas
 * using ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.
 *
 * Usage:
 *   npm run seed:admin
 */
async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
    console.error('[Seed Admin Error] MONGODB_URI is not configured in your .env file.');
    process.exit(1);
  }

  if (!adminEmail || !adminPassword) {
    console.error('[Seed Admin Error] ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    console.error('[Seed Admin Error] ADMIN_EMAIL must be a valid email address.');
    process.exit(1);
  }

  if (adminPassword.length < 6) {
    console.error('[Seed Admin Error] ADMIN_PASSWORD must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    console.log('[Seed Admin] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[Seed Admin] Connected to MongoDB Atlas.');

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (process.argv.includes('--reset')) {
        existingAdmin.password = adminPassword;
        await existingAdmin.save();
        console.log(`[Seed Admin] Updated password (bcrypt hashed) for existing admin: ${existingAdmin.email}`);
      } else {
        console.log(`[Seed Admin] Admin account already exists for email: ${existingAdmin.email}`);
        console.log('[Seed Admin] Tip: Run with --reset flag to rotate the admin password from .env.');
      }
    } else {
      const createdAdmin = await Admin.create({
        email: adminEmail,
        password: adminPassword, // Automatically hashed with bcrypt by pre-save hook
      });
      console.log(`[Seed Admin] Created first admin account securely in MongoDB Atlas: ${createdAdmin.email}`);
    }

    await mongoose.disconnect();
    console.log('[Seed Admin] Done. Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Admin Failure]', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedAdmin();
