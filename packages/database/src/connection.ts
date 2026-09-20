import mongoose from 'mongoose';

export async function connectDatabase(
  mongoUri: string,
): Promise<typeof mongoose> {
  if (!mongoUri) {
    throw new Error('MongoDB connection string is required');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  await mongoose.connect(mongoUri);

  console.log('MongoDB connected successfully');

  return mongoose;
}