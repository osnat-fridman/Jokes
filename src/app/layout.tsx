import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font, so browsers never contact Google.
const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "רגע של צחוק",
  description: "כתבו נושא וקבלו בדיחה קצרה ונקייה בעברית.",
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
