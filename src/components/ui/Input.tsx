"use client"

import { InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className = "", id, ...props }, ref) => {
    const inputClass = [
      "w-full rounded-lg border px-3 py-2 text-sm transition-colors",
      "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
      "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      error
        ? "border-red-500 dark:border-red-400"
        : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600",
      className,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input ref={ref} id={id} className={inputClass} {...props} />
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  },
)
Input.displayName = "Input"
