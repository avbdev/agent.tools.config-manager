import { NextRequest, NextResponse } from "next/server"

/**
 * @deprecated /api/settings is replaced by /api/configs (EPIC-123).
 * All methods return 301 Moved Permanently.
 */
function redirect(req: NextRequest) {
  const newUrl = req.nextUrl.clone()
  newUrl.pathname = req.nextUrl.pathname.replace("/api/settings", "/api/configs")
  return NextResponse.redirect(newUrl, { status: 301 })
}

export const GET = redirect
export const POST = redirect
export const PATCH = redirect
export const DELETE = redirect
