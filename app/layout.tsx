import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sietepixeles",
  description: "Tienda de ropa para mujeres con gestion autoadministrable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-[var(--color-cream)] text-[var(--color-ink)]">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
