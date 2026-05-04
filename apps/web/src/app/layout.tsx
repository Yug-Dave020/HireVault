import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is the design-system font for HireVault — clean, professional,
// widely legible across German/EU language characters.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HireVault — AI Job Intelligence",
  description:
    "AI-powered job scraper and CV generator for the German/EU market",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
