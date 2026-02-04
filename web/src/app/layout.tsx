import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twinkle | Gasless MNEE Payments for AI Agents",
  description: "The Universal MNEE Adoption Engine. Gasless payments and instant migration for AI agents. SDK and Middleware to unblock devs.",
  keywords: ["MNEE", "AI agents", "gasless payments", "SDK", "blockchain", "BSV"],
  authors: [{ name: "Twinkle Protocol" }],
  openGraph: {
    title: "Twinkle | Gasless MNEE Payments for AI Agents",
    description: "The Universal MNEE Adoption Engine. Gasless payments and instant migration for AI agents.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
