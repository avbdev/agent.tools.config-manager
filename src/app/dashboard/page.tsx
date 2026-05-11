import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canCreate } from "@/lib/rbac"
import { ConfigList } from "@/components/ConfigList"
import { AddConfigForm } from "@/components/AddConfigForm"

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Configs
      </h1>

      {canCreate(orgMember.role) && <AddConfigForm />}

      <ConfigList role={orgMember.role} />
    </div>
  )
}
