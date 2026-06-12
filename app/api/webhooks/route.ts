import { whopsdk } from "@/lib/whop-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify the webhook is from Whop. `unwrap` validates the standard-webhooks
    // signature headers against the configured webhook key, then parses the body.
    const headers = Object.fromEntries(request.headers.entries());
    const event = whopsdk.webhooks.unwrap(body, { headers });

    // Handle membership events - access control
    switch (event.type) {
      case "membership.activated":
        // User subscribed or renewed - access granted automatically by Whop
        console.log("Membership activated:", event.data.id);
        break;

      case "membership.deactivated":
        // User cancelled or payment failed - Whop revokes access automatically
        console.log("Membership deactivated:", event.data.id);
        break;

      default:
        console.log("Unhandled webhook event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
