import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photo Pro — Celtic Quest Fishing",
  description: "AI-powered photo publishing for Celtic Quest Fishing charters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)]">{children}</body>
    </html>
  );
}
