import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  let orgMember = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });

  /**
   * Lazy org creation — handles the race between the session callback writing
   * the user row and the first dashboard render. If no org membership exists
   * yet (e.g. very first sign-in), create a personal org and membership here
   * rather than redirecting, which would produce an infinite loop:
   *   /dashboard (no org → redirect "/") → / (session → redirect "/dashboard") → …
   */
  if (!orgMember) {
    const slug = `personal-${session.user.id.slice(0, 8)}`;
    const org = await prisma.org.upsert({
      where: { slug },
      update: {},
      create: { name: "Personal", slug },
    });
    orgMember = await prisma.orgMember.create({
      data: {
        orgId: org.id,
        userId: session.user.id,
        role: session.user.role as Role,
      },
      include: { org: true },
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        orgName={orgMember.org.name}
        userEmail={session.user.email ?? ""}
        role={orgMember.role}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar userEmail={session.user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
