import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ModalManager } from "@/components/ModalManager";

// Configuración de fuentes de Google
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadatos de la aplicación (SEO, Título, etc.)
export const metadata: Metadata = {
  title: "Boletín360 - Sistema Académico",
  description: "Sistema de gestión académica",
};

// Layout Raíz: Envuelve a toda la aplicación
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-moon-dark text-moon-text`}
        suppressHydrationWarning
      >
        {/* Providers maneja el Contexto Global (Estado) de la App */}
        <Providers>
          {/* ModalManager maneja la visualización de todos los modales centralizadamente */}
          <ModalManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
