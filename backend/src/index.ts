import app from './app';
import prisma from './config/db';
import { env } from './config/env';

const start = async () => {
  try {
    // Test database connectivity
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(env.PORT, () => {
      console.log(`🚀 VendorBridge API running → http://localhost:${env.PORT}`);
      console.log(`📖 Health check → http://localhost:${env.PORT}/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();
