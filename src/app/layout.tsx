import type { Metadata } from "next";
import "./globals.css";
import { OfficerProvider } from "../context/OfficerContext";
import { ThemeProvider } from "../context/ThemeContext";
import { AppLayout } from "../components/AppLayout";

export const metadata: Metadata = {
  title: "LSPD MDT - Terminal de Données Mobile",
  description: "Système MDT / CAD de police pour serveur GTARP - Contraventions, Dossiers citoyens, Formations et Dispatch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-[#07080f] selection:bg-purple-600 selection:text-white">
        <ThemeProvider>
          <OfficerProvider>
            <AppLayout>{children}</AppLayout>
          </OfficerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
