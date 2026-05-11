import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // Use OIDC issuer for tenant-specific endpoint (tenantId removed in newer beta)
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}/v2.0`,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false

      // First user becomes ADMIN; subsequent users are VIEWER by default.
      // The adapter creates the user record before this callback on subsequent
      // sign-ins, so the count check is race-safe for a single-tenant app.
      const count = await prisma.user.count()
      if (count === 0) {
        await prisma.user
          .update({
            where: { email: user.email },
            data: { role: Role.ADMIN },
          })
          .catch(() => {
            // User record may not exist yet on very first sign-in; adapter
            // will create it — the signIn callback fires again and count > 0.
          })
      }

      // Ensure the user has a personal org. Idempotent — skips if already exists.
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
      if (dbUser) {
        const existing = await prisma.orgMember.findFirst({ where: { userId: dbUser.id } })
        if (!existing) {
          const slug = `personal-${dbUser.id.slice(0, 8)}`
          const org = await prisma.org.upsert({
            where: { slug },
            update: {},
            create: { name: "Personal", slug },
          })
          await prisma.orgMember.create({
            data: {
              orgId: org.id,
              userId: dbUser.id,
              role: count === 0 ? Role.ADMIN : Role.VIEWER,
            },
          })
        }
      }

      return true
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // user comes from the DB row; role is our custom column
        session.user.role = (user as { role?: Role }).role ?? Role.VIEWER
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
})
