/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/mail", () => ({ sendMail: jest.fn() }));

// Mock prisma with jest.fn methods created within the factory to avoid hoisting issues
jest.mock("@/lib/prisma", () => {
  const user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  const store = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };
  const passwordResetToken = { create: jest.fn() };
  return { prisma: { user, store, passwordResetToken } };
});

const { auth } = jest.requireMock("@/lib/auth") as { auth: jest.Mock };
const { sendMail } = jest.requireMock("@/lib/mail") as { sendMail: jest.Mock };
const { prisma } = jest.requireMock("@/lib/prisma") as { prisma: any };
const prismaUser = prisma.user;
const prismaStore = prisma.store;
const prismaPasswordResetToken = prisma.passwordResetToken;

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Super Admin Users API", () => {
    jest.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from("testtoken"));
  });

  describe("POST /api/super-admin/users/invite", () => {
    it("rejects non-super-admin", async () => {
      auth.mockResolvedValue({ user: { id: "u1", role: "STORE_OWNER" } });
      const { POST: invitePost } = await import("@/app/api/super-admin/users/invite/route");
      const res = await invitePost(jsonRequest({ email: "x@y.com", role: "STAFF", storeId: "s1" }));
      expect(res.status).toBe(403);
    });

    it("validates input", async () => {
      auth.mockResolvedValue({ user: { id: "u_admin", role: "SUPER_ADMIN" } });
      const { POST: invitePost } = await import("@/app/api/super-admin/users/invite/route");
      const res = await invitePost(jsonRequest({ role: "STAFF", storeId: "s1" }));
      expect(res.status).toBe(400);
    });

    it("404 when store not found", async () => {
      auth.mockResolvedValue({ user: { id: "u_admin", role: "SUPER_ADMIN" } });
      prismaStore.findUnique.mockResolvedValue(null);
      const { POST: invitePost } = await import("@/app/api/super-admin/users/invite/route");
      const res = await invitePost(jsonRequest({ email: "x@y.com", role: "STAFF", storeId: "s1" }));
      expect(res.status).toBe(404);
    });

    it("creates new STAFF user, generates token, sends email", async () => {
      auth.mockResolvedValue({ user: { id: "u_admin", role: "SUPER_ADMIN" } });
      prismaStore.findUnique.mockResolvedValue({ id: "s1", name: "Store One", ownerId: "owner0" });
      prismaUser.findUnique.mockResolvedValue(null); // user does not exist
      prismaUser.create.mockResolvedValue({ id: "u_new" });
      prismaPasswordResetToken.create.mockResolvedValue({});
      sendMail.mockResolvedValue(undefined);

      const { POST: invitePost } = await import("@/app/api/super-admin/users/invite/route");
      const res = await invitePost(jsonRequest({ email: "x@y.com", role: "STAFF", storeId: "s1" }));
      expect(res.status).toBe(200);

      expect(prismaUser.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: "x@y.com", role: "STAFF", storeId: "s1" }) })
      );
      expect(prismaPasswordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: "u_new", userEmail: "x@y.com" }) })
      );
      expect(sendMail).toHaveBeenCalled();
      expect(prismaStore.update).not.toHaveBeenCalled();
    });

    it("updates owner and store ownerId when inviting STORE_OWNER", async () => {
      auth.mockResolvedValue({ user: { id: "u_admin", role: "SUPER_ADMIN" } });
      prismaStore.findUnique.mockResolvedValue({ id: "s1", name: "Store One", ownerId: "owner0" });
      prismaUser.findUnique.mockResolvedValue(null);
      prismaUser.create.mockResolvedValue({ id: "u_owner" });

      const { POST: invitePost } = await import("@/app/api/super-admin/users/invite/route");
      const res = await invitePost(jsonRequest({ email: "o@y.com", role: "STORE_OWNER", storeId: "s1" }));
      expect(res.status).toBe(200);
      expect(prismaStore.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { ownerId: "u_owner" } });
    });
  });

  describe("GET /api/super-admin/users", () => {
    it("rejects non-super-admin", async () => {
      auth.mockResolvedValue({ user: { id: "u1", role: "STAFF" } });
      const { GET: usersGet } = await import("@/app/api/super-admin/users/route");
      // @ts-expect-error - GET signature is () => Promise<Response>
      const res: Response = await usersGet();
      expect(res.status).toBe(403);
    });

    it("returns users with mapped store names", async () => {
      auth.mockResolvedValue({ user: { id: "u_admin", role: "SUPER_ADMIN" } });
      prismaUser.findMany.mockResolvedValue([
        { id: "u1", email: "a@x.com", role: "STAFF", storeId: "s1", createdAt: new Date() },
        { id: "u2", email: "b@x.com", role: "STORE_OWNER", storeId: null, createdAt: new Date() },
      ]);
      prismaStore.findMany.mockResolvedValue([{ id: "s1", name: "Store One" }]);

      const { GET: usersGet } = await import("@/app/api/super-admin/users/route");
      // @ts-expect-error - GET signature is () => Promise<Response>
      const res: Response = await usersGet();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "a@x.com", storeName: "Store One" }),
          expect.objectContaining({ email: "b@x.com", storeName: null }),
        ])
      );
    });
  });
