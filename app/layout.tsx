import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ModalManager } from "@/components/ModalManager";

// Fallback to system fonts to avoid build ETIMEDOUT when fetching Google Fonts in restricted environments
const geistSansVar = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";
const geistMonoVar = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";


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
        className={`antialiased bg-moon-dark text-moon-text`}
        style={{
          // @ts-ignore
          "--font-geist-sans": geistSansVar,
          // @ts-ignore
          "--font-geist-mono": geistMonoVar
        } as React.CSSProperties}
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
