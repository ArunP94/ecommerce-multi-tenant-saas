import { type DefaultSession, type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cache } from "react";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.hashedPassword) return null;
        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          storeId: user.storeId ?? null,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if ("role" in user) {
          token.role = (user as { role: "SUPER_ADMIN" | "STORE_OWNER" | "STAFF" | "CUSTOMER" }).role;
        }
        if ("storeId" in user) {
          token.storeId = (user as { storeId: string | null }).storeId ?? null;
        }
        if ("image" in user && user.image) token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      const role = (token.role ?? "CUSTOMER") as "SUPER_ADMIN" | "STORE_OWNER" | "STAFF" | "CUSTOMER";
      session.user.role = role;
      session.user.storeId = token.storeId ?? null;
      session.user.id = token.sub ?? "";
      if (typeof token.image === "string" || token.image === null) {
        session.user.image = token.image ?? null;
      }
      return session;
    },
  },
};

export const auth = cache(() => getServerSession(authOptions));

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "SUPER_ADMIN" | "STORE_OWNER" | "STAFF" | "CUSTOMER";
      storeId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    storeId?: string | null;
    image?: string | null;
  }
}
