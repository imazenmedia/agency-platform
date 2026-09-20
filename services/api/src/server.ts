import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { connectDatabase } from '@agency-platform/database';
import { env, validateEnv } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { tenantsRouter } from './routes/tenants.js';

const app = express();

const PORT = env.PORT;

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/tenants', tenantsRouter);

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Agency Platform API is running',
    version: 'v1',
  });
});

// Example route to test errors, uncomment if needed for manual testing
// app.get('/api/v1/error', (_req, _res, next) => {
//   next(new AppError('This is a test error', 400, 'TEST_ERROR'));
// });

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

async function startServer() {
  try {
    // 1. Validate required environment variables
    validateEnv();

    // 2. Connect to the database
    // We validated DATABASE_URL exists in validateEnv, so we can safely cast it
    await connectDatabase(env.DATABASE_URL!);

    // 3. Only start listening after successful connection
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

startServer();
