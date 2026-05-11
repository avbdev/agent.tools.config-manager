import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import type { User } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}/v2.0`,
    }),
  ],
  callbacks: {
    /**
     * signIn fires BEFORE the PrismaAdapter creates the user record for new users.
     * Do NOT query the database here — the user row may not exist yet, causing
     * org creation to be silently skipped, which produces a redirect loop on
     * first sign-in (/dashboard → no orgMember → / → session exists → /dashboard…).
     *
     * All user setup (ADMIN promotion, org seeding) is handled in the session
     * callback, which fires after the adapter has persisted the user row.
     */
    async signIn({ user }) {
      return !!user.email
    },

    /**
     * session fires after the adapter has written the user row, so DB queries
     * here are safe. This is also the correct place for one-time setup because
     * it runs on every session validation — keeping signIn fast and non-blocking.
     *
     * First-user promotion: only re-checks when role is VIEWER (cheap) so the
     * count query is skipped for every request once the user is ADMIN/EDITOR.
     */
    async session({ session, user }) {
      if (!session.user || !user) return session

      const dbUser = user as User
      session.user.id = dbUser.id
      session.user.role = dbUser.role ?? Role.VIEWER

      // First-user admin promotion: only query count when role is still VIEWER
      // (avoids a full table scan on every authenticated request)
      if (dbUser.role === Role.VIEWER) {
        const total = await prisma.user.count()
        if (total === 1) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: Role.ADMIN },
          })
          session.user.role = Role.ADMIN
        }
      }

      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
})
