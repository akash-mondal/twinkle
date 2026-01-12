import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Twinkle - Monetize Anything with MNEE",
  description: "Paywalls, subscriptions, and AI-ready payments for the decentralized web. Built on Ethereum with MNEE.",
  keywords: ["crypto payments", "MNEE", "paywalls", "subscriptions", "x402", "Web3", "AI payments"],
  authors: [{ name: "Twinkle" }],
  openGraph: {
    title: "Twinkle - Monetize Anything with MNEE",
    description: "Paywalls, subscriptions, and AI-ready payments for the decentralized web.",
    url: "https://tw1nkl3.rest",
    siteName: "Twinkle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Twinkle - Monetize Anything with MNEE",
    description: "Paywalls, subscriptions, and AI-ready payments for the decentralized web.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
