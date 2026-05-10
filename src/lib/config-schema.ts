import { z } from "zod";

export const scopeSchema = z.object({
  global: z.string().min(1).default("global"),
  org: z.string().min(1),
  project: z.string().min(1),
  environment: z.string().min(1),
});

export const valueTypeSchema = z.enum(["string", "number", "boolean", "json"]);

export const configPayloadSchema = z.object({
  key: z.string().min(2).max(128).regex(/^[A-Z0-9_\-.]+$/i),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown())]),
  type: valueTypeSchema,
  isSecret: z.boolean().default(true),
  tags: z.array(z.string().min(1).max(24)).max(12).default([]),
  description: z.string().max(240).default(""),
  scope: scopeSchema,
});

export type ConfigPayload = z.infer<typeof configPayloadSchema>;

export function scopeToService(scope: z.infer<typeof scopeSchema>) {
  return `global:${scope.global}|org:${scope.org}|project:${scope.project}|env:${scope.environment}`;
}

export function serviceToScope(service: string) {
  const parts = service.split("|");
  const map = Object.fromEntries(parts.map((p) => p.split(":")));
  return {
    global: map.global || "global",
    org: map.org || "default",
    project: map.project || "default",
    environment: map.env || "dev",
  };
}

export function normalizeTypedValue(type: z.infer<typeof valueTypeSchema>, value: ConfigPayload["value"]) {
  if (type === "string") return String(value);
  if (type === "number") return Number(value);
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return Boolean(value);
  }
  if (typeof value === "string") {
    return JSON.parse(value);
  }
  return value;
}

export function serializeConfigPayload(payload: ConfigPayload) {
  return JSON.stringify({
    ...payload,
    value: normalizeTypedValue(payload.type, payload.value),
  });
}
