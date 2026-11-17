import mongoose from 'mongoose';

let memoryServer = null;

// Connect to MongoDB. If MONGODB_URI is set we use it; otherwise we start an
// in-memory MongoDB so the app can run without a local database install.
export async function connectDB() {
  let uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('doctor_tracker');
    console.log('No MONGODB_URI set - started in-memory MongoDB (data resets on restart).');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: true, // build indexes defined on the schemas
  });

  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);

  return { usingMemoryServer: Boolean(memoryServer) };
}

export async function disconnectDB() {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
