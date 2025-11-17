import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { ApiResponse } from "@/lib/api/response-factory";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return ApiResponse.badRequest("Missing signature");
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return ApiResponse.badRequest(`Webhook Error: ${message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const orderId = session.metadata?.orderId;
          if (orderId) {
            await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
          }
          break;
        }
        case "payment_intent.succeeded": {
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
    }

    return ApiResponse.success({ received: true }, 200);
  } catch (error) {
    console.error("Webhook error:", error);
    return ApiResponse.internalError();
  }
}