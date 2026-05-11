"use client"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700 ${className}`}
      aria-hidden="true"
    />
  )
}

export function ConfigRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
      <div className="ml-auto flex gap-2">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  )
}
