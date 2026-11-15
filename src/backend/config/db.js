import mongoose from 'mongoose';

let dbStatus = {
  connected: false,
  readyState: 0,
  statusText: 'Disconnected',
  host: null,
  name: null,
  error: null,
};

/**
 * Connect to MongoDB Atlas via Mongoose
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    const msg = 'MONGODB_URI is not set or still contains placeholder credentials in .env.';
    console.warn(`[MongoDB Warning] ${msg}`);
    console.warn('[MongoDB] Configure MONGODB_URI in your .env file to enable database operations.');
    dbStatus = {
      connected: false,
      readyState: 0,
      statusText: 'Unconfigured (Set MONGODB_URI in .env)',
      host: null,
      name: null,
      error: msg,
    };
    return dbStatus;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });

    dbStatus = {
      connected: true,
      readyState: conn.connection.readyState,
      statusText: 'Connected to MongoDB Atlas',
      host: conn.connection.host,
      name: conn.connection.name,
      error: null,
    };

    console.log(`[MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`);

    // Listen to connection drop/error events
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]', err);
      dbStatus.connected = false;
      dbStatus.readyState = mongoose.connection.readyState;
      dbStatus.statusText = 'Connection Error';
      dbStatus.error = err.message;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Disconnected] Lost connection to MongoDB Atlas.');
      dbStatus.connected = false;
      dbStatus.readyState = 0;
      dbStatus.statusText = 'Disconnected';
    });

    return dbStatus;
  } catch (error) {
    const errorMsg = error?.message || 'Failed to connect to MongoDB Atlas';
    console.error('[MongoDB Connection Failure]', errorMsg);

    dbStatus = {
      connected: false,
      readyState: 0,
      statusText: 'Connection Failed',
      host: null,
      name: null,
      error: errorMsg,
    };
    return dbStatus;
  }
}

/**
 * Retrieve current MongoDB connection status for health checks
 */
export function getDBStatus() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    dbStatus.connected = true;
    dbStatus.readyState = 1;
    dbStatus.statusText = 'Connected to MongoDB Atlas';
    dbStatus.host = mongoose.connection.host;
    dbStatus.name = mongoose.connection.name;
    dbStatus.error = null;
  }
  return dbStatus;
}

export function isMongoDBConnected() {
  return mongoose.connection?.readyState === 1;
}

/**
 * Middleware to ensure MongoDB Atlas is connected before running database queries
 */
export function requireDatabase(req, res, next) {
  if (!isMongoDBConnected()) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Database not connected. Please configure a valid MONGODB_URI in your .env file to connect to MongoDB Atlas.',
      error: 'DATABASE_NOT_CONNECTED',
    });
  }
  next();
}
