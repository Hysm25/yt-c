import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = {
  title: "YouTube Web Client",
  description:
    "Full-featured YouTube Web Client with independent UI, HTML5 video player, subscriptions, playlists, and watch history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="yt-ui-theme">
          <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
            <Shell>{children}</Shell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
