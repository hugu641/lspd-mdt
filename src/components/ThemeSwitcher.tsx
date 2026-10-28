"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, AVAILABLE_THEMES, ThemeName } from "../context/ThemeContext";
import { Palette, Check, ChevronDown } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme, currentThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all shadow-sm"
        title="Changer le thème visuel du MDT"
      >
        <span className="text-sm">{currentThemeConfig.icon}</span>
        <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
          {currentThemeConfig.name.split(" ")[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Palette className="w-4 h-4 text-theme-primary" />
              <span>Thème Visuel du Terminal</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">5 Styles</span>
          </div>

          <div className="p-1 space-y-1 mt-1">
            {AVAILABLE_THEMES.map((t) => {
              const isSelected = t.id === theme;

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-slate-900 border border-slate-700 text-white shadow-sm"
                      : "hover:bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Color dot */}
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: t.primaryColor }}
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <span className="text-[10px] opacity-70">{t.icon}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {t.desc}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-theme-primary flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-center text-slate-500">
            Préférence sauvegardée automatiquement
          </div>
        </div>
      )}
    </div>
  );
}
