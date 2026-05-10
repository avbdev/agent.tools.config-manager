import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

/**
 * Protected dashboard shell layout.
 *
 * Server component — performs session check before rendering any child page.
 * Any unauthenticated request is redirected to the login page.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={user.email} userRole={user.role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
