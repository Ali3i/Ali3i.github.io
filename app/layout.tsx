import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ali Alessa",
  description: "Ali Alessa - Personal Site",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  );
}
