const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Copy .env.example to .env and add your MongoDB connection string.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  const { host, name } = mongoose.connection;
  console.log(`[TaskFlow API] MongoDB connected — ${host}/${name}`);
  return mongoose.connection;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
