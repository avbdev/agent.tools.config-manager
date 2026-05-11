"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ConfigRow } from "./ConfigRow"
import { ConfigRowSkeleton } from "@/components/ui/Skeleton"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
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

interface ConfigsResponse {
  data: ConfigItem[]
  nextCursor: string | null
  total: number
}

const ENV_OPTIONS = [
  { value: "", label: "All environments" },
  { value: "DEV", label: "DEV" },
  { value: "STAGING", label: "STAGING" },
  { value: "PROD", label: "PROD" },
]

async function fetchConfigs(params: {
  environment?: string
  cursor?: string
}): Promise<ConfigsResponse> {
  const searchParams = new URLSearchParams()
  if (params.environment) searchParams.set("environment", params.environment)
  if (params.cursor) searchParams.set("cursor", params.cursor)
  searchParams.set("limit", "20")

  const res = await fetch(`/api/configs?${searchParams.toString()}`)
  if (!res.ok) throw new Error("Failed to load configs")
  return res.json() as Promise<ConfigsResponse>
}

interface ConfigListProps {
  role: Role
}

export function ConfigList({ role }: ConfigListProps) {
  const [environment, setEnvironment] = useState("")
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [allItems, setAllItems] = useState<ConfigItem[]>([])

  const { data, isLoading, isError } = useQuery({
    queryKey: ["configs", { environment, cursor }],
    queryFn: () => fetchConfigs({ environment: environment || undefined, cursor }),
    placeholderData: (prev) => prev,
    select: (res) => {
      // Merge paginated results
      const merged = cursor
        ? [...allItems, ...res.data.filter((n) => !allItems.find((e) => e.id === n.id))]
        : res.data
      return { ...res, data: merged }
    },
  })

  const items = data?.data ?? []
  const nextCursor = data?.nextCursor ?? null
  const total = data?.total ?? 0

  function handleEnvChange(val: string) {
    setEnvironment(val)
    setCursor(undefined)
    setAllItems([])
  }

  function loadMore() {
    if (nextCursor) {
      setAllItems(items)
      setCursor(nextCursor)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isLoading ? "Loading…" : `${total} config${total !== 1 ? "s" : ""}`}
        </p>
        <div className="w-44">
          <Select
            value={environment}
            onValueChange={handleEnvChange}
            options={ENV_OPTIONS}
            placeholder="All environments"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {["Service", "Key", "Value", "Env", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-950">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="p-0">
                    <ConfigRowSkeleton />
                  </td>
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-red-500">
                  Failed to load configs. Please refresh the page.
                </td>
              </tr>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  No configs yet.{" "}
                  {role !== "VIEWER" && "Use the form above to add your first config."}
                </td>
              </tr>
            )}

            {items.map((config) => (
              <ConfigRow key={config.id} config={config} role={role} />
            ))}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </section>
  )
}
