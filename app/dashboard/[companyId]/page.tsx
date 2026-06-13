import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Same token gate as the experience view: only render inside Whop.
  const user = await whopsdk.verifyUserToken(await headers(), { dontThrow: true });
  if (!user) {
    return (
      <div style={{
        background: "#0c0e12",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Oswald, sans-serif",
        color: "#f0f2f0",
        padding: 40,
      }}>
        <p style={{ fontSize: 14, letterSpacing: 1 }}>Please open this app through Whop.</p>
      </div>
    );
  }

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
      gap: 24,
    }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 28, color: "#fff", letterSpacing: 2 }}>Post</span>
          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 28, color: "#2F64EE", letterSpacing: 2 }}>Labs</span>
          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 14, color: "#4a5060", letterSpacing: 3, marginLeft: 10, textTransform: "uppercase" }}>Picks</span>
        </div>
        <p style={{ fontSize: 11, color: "#4a5060", letterSpacing: 2, textTransform: "uppercase" }}>Creator Dashboard</p>
      </div>
      <div style={{
        background: "#15181e",
        border: "1px solid rgba(255,255,255,.07)",
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#4a5060", textTransform: "uppercase" }}>Community Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "App", value: "PostLabs Picks" },
            { label: "Community ID", value: companyId.slice(0, 12) + "..." },
            { label: "Status", value: "✓ Active" },
            { label: "Version", value: "v1.0" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 8, color: "#4a5060", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "Anton, sans-serif", fontSize: 14, color: "#f0f2f0", letterSpacing: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.05)" }} />
        <div style={{ fontSize: 10, color: "#4a5060", letterSpacing: 1, lineHeight: 1.6 }}>
          Your members access <span style={{ color: "#2F64EE" }}>PostLabs Picks</span> through the app tab in your community.
        </div>
      </div>
      <p style={{ fontSize: 8, color: "#2a2f3a", letterSpacing: 2, textTransform: "uppercase" }}>PostLabs · Built for creators</p>
    </div>
  );
}