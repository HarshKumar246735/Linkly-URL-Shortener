import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDB(uri) {
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
