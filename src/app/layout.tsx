import type { Metadata } from "next";
import "./globals.css";
import { OfficerProvider } from "@/context/OfficerContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/Navbar";

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
      <body className="min-h-screen flex flex-col selection:bg-amber-500 selection:text-black">
        <ThemeProvider>
          <OfficerProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
            <footer className="border-t border-slate-900/80 bg-[#05060a] py-4 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-mono text-slate-400">Terminal Furtif LSPD • Connecté au réseau central</span>
                </div>
                <div>Système multi-thèmes actif • Base SQLite locale • Prêt pour extension EMS</div>
              </div>
            </footer>
          </OfficerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
