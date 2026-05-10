import { NextResponse } from "next/server";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (user) {
    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      { action: "auth.logout", resource: `user:${user.id}`, resourceType: "User" },
    );
  }
  await destroySession();
  return NextResponse.redirect(new URL("/", req.url));
}
