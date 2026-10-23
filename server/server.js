const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config(); // fallback to server/.env if present

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[TaskFlow API] listening on http://localhost:${PORT} (${NODE_ENV})`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[TaskFlow API] Port ${PORT} is already in use. Set PORT in .env.`);
      } else {
        console.error('[TaskFlow API] Server error:', error.message);
      }
      process.exit(1);
    });

    const shutdown = async (signal) => {
      console.log(`\n[TaskFlow API] ${signal} received — shutting down.`);
      server.close(async () => {
        await require('./config/db').disconnectDB();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 5000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(`[TaskFlow API] Failed to start: ${error.message}`);
    process.exit(1);
  }
}

start();
