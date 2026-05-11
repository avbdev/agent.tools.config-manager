"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/Toast"
import { canUpdate, canDelete, canReveal } from "@/lib/rbac"
import type { Role } from "@prisma/client"

interface ConfigItem {
  id: string
  service: string
  key: string
  value: string | null
  isSecret: boolean
  environment: "DEV" | "STAGING" | "PROD"
  updatedAt: string
}

const ENV_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  DEV: "default" as never,
  STAGING: "warning",
  PROD: "destructive",
}

const AUTO_MASK_MS = 30_000

interface ConfigRowProps {
  config: ConfigItem
  role: Role
}

export function ConfigRow({ config, role }: ConfigRowProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Reveal state — client-side only, never persisted
  const [revealedValue, setRevealedValue] = useState<string | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [rateLimitResetIn, setRateLimitResetIn] = useState<number | null>(null)

  // Auto-mask after 30 seconds (STORY-187 AC)
  useEffect(() => {
    if (!revealedValue) return
    const timer = setTimeout(() => setRevealedValue(null), AUTO_MASK_MS)
    return () => clearTimeout(timer)
  }, [revealedValue])

  const revealMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/configs/${config.id}/reveal`, { method: "POST" })
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10)
        setRateLimitResetIn(retryAfter)
        throw new Error(`Rate limit reached — try again in ${retryAfter}s`)
      }
      const json = await res.json() as { value?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? "Failed to reveal")
      return json.value!
    },
    onSuccess: (value) => {
      setRevealedValue(value)
      setRevealError(null)
      setRateLimitResetIn(null)
    },
    onError: (err: Error) => {
      setRevealError(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/configs/${config.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? "Failed to delete")
      }
    },
    onSuccess: () => {
      toast({ title: "Config deleted", variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["configs"] })
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete config", description: err.message, variant: "error" })
    },
  })

  const handleReveal = useCallback(() => {
    if (revealedValue) {
      // Already revealed — hide it (STORY-187: Hide button re-masks without server call)
      setRevealedValue(null)
    } else {
      setRevealError(null)
      revealMutation.mutate()
    }
  }, [revealedValue, revealMutation])

  const displayValue = config.isSecret
    ? revealedValue ?? "••••••••"
    : (config.value ?? "")

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <td className="px-4 py-3 text-sm font-mono text-zinc-700 dark:text-zinc-300">
        {config.service}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-zinc-700 dark:text-zinc-300">
        {config.key}
      </td>
      <td className="px-4 py-3 text-sm font-mono max-w-xs truncate">
        <span className={config.isSecret && !revealedValue ? "text-zinc-400 select-none" : "text-zinc-900 dark:text-zinc-100"}>
          {displayValue}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge variant={ENV_VARIANT[config.environment] ?? "default"}>
          {config.environment}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Reveal button — only for EDITOR+ and secret configs (STORY-185 + STORY-187) */}
          {config.isSecret && canReveal(role) && (
            <div className="flex flex-col items-end gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReveal}
                isLoading={revealMutation.isPending}
                disabled={!!rateLimitResetIn || revealMutation.isPending}
              >
                {revealedValue ? "Hide" : "Reveal"}
              </Button>
              {revealError && !rateLimitResetIn && (
                <span className="text-xs text-red-500">{revealError}</span>
              )}
              {rateLimitResetIn && (
                <span className="text-xs text-orange-500">
                  Rate limit — try in {rateLimitResetIn}s
                </span>
              )}
            </div>
          )}

          {/* Delete button — ADMIN only (STORY-185 AC) */}
          {canDelete(role) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Spinner className="h-3 w-3" /> : "Delete"}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
