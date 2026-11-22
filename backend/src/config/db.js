const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let mongodInstance = null;

const connectDB = async (uri = env.MONGODB_URI) => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    logger.info(`MongoDB Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.warn(`Local MongoDB not reachable at ${uri} (${error.message}).`);
    logger.info(`Starting embedded in-memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      logger.info(`✅ Embedded MongoDB running at: ${inMemoryUri}`);

      const { runSeed } = require('../seed');
      if (runSeed) {
        logger.info(`🌱 Seeding default Meditrace data into in-memory database...`);
        await runSeed(inMemoryUri);
        logger.info(`✅ In-memory database ready with complete demo dataset.`);
      }
      return conn;
    } catch (memErr) {
      logger.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
      if (env.NODE_ENV !== 'test') {
        process.exit(1);
      }
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB Disconnected');
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      logger.info('Embedded MongoDB stopped');
    }
  } catch (error) {
    logger.error(`MongoDB Disconnection Error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
