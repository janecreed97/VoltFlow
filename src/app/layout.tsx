import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "../components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VoltFlow — Grid-Scale Battery Storage Economics",
  description:
    "Demystifying the economics of grid-scale battery storage: arbitrage, ancillary services, capacity markets, and revenue stacking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-slate-100 min-h-screen`}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
