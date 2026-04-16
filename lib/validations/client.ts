import { z } from 'zod';

export const clientProfileSchema = z.object({
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  dependents: z.number().min(0).max(20).optional(),
  employment_status: z.enum(['employed', 'self_employed', 'retired', 'student', 'unemployed']).optional(),
  occupation: z.string().min(2).max(100).optional(),
  employer: z.string().min(2).max(100).optional(),
  annual_income: z.union([
    z.number().min(0).max(99999999),
    z.string(),
  ]).optional(),
  phone_number: z.string().regex(/^01[0-9]{8,9}$/, 'Invalid Malaysian phone (e.g., 0123456789)').optional(),
});

export const updateClientSchema = clientProfileSchema.partial();
