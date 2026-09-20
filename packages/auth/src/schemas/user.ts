import { z } from 'zod';

export const createUserSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    tenantId: z.string().nullable().optional(),
    roleIds: z.array(z.string()).optional(),
  })
  .strict();

export type CreateUserRequest = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    roleIds: z.array(z.string()).optional(),
  })
  .strict();

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
