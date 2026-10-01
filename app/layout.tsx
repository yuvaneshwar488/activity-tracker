import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Activity Tracker",
  description: "Daily activities, reminders and progress tracker",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
