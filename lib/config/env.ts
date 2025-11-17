import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().describe("MongoDB connection string"),
  NEXTAUTH_URL: z.string().url().optional().describe("NextAuth callback URL"),
  NEXTAUTH_SECRET: z.string().min(32).describe("NextAuth secret key"),
  MAIL_HOST: z.string().optional().describe("SMTP host for email"),
  MAIL_PORT: z.coerce.number().optional().describe("SMTP port"),
  MAIL_USER: z.string().optional().describe("SMTP username"),
  MAIL_PASS: z.string().optional().describe("SMTP password"),
  STRIPE_SECRET_KEY: z.string().optional().describe("Stripe API secret key"),
  STRIPE_WEBHOOK_SECRET: z.string().optional().describe("Stripe webhook signing secret"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().describe("Upstash Redis REST URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().describe("Upstash Redis REST token"),
  UPLOADTHING_TOKEN: z.string().optional().describe("UploadThing API token"),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missing = Object.entries(errors)
      .filter(([, msgs]) => msgs?.some(m => m.includes("required")))
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    console.error("Environment validation failed:", parsed.error.flatten());
    throw new Error("Invalid environment variables");
  }

  validatedEnv = parsed.data;
  return validatedEnv;
}

export const env = getEnv();
