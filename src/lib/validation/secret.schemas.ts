import { z } from "zod";

/**
 * Zod schemas for secrets vault API routes.
 */

export const createSecretSchema = z.object({
  projectId: z.string().cuid(),
  envId: z.string().cuid(),
  name: z.string().min(1).max(128),
  key: z
    .string()
    .min(2)
    .max(128)
    .regex(/^[A-Z0-9_]+$/, "Secret key must be SCREAMING_SNAKE_CASE"),
  rawValue: z.string().min(1).max(65536),
  description: z.string().max(500).default(""),
  tags: z.array(z.string().min(1).max(32)).max(20).default([]),
  expiresAt: z.coerce.date().optional(),
});

export const updateSecretSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(128).optional(),
  rawValue: z.string().min(1).max(65536).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const revealSecretSchema = z.object({
  id: z.string().cuid(),
});

export const listSecretsQuerySchema = z.object({
  projectId: z.string().cuid(),
  envId: z.string().cuid().optional(),
  search: z.string().max(128).optional(),
  tag: z.string().max(32).optional(),
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
export type UpdateSecretInput = z.infer<typeof updateSecretSchema>;
export type RevealSecretInput = z.infer<typeof revealSecretSchema>;
export type ListSecretsQuery = z.infer<typeof listSecretsQuerySchema>;
