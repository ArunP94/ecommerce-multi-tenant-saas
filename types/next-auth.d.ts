// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
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
