import { z } from "zod";

/**
 * Zod schemas for config item API routes.
 */

const configKeyRegex = /^[A-Z0-9_\-.]+$/i;

export const valueTypeSchema = z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON", "URL", "SECRET_REF"]);

export const createConfigSchema = z.object({
  projectId: z.string().cuid(),
  envId: z.string().cuid(),
  key: z.string().min(2).max(128).regex(configKeyRegex, "Key must be alphanumeric with _ - . allowed"),
  valueType: valueTypeSchema,
  rawValue: z.string().min(0).max(65536),
  isSecret: z.boolean().default(false),
  description: z.string().max(500).default(""),
  tags: z.array(z.string().min(1).max(32)).max(20).default([]),
});

export const updateConfigSchema = z.object({
  id: z.string().cuid(),
  valueType: valueTypeSchema.optional(),
  rawValue: z.string().max(65536).optional(),
  isSecret: z.boolean().optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
});

export const listConfigsQuerySchema = z.object({
  projectId: z.string().cuid(),
  envId: z.string().cuid().optional(),
  search: z.string().max(128).optional(),
  tag: z.string().max(32).optional(),
  isSecret: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().min(1).max(200).default(50),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  projectId: z.string().cuid(),
});

export const rollbackSchema = z.object({
  configItemId: z.string().cuid(),
  targetVersion: z.number().int().positive(),
});

export type CreateConfigInput = z.infer<typeof createConfigSchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
export type ListConfigsQuery = z.infer<typeof listConfigsQuerySchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type RollbackInput = z.infer<typeof rollbackSchema>;
