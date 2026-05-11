"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useToast } from "@/components/ui/Toast"

interface ConfigPayload {
  service: string
  key: string
  value: string
  isSecret: boolean
  environment: "DEV" | "STAGING" | "PROD"
}

const ENV_OPTIONS = [
  { value: "DEV", label: "DEV" },
  { value: "STAGING", label: "STAGING" },
  { value: "PROD", label: "PROD" },
]

async function createConfig(data: ConfigPayload) {
  const res = await fetch("/api/configs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(
      (json as { error?: string }).error ??
        ((json as { issues?: string[] }).issues?.join(", ")) ??
        "Failed to save config",
    )
  }
  return json
}

export function AddConfigForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [service, setService] = useState("")
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")
  const [isSecret, setIsSecret] = useState(true)
  const [environment, setEnvironment] = useState<"DEV" | "STAGING" | "PROD">("PROD")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: createConfig,
    onSuccess: () => {
      toast({ title: "Config saved", variant: "success" })
      // Reset form
      setService("")
      setKey("")
      setValue("")
      setIsSecret(true)
      setEnvironment("PROD")
      setFieldErrors({})
      // Refresh the config list
      queryClient.invalidateQueries({ queryKey: ["configs"] })
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save config", description: err.message, variant: "error" })
    },
  })

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!service.trim()) errors.service = "Service is required"
    if (!key.trim()) errors.key = "Key is required"
    if (!value.trim()) errors.value = "Value is required"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({ service: service.trim(), key: key.trim(), value, isSecret, environment })
  }

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Add / Update Config
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Service"
          id="service"
          placeholder="e.g. stripe"
          value={service}
          onChange={(e) => setService(e.target.value)}
          error={fieldErrors.service}
        />
        <Input
          label="Key"
          id="key"
          placeholder="e.g. API_KEY"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          error={fieldErrors.key}
        />
        <Input
          label="Value"
          id="value"
          type={isSecret ? "password" : "text"}
          placeholder="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={fieldErrors.value}
        />
        <Select
          label="Environment"
          value={environment}
          onValueChange={(v) => setEnvironment(v as "DEV" | "STAGING" | "PROD")}
          options={ENV_OPTIONS}
        />
        <div className="sm:col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            Secret (encrypt value at rest)
          </label>
        </div>

        <div className="sm:col-span-2">
          <Button
            type="submit"
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Save Config
          </Button>
        </div>
      </form>
    </section>
  )
}
