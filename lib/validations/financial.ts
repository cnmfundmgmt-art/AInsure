import { z } from 'zod';

export const createSnapshotSchema = z.object({
  monthly_income: z.number().positive('Monthly income must be positive').finite(),
  monthly_expenses: z.number().min(0, 'Expenses cannot be negative').finite(),
  emergency_fund: z.number().min(0).optional(),
});

export const createAssetSchema = z.object({
  asset_type: z.enum(['cash', 'property', 'equity', 'fixed_income', 'crypto', 'retirement', 'others']),
  name: z.string().min(1, 'Name is required').max(200),
  value: z.number().min(0, 'Value cannot be negative').finite(),
});

export const createLiabilitySchema = z.object({
  liability_type: z.enum(['mortgage', 'car', 'personal', 'credit_card', 'education', 'others']),
  name: z.string().min(1, 'Name is required').max(200),
  amount: z.number().min(0, 'Amount cannot be negative').finite(),
  interest_rate: z.number().min(0).max(100).optional(),
});

export const snapshotIdSchema = z.object({
  id: z.string().uuid(),
});

export const assetIdSchema = z.object({
  id: z.string().uuid(),
});

export const liabilityIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateSnapshot = z.infer<typeof createSnapshotSchema>;
export type CreateAsset = z.infer<typeof createAssetSchema>;
export type CreateLiability = z.infer<typeof createLiabilitySchema>;
