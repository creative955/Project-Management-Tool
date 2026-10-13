import NextAuth, { type DefaultSession } from "next-auth";
import { encode as encodeJwt } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/server/db";
import { verifyPassword } from "./password";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Compared against when the email is unknown, so timing does not reveal accounts. */
const DUMMY_HASH = "$2b$12$9CoUGOcKeKwtD/ac.tsC3.Q7UYZtcunxNCJa2BnyTPyXONOvL3n0i";

export const isGoogleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const credentialsSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});

const adapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    // Always registered (Auth.js rejects credentials-only + database sessions);
    // the button is only shown when the env vars are present.
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.passwordHash || user.deletedAt || !ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider === "credentials") token.credentials = true;
      return token;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  jwt: {
    // Credentials sign-in always goes through jwt.encode; we create a real database
    // session instead so every login is a revocable row in `Session`.
    async encode(params) {
      if (params.token?.credentials) {
        if (!params.token.sub) throw new Error("Missing user id on credentials token");
        const sessionToken = crypto.randomUUID();
        await adapter.createSession!({
          sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
        });
        return sessionToken;
      }
      return encodeJwt(params);
    },
  },
});
