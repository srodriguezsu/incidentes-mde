import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const titulo = Bricolage_Grotesque({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const geistSans = Geist({
  variable: "--font-cuerpo",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono-g",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Incidentes viales MDE",
  description: "Dónde y a qué hora ocurren los incidentes viales en Medellín, con datos abiertos de MEData.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${titulo.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
