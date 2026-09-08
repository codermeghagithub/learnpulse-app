import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnPulse — Know what you don't know",
  description:
    "LearnPulse uses adaptive learning and AI-powered diagnostics to identify your knowledge gaps, trace them to root causes, and build a personalized recovery plan.",
  keywords: ["adaptive learning", "AI tutoring", "knowledge gaps", "education", "SIH 2026"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
