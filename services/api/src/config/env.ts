import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we load the root .env file regardless of where the script is executed
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const portString = process.env.PORT;
const port = portString ? parseInt(portString, 10) : 5000;

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: isNaN(port) ? 5000 : port,
};

export function validateEnv() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables.');
  }

  if (isNaN(env.PORT) || env.PORT <= 0 || env.PORT > 65535) {
    throw new Error(`PORT is invalid: ${process.env.PORT}`);
  }
}
