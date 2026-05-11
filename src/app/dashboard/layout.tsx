import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const orgMember = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });

  if (!orgMember) redirect("/");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userEmail={session.user.email ?? ""}
        userRole={orgMember.role}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar userEmail={session.user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
