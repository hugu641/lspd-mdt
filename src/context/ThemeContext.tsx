"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeName = "gold" | "platinum" | "emerald" | "crimson" | "midnight";

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  icon: string;
  badge: string;
  primaryColor: string;
  desc: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: "gold",
    name: "Or Police & Carbone",
    icon: "🎖️",
    badge: "LSPD Gold",
    primaryColor: "#f59e0b",
    desc: "Insigne officiel en laiton doré & noir mat furtif",
  },
  {
    id: "platinum",
    name: "Titane & Platine",
    icon: "⚡",
    badge: "Stealth Titanium",
    primaryColor: "#e4e4e7",
    desc: "Monochrome minimaliste ultra-épuré et moderne",
  },
  {
    id: "emerald",
    name: "Tactique Commando",
    icon: "🌲",
    badge: "Night Ops",
    primaryColor: "#10b981",
    desc: "Vision nocturne et vert militaire discret",
  },
  {
    id: "crimson",
    name: "Unité d'Intervention",
    icon: "🚨",
    badge: "SWAT Crimson",
    primaryColor: "#ef4444",
    desc: "Rouge alerte haute intensité pour SWAT / Urgences",
  },
  {
    id: "midnight",
    name: "Nuit Furtive",
    icon: "🌌",
    badge: "Midnight Slate",
    primaryColor: "#38bdf8",
    desc: "Bleu nuit sombre et feutré (anti-reflet)",
  },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("gold");

  useEffect(() => {
    const saved = localStorage.getItem("lspd_mdt_theme") as ThemeName;
    if (saved && AVAILABLE_THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "gold");
    }
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("lspd_mdt_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const currentThemeConfig =
    AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
