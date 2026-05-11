"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Badge } from "@/components/ui/Badge"
import type { Role } from "@prisma/client"

interface SidebarProps {
  orgName: string
  userEmail: string
  role: Role
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Configs" },
]

const ROLE_VARIANT: Record<Role, "default" | "success" | "warning" | "destructive"> = {
  ADMIN: "destructive",
  EDITOR: "warning",
  VIEWER: "default",
}

export function Sidebar({ orgName, userEmail, role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
      {/* Org header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shrink-0">
          {orgName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {orgName}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={ROLE_VARIANT[role]}>{role}</Badge>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{userEmail}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
