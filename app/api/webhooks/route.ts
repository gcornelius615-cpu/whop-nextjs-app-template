import { whopsdk } from "@/lib/whop-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("whop-signature") || "";

    // Verify the webhook is from Whop
    const event = await whopsdk.verifyWebhook({
      payload: body,
      signature,
    });

    // Handle membership events - access control
    switch (event.action) {
      case "membership.went_valid":
        // User subscribed or renewed - access granted automatically by Whop
        console.log("Membership activated:", event.data.id);
        break;

      case "membership.went_invalid":
        // User cancelled or payment failed - Whop revokes access automatically
        console.log("Membership deactivated:", event.data.id);
        break;

      case "membership.created":
        console.log("New member:", event.data.id);
        break;

      default:
        console.log("Unhandled webhook event:", event.action);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
