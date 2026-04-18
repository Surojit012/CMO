import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Providers } from "./providers";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cmo-five.vercel.app"),
  title: "CMO — Your AI Growth Team",
  description:
    "Drop in a URL. 5 AI agents analyze your website and deliver a complete growth strategy in 60 seconds. SEO, copy, conversion, distribution — all for $5.",
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
