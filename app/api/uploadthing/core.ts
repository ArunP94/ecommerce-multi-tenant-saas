import { createUploadthing, type FileRouter } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";

const f = createUploadthing();

export const ourFileRouter = {
  avatar: f({ image: { maxFileCount: 1, maxFileSize: "4MB" } })
    .middleware(async () => {
      const session = await auth();
      if (!session || !session.user?.id) throw new Error("Unauthorized");

      const limiterResult = await rateLimit(`upload:avatar:${session.user.id}`, 10, 3600);
      if (!limiterResult.allowed) {
        throw new Error("Rate limit exceeded for avatar uploads");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.user.update({ where: { id: metadata.userId }, data: { image: file.url } });
      return { uploadedBy: metadata.userId, url: file.url };
    }),
  productImage: f({ image: { maxFileCount: 20, maxFileSize: "8MB" } })
    .middleware(async () => {
      const session = await auth();
      if (!session || !session.user?.id) throw new Error("Unauthorized");

      const limiterResult = await rateLimit(`upload:product:${session.user.id}`, 50, 3600);
      if (!limiterResult.allowed) {
        throw new Error("Rate limit exceeded for product image uploads");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
  storeHero: f({ image: { maxFileCount: 1, maxFileSize: "8MB" } })
    .middleware(async () => {
      const session = await auth();
      if (!session || !session.user?.id) throw new Error("Unauthorized");

      const limiterResult = await rateLimit(`upload:hero:${session.user.id}`, 10, 3600);
      if (!limiterResult.allowed) {
        throw new Error("Rate limit exceeded for store hero uploads");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
