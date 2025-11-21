import { createUploadthing, type FileRouter } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import type { Session } from "next-auth";

const SESSION_CACHE = new Map<string, { session: Session | null; timestamp: number }>();
const CACHE_TTL = 5000;

function getCachedSession(key: string) {
  const cached = SESSION_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.session;
  }
  SESSION_CACHE.delete(key);
  return null;
}

function setCachedSession(key: string, session: Session | null) {
  SESSION_CACHE.set(key, { session, timestamp: Date.now() });
}

const f = createUploadthing({
  errorFormatter: (err) => {
    console.error("Upload error:", err);
    return {
      message: err.message,
      code: err.code,
    };
  },
});

export const ourFileRouter = {
  avatar: f({ image: { maxFileCount: 1, maxFileSize: "2MB" } })
    .middleware(async () => {
      try {
        console.log("[Avatar] Middleware started");
        
        const cacheKey = "avatar_session";
        let session = getCachedSession(cacheKey);
        
        if (!session) {
          try {
            session = await getServerSession(authOptions);
            setCachedSession(cacheKey, session);
          } catch (sessionError) {
            console.error("[Avatar] Failed to get session:", sessionError instanceof Error ? sessionError.message : String(sessionError));
            throw new Error("Failed to authenticate session");
          }
        } else {
          console.log("[Avatar] Using cached session");
        }
        
        console.log("[Avatar] Session retrieved:", session ? `User: ${session.user?.id}` : "None");
        
        if (!session?.user?.id) {
          console.log("[Avatar] No user ID in session");
          throw new Error("Unauthorized");
        }

        console.log("[Avatar] Checking rate limit for user:", session.user.id);
        const limiterResult = await rateLimit(`upload:avatar:${session.user.id}`, 10, 3600);
        if (!limiterResult.allowed) {
          console.log("[Avatar] Rate limit exceeded");
          throw new Error("Rate limit exceeded for avatar uploads");
        }

        console.log("[Avatar] Middleware passed");
        return { userId: session.user.id };
      } catch (error) {
        console.error("[Avatar] Middleware error:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      prisma.user.update({ where: { id: metadata.userId }, data: { image: file.ufsUrl } }).catch((error) => {
        console.error("Failed to update user avatar:", error instanceof Error ? error.message : String(error));
      });
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
  productImage: f({ image: { maxFileCount: 20, maxFileSize: "4MB" } })
    .middleware(async () => {
      try {
        console.log("[ProductImage] Middleware started");
        
        const cacheKey = "product_session";
        let session = getCachedSession(cacheKey);
        
        if (!session) {
          try {
            session = await getServerSession(authOptions);
            setCachedSession(cacheKey, session);
          } catch (sessionError) {
            console.error("[ProductImage] Failed to get session:", sessionError instanceof Error ? sessionError.message : String(sessionError));
            throw new Error("Failed to authenticate session");
          }
        } else {
          console.log("[ProductImage] Using cached session");
        }
        
        if (!session?.user?.id) {
          throw new Error("Unauthorized");
        }

        const limiterResult = await rateLimit(`upload:product:${session.user.id}`, 50, 3600);
        if (!limiterResult.allowed) {
          throw new Error("Rate limit exceeded for product image uploads");
        }

        console.log("[ProductImage] Middleware passed");
        return { userId: session.user.id };
      } catch (error) {
        console.error("[ProductImage] Middleware error:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
  storeHero: f({ image: { maxFileCount: 1, maxFileSize: "4MB" } })
    .middleware(async () => {
      try {
        console.log("[StoreHero] Middleware started");
        
        const cacheKey = "hero_session";
        let session = getCachedSession(cacheKey);
        
        if (!session) {
          try {
            session = await getServerSession(authOptions);
            setCachedSession(cacheKey, session);
          } catch (sessionError) {
            console.error("[StoreHero] Failed to get session:", sessionError instanceof Error ? sessionError.message : String(sessionError));
            throw new Error("Failed to authenticate session");
          }
        } else {
          console.log("[StoreHero] Using cached session");
        }
        
        if (!session?.user?.id) {
          throw new Error("Unauthorized");
        }

        const limiterResult = await rateLimit(`upload:hero:${session.user.id}`, 10, 3600);
        if (!limiterResult.allowed) {
          throw new Error("Rate limit exceeded for store hero uploads");
        }

        console.log("[StoreHero] Middleware passed");
        return { userId: session.user.id };
      } catch (error) {
        console.error("[StoreHero] Middleware error:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
