"use client"

import { Sidebar } from "./Sidebar"
import type { Role } from "@prisma/client"

interface AppShellProps {
  children: React.ReactNode
  orgName: string
  userEmail: string
  role: Role
}

export function AppShell({ children, orgName, userEmail, role }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <Sidebar orgName={orgName} userEmail={userEmail} role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-8">{children}</div>
      </main>
    </div>
  )
}
