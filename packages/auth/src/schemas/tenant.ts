import { z } from 'zod';

export const createTenantSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .regex(
        /^[a-z0-9-]+$/,
        'Slug can only contain lowercase letters, numbers, and hyphens',
      ),
  })
  .strict();

export type CreateTenantRequest = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z
  .object({
    name: z.string().min(1).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
  })
  .strict();

export type UpdateTenantRequest = z.infer<typeof updateTenantSchema>;
