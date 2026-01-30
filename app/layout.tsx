import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatita - Your Diabetes Companion",
  description: "A warm, caring companion to help you manage diabetes with simplicity and encouragement",
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
