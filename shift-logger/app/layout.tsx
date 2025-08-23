import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tactical Shift Log",
  description: "A mobile-first MERN app for security shift logging.",
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