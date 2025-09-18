import { createUploadthing, type FileRouter } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  avatar: f({ image: { maxFileCount: 1, maxFileSize: "4MB" } })
    .middleware(async () => {
      const session = await auth();
      if (!session || !session.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Persist avatar URL to user.image
      await prisma.user.update({ where: { id: metadata.userId }, data: { image: file.url } });
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;