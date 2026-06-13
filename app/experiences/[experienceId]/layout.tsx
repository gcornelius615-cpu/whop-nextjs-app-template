import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import ParlayBuilder from "./page";

function AuthGate() {
  return (
    <div style={{
      background: "#0c0e12",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Oswald, sans-serif",
      color: "#f0f2f0",
      padding: 40,
      gap: 16,
      textAlign: "center",
    }}>
      <div>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 24, color: "#fff", letterSpacing: 2 }}>Post</span>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 24, color: "#2F64EE", letterSpacing: 2 }}>Labs</span>
        <span style={{ fontSize: 12, color: "#4a5060", letterSpacing: 3, marginLeft: 10, textTransform: "uppercase" }}>Picks</span>
      </div>
      <p style={{ fontSize: 14, letterSpacing: 1 }}>Please open this app through Whop.</p>
      <p style={{ fontSize: 11, color: "#8a93a5", letterSpacing: 1, maxWidth: 420, lineHeight: 1.6 }}>
        This app is available inside Whop communities. Open your community on whop.com and launch PostLabs Picks from the app tab.
      </p>
    </div>
  );
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params;

  // Verify the Whop user token from the request headers. The SDK reads the
  // `x-whop-user-token` JWT injected by Whop's iframe proxy and validates it
  // against this app's id; dontThrow returns null instead of throwing.
  const user = await whopsdk.verifyUserToken(await headers(), { dontThrow: true });
  if (!user) return <AuthGate />;

  return <ParlayBuilder />;
}
