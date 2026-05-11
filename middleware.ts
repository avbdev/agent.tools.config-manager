import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/", "/api/auth", "/api/health"]

export default auth((req) => {
  // next-auth v5 wraps the request: the session is available as req.auth
  const { nextUrl } = req as NextRequest & { auth: unknown }
  const session = (req as { auth: unknown }).auth

  const isPublic = PUBLIC_PATHS.some(
    (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/"),
  )

  if (!isPublic && !session) {
    if (nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Attach a per-request CSP nonce so Next.js inline scripts can be allow-listed
  // without 'unsafe-inline'. The nonce is forwarded via the x-nonce response
  // header so Server Components can read it with headers().
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    `connect-src 'self' https://login.microsoftonline.com https://*.msftauth.net https://*.msauth.net`,
    `img-src 'self' data: https://graph.microsoft.com`,
    `frame-src 'self' https://login.microsoftonline.com`,
    `form-action 'self' https://login.microsoftonline.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ")

  const response = NextResponse.next()
  response.headers.set("x-nonce", nonce)
  response.headers.set("Content-Security-Policy", cspHeader)
  return response
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
