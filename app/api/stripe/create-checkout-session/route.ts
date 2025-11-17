import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { ApiResponse } from "@/lib/api/response-factory";
import { env } from "@/lib/config/env";
import { rateLimit } from "@/lib/redis";

export const runtime = "nodejs";

const bodySchema = z.object({
  storeId: z.string(),
  orderId: z.string().optional(),
  currency: z.string().default("usd"),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const limiterResult = await rateLimit(`checkout:${clientIp}`, 30, 3600);

    if (!limiterResult.allowed) {
      return ApiResponse.tooManyRequests("Too many checkout requests. Please try again later.");
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return ApiResponse.validationError(parsed.error);
    }
    const { storeId, orderId, currency, items } = parsed.data;

    const origin = req.headers.get("origin") || env.NEXTAUTH_URL || "http://localhost:3000";
    const success_url = `${origin}/checkout/success`;
    const cancel_url = `${origin}/checkout/cancel`;

    const line_items = items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency,
        unit_amount: Math.round(i.price * 100),
        product_data: { name: i.name },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url,
      cancel_url,
      metadata: { storeId, ...(orderId ? { orderId } : {}) },
    });
    return ApiResponse.success({ id: session.id, url: session.url }, 200);
  } catch (err: unknown) {
    console.error("Checkout session error:", err);
    return ApiResponse.internalError();
  }
}