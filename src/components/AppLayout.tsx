"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOfficer } from "../context/OfficerContext";
import {
  LayoutDashboard,
  Radio,
  Users,
  Calculator,
  AlertTriangle,
  Car,
  Crosshair,
  FileText,
  Shield,
  GraduationCap,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Clock,
  Sparkles,
  Phone,
  Check,
} from "lucide-react";

interface NavGroup {
  name: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
  }[];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentOfficer, setCurrentOfficer, logout } = useOfficer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [departmentMode, setDepartmentMode] = useState<"POLICE" | "EMS">("POLICE");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // Check if current officer lacks a phone number on login
  React.useEffect(() => {
    if (
      currentOfficer &&
      (!currentOfficer.phone ||
        currentOfficer.phone.trim() === "" ||
        currentOfficer.phone === "555-")
    ) {
      const dismissed =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`lspd_phone_dismissed_${currentOfficer.id}`)
          : null;
      if (!dismissed) {
        setShowPhoneModal(true);
      }
    }
  }, [currentOfficer]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || !currentOfficer) return;
    setSavingPhone(true);
    try {
      const res = await fetch(`/api/officers/${currentOfficer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      if (res.ok) {
        setCurrentOfficer({ ...currentOfficer, phone: phoneInput.trim() });
        setShowPhoneModal(false);
      }
    } catch (err) {
      console.error("Error saving phone number:", err);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleDismissPhone = () => {
    if (currentOfficer) {
      sessionStorage.setItem(`lspd_phone_dismissed_${currentOfficer.id}`, "true");
    }
    setShowPhoneModal(false);
  };

  // On login page, render full screen without dashboard shell
  if (pathname === "/login") {
    return <main className="min-h-screen bg-[#07080f]">{children}</main>;
  }

  const navGroups: NavGroup[] = [
    {
      name: "PRINCIPAL",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/trombinoscope", label: "Trombinoscope", icon: Users },
        { href: "/radio-codes", label: "Codes & Fiches Mémo", icon: Radio },
      ],
    },
    {
      name: "GESTION",
      items: [
        { href: "/citizens", label: "Citoyens & Fiches", icon: Users },
        { href: "/calculator", label: "Contraventions & PV", icon: Calculator },
        { href: "/warrants", label: "Mandats & Avis BOLO", icon: AlertTriangle },
      ],
    },
    {
      name: "DOCUMENTS & REGISTRES",
      items: [
        { href: "/vehicles", label: "Véhicules (DMV)", icon: Car },
        { href: "/weapons", label: "Armes & Balistique", icon: Crosshair },
        { href: "/investigations", label: "Dossiers d'Enquête", icon: FileText },
      ],
    },
    {
      name: "PLANNING & FORMATION",
      items: [
        { href: "/trainings", label: "Planning Formations", icon: GraduationCap },
      ],
    },
    {
      name: "ADMINISTRATION",
      items: [
        { href: "/admin", label: "Gestion des Effectifs", icon: Settings },
      ],
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-[#07080f] text-slate-100 selection:bg-purple-600 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-[#090a14] border-r border-[#151728] flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Brand Header (Inspired by screenshot [+] EMS@fbfa.fr) */}
        <div className="p-4 border-b border-[#151728] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDepartmentMode(departmentMode === "POLICE" ? "EMS" : "POLICE")}
              title="Cliquer pour basculer LSPD / EMS"
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg transition-all ${
                departmentMode === "POLICE"
                  ? "bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 shadow-purple-900/40 hover:scale-105"
                  : "bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 shadow-pink-900/40 hover:scale-105"
              }`}
            >
              +
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide text-white">
                  {departmentMode === "POLICE" ? "POLICE@lspd.fr" : "EMS@samc.fr"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {departmentMode === "POLICE" ? "Système de Données Tactiques" : "Système de Gestion Médicale"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.name} className="space-y-1">
              <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <span>{group.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#181533] text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-950"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#101222]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Role Card (Inspired by screenshot RÔLE EFFECTIF) */}
        {currentOfficer && (
          <div className="p-3 border-t border-[#151728] bg-[#07080f]/90">
            <div className="p-3 rounded-2xl bg-[#0f1120] border border-[#1b1f35] space-y-2">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
                <span>Rôle Effectif</span>
                <span className="text-slate-500 font-mono">niv. 20</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  <span className="text-xs font-black text-white truncate">
                    {currentOfficer.rank}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                  #{currentOfficer.badgeNumber}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-[#1a1c30] flex items-center justify-between">
                <span>{currentOfficer.name}</span>
                <span className="text-slate-500">Accès Total</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 lg:pl-64 sm:lg:pl-72 flex flex-col min-w-0">
        {/* TOP HEADER BAR (Inspired by screenshot with Status, Logout & User Pill) */}
        <header className="sticky top-0 z-30 h-16 bg-[#080913]/95 backdrop-blur-md border-b border-[#151728] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger on mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#0f1120] border border-[#1b1f35] text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5 text-purple-400" />
            </button>

            {/* Quick Status Badge (● Système actif) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c1815] border border-emerald-900/50 text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span>Système actif</span>
            </div>
          </div>

          {/* Right Controls: Logout & User Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Logout Button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e0e13] border border-rose-900/60 hover:bg-rose-950 text-rose-300 hover:text-rose-100 text-xs font-bold transition-all shadow-sm"
              title="Fermer la session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xs:inline">Déconnexion</span>
            </button>

            {/* User Pill Card */}
            {currentOfficer && (
              <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-full bg-[#0e101f] border border-[#1f233f]">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-white leading-tight">
                    {currentOfficer.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    {currentOfficer.department === "US Marshal"
                      ? "US Marshal Service"
                      : departmentMode === "POLICE"
                      ? "Central Police LSPD"
                      : "Saint Fiacre Medical Center"}
                  </div>
                </div>

                {/* Initials Circle Avatar [HD] */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md border border-white/20">
                  {getInitials(currentOfficer.name)}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* FLOATING ACTION BUTTON (Inspired by purple [💬] button in screenshot) */}
        <Link
          href="/radio-codes"
          title="Consulter les codes radio et fiches réflexes"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-all"
        >
          <Radio className="w-5 h-5" />
        </Link>

        {/* First Connection / Missing Phone Onboarding Modal */}
        {showPhoneModal && currentOfficer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-[#0c0e1e] border border-purple-500/40 shadow-2xl p-6 sm:p-7 space-y-5 text-left relative overflow-hidden">
              {/* Background gradient decorative glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-900/40">
                  <Phone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 font-mono">
                      PREMIÈRE CONNEXION
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Numéro de Téléphone In-Game
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Bienvenue sur le MDT <strong>{currentOfficer.name}</strong> ! Renseignez votre numéro de téléphone en ville (RP) pour que vos collègues et la régulation puissent vous joindre en intervention.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePhone} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Numéro de téléphone en ville (In-Game)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="ex: 555-0188 ou 455-8912"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070814] border border-[#21274d] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ce numéro apparaîtra sur votre carte de service et dans le trombinoscope des effectifs.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#181c3b]">
                  <button
                    type="button"
                    onClick={handleDismissPhone}
                    className="px-4 py-2 rounded-xl bg-[#141730] hover:bg-[#1f2348] text-slate-400 hover:text-white text-xs font-bold transition-all"
                  >
                    Rappeler plus tard
                  </button>
                  <button
                    type="submit"
                    disabled={savingPhone || !phoneInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingPhone ? "Enregistrement..." : "Enregistrer mon numéro"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
