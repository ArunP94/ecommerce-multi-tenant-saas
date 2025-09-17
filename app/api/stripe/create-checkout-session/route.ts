import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

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
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { storeId, orderId, currency, items } = parsed.data;

  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url,
      cancel_url,
      metadata: { storeId, ...(orderId ? { orderId } : {}) },
    });
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}