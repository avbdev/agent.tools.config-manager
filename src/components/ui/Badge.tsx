"use client"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    outline:
      "bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
