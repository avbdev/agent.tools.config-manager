"use client"

import * as RadixSelect from "@radix-ui/react-select"

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  label,
  error,
  disabled,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={[
            "flex h-9 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm",
            "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500"
              : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600",
          ].join(" ")}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <svg
              className="h-4 w-4 text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-default select-none items-center rounded-md px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:bg-blue-50 dark:focus:bg-zinc-800 data-[highlighted]:bg-blue-50 dark:data-[highlighted]:bg-zinc-800"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
