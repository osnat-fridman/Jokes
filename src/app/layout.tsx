import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/ui/appInfo";
import "./globals.css";

// Self-hosted at build time by next/font, so browsers never contact Google.
const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  // Lets iPhone open the home-screen app standalone, under the Hebrew name.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

// Zoom is never locked, so users can enlarge text.
export const viewport: Viewport = {
  themeColor: "#F47FA8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={rubik.className}>{children}</body>
    </html>
  );
}
