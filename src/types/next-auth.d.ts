import type { Role } from "@prisma/client"
import type { DefaultSession } from "next-auth"

/**
 * Extend the built-in session types so `session.user.id` and
 * `session.user.role` are available without casting throughout the app.
 *
 * See: https://authjs.dev/getting-started/typescript
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
}
