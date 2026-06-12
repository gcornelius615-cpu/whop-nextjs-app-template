import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Anton, Oswald } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "PostLabs Picks",
  description: "Build and download custom parlay cards for TikTok, Reels, and YouTube Shorts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* crossOrigin="anonymous" on the stylesheet itself lets the export
            renderer read the font rules and embed real fonts in downloads */}
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;600;700&family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700;900&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${anton.variable} ${oswald.variable} antialiased`}>
        <WhopApp>{children}</WhopApp>
      </body>
    </html>
  );
}
