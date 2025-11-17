import { auth } from "@/lib/auth";
import { ApiResponse } from "@/lib/api/response-factory";
import type { DefaultSession } from "next-auth";

export type UserRole = "SUPER_ADMIN" | "STORE_OWNER" | "STAFF" | "CUSTOMER";

export interface AuthSession extends DefaultSession {
  user: DefaultSession["user"] & {
    id: string;
    role: UserRole;
    storeId?: string | null;
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session as AuthSession;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireSuperAdmin() {
  return requireRole(["SUPER_ADMIN"]);
}

export async function requireStoreAccess(storeId: string) {
  const session = await requireAuth();
  const userRole = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  if (userRole !== "SUPER_ADMIN" && userStoreId !== storeId) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function requireStoreOwnerOrStaff() {
  return requireRole(["SUPER_ADMIN", "STORE_OWNER", "STAFF"]);
}

export async function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return ApiResponse.unauthorized();
    }
    if (error.message === "FORBIDDEN") {
      return ApiResponse.forbidden();
    }
  }
  throw error;
}
