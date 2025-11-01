import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Test - ElevenLabs vs Cartesia",
  description: "Compare ElevenLabs and Cartesia text-to-speech APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
