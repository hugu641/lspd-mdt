"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOfficer } from "@/context/OfficerContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Shield,
  Users,
  Calculator,
  AlertTriangle,
  Car,
  FileText,
  GraduationCap,
  Radio,
  Crosshair,
  Settings,
  ChevronDown,
  UserCheck,
  Award,
  Menu,
  X,
  RadioTower,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentOfficer, allOfficers, setCurrentOfficer } = useOfficer();
  const { currentThemeConfig } = useTheme();

  // Mobile drawer & sheets state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOfficerMenu, setShowOfficerMenu] = useState(false);

  // Close mobile drawer upon route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Dispatch", icon: Radio },
    { href: "/citizens", label: "Citoyens", icon: Users },
    { href: "/calculator", label: "Contraventions", icon: Calculator },
    { href: "/warrants", label: "Mandats & BOLO", icon: AlertTriangle },
    { href: "/vehicles", label: "Véhicules", icon: Car },
    { href: "/weapons", label: "Armes", icon: Crosshair },
    { href: "/investigations", label: "Enquêtes", icon: FileText },
    { href: "/trainings", label: "Formations", icon: GraduationCap },
    { href: "/radio-codes", label: "Fiches Mémo", icon: Shield },
    { href: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090b10]/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button for Mobile / Tablet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-all focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5 text-theme-primary" />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl brand-badge-bg flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-105 transition-all">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-black drop-shadow-sm" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-wider text-white">LSPD</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-theme-primary-light text-theme-primary font-mono font-bold border border-theme-primary">
                    MDT
                  </span>
                </div>
                <div className="hidden xs:block text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide uppercase leading-none">
                  Los Santos Police
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "btn-theme-primary shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Controls, Theme, Status & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Selector */}
            <ThemeSwitcher />

            {/* Officer Profile & Switcher Trigger */}
            {currentOfficer && (
              <div className="relative">
                <button
                  onClick={() => setShowOfficerMenu(!showOfficerMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-left"
                >
                  <div className="relative">
                    <img
                      src={currentOfficer.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={currentOfficer.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-600"
                    />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-bold text-white flex items-center gap-1 leading-tight">
                      <span>{currentOfficer.name}</span>
                      <span className="text-[10px] font-mono text-theme-primary font-semibold">#{currentOfficer.badgeNumber}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                      {currentOfficer.rank}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-0.5" />
                </button>

                {/* Officer Switcher Dropdown */}
                {showOfficerMenu && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-800/80">
                      <div className="text-xs font-bold text-white">{currentOfficer.name}</div>
                      <div className="text-[11px] text-theme-primary font-medium">{currentOfficer.rank} • {currentOfficer.callsign}</div>
                      {currentOfficer.badges && currentOfficer.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {currentOfficer.badges.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-theme-primary-light text-theme-primary border border-theme-primary text-[9px] font-semibold"
                            >
                              <Award className="w-2.5 h-2.5" />
                              {b.course.badgeName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Changer d&apos;Agent (Test 1-Clic)</span>
                      <UserCheck className="w-3 h-3 text-slate-500" />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {allOfficers.map((officer) => (
                        <button
                          key={officer.id}
                          onClick={() => {
                            setCurrentOfficer(officer);
                            setShowOfficerMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                            currentOfficer.id === officer.id
                              ? "bg-slate-900 border border-theme-primary text-white"
                              : "hover:bg-slate-900 text-slate-300"
                          }`}
                        >
                          <img
                            src={officer.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                            alt={officer.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate flex items-center justify-between">
                              <span>{officer.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{officer.badgeNumber}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{officer.rank}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MOBILE SLIDE-OVER DRAWER MENU (Responsive Phone / Tablet)
          ===================================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-950 border-r border-slate-800 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg brand-badge-bg flex items-center justify-center text-black font-bold">
                    <Shield className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">LSPD MDT 2.0</div>
                    <div className="text-[10px] text-slate-400">Menu Tactique Mobile</div>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Officer Quick Badge in Drawer */}
              {currentOfficer && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentOfficer.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={currentOfficer.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {currentOfficer.name}
                      </div>
                      <div className="text-[11px] text-theme-primary font-medium">
                        {currentOfficer.rank} (#{currentOfficer.badgeNumber})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links List */}
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "btn-theme-primary shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions in Drawer */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[10px] text-center text-slate-500 font-mono">
                LSPD Mobile Data Terminal • v2.0
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
