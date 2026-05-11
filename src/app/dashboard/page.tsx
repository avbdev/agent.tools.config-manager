import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  })

  if (!orgMember) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Setting up your account… please refresh in a moment.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Configs
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Signed in as {session.user.email} · Org: {orgMember.org.name} · Role: {orgMember.role}
      </p>
    </div>
  )
}
