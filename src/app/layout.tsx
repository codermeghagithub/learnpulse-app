import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnPulse — Know what you don't know",
  description:
    "LearnPulse uses adaptive learning and AI-powered diagnostics to identify your knowledge gaps, trace them to root causes, and build a personalized recovery plan.",
  keywords: ["adaptive learning", "learning assistant", "knowledge gaps", "education", "student success"],
};

import { ToastProvider } from "@/components/ToastProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
